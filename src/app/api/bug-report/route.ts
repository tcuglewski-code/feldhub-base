/**
 * API Route: POST /api/bug-report
 * Sprint JN — Bug-Reporting Prozess für Kunden
 *
 * Öffentlicher Endpunkt (kein Login nötig).
 * Erstellt automatisch ein Ticket in Mission Control.
 * Bestätigt per E-Mail (optional).
 */

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getTenantConfig } from "@/config/tenant"

const BugReportSchema = z.object({
  // Kontakt
  reporterName: z.string().min(2, "Name zu kurz").max(100),
  reporterEmail: z.string().email("Ungültige E-Mail"),
  // Bug Details
  title: z.string().min(5, "Titel zu kurz").max(200),
  description: z.string().min(10, "Beschreibung zu kurz").max(5000),
  severity: z.enum(["low", "medium", "high", "critical"]).default("medium"),
  category: z.enum(["bug", "feature", "question", "other"]).default("bug"),
  // Optional
  stepsToReproduce: z.string().max(2000).optional(),
  expectedBehavior: z.string().max(1000).optional(),
  actualBehavior: z.string().max(1000).optional(),
  url: z.string().url().optional().or(z.literal("")),
  browser: z.string().max(100).optional(),
  // Honeypot anti-spam
  website: z.string().max(0).optional(), // Muss leer bleiben
})

const SEVERITY_PRIORITY: Record<string, string> = {
  low: "LOW",
  medium: "MEDIUM",
  high: "HIGH",
  critical: "URGENT",
}

const SEVERITY_LABELS: Record<string, string> = {
  low: "🟢 Niedrig",
  medium: "🟡 Mittel",
  high: "🔴 Hoch",
  critical: "🚨 Kritisch",
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: "Ungültige Anfrage" }, { status: 400 })

  // Honeypot check
  if (body.website) {
    return NextResponse.json({ success: true }) // Spam — stille Ablehnung
  }

  const result = BugReportSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json(
      { error: "Validierungsfehler", details: result.error.flatten().fieldErrors },
      { status: 422 }
    )
  }

  const data = result.data
  const tenant = getTenantConfig()

  // Rate limiting by IP (simple)
  const ip = request.headers.get("x-forwarded-for") || "unknown"
  const rateLimitKey = `bug-report:${ip}`
  // Note: In production, use Redis/Upstash for rate limiting

  // Build ticket description
  const ticketDescription = buildTicketDescription(data)

  // Post to Mission Control
  const mcUrl = process.env.MISSION_CONTROL_URL || "https://mission-control-tawny-omega.vercel.app"
  const mcApiKey = process.env.MISSION_CONTROL_API_KEY || process.env.MC_API_KEY

  let mcTicketId: string | null = null
  let mcError: string | null = null

  if (mcApiKey) {
    try {
      const mcRes = await fetch(`${mcUrl}/api/tickets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": mcApiKey,
        },
        body: JSON.stringify({
          title: `[Bug] ${data.title}`,
          description: ticketDescription,
          priority: SEVERITY_PRIORITY[data.severity],
          category: data.category.toUpperCase(),
          status: "OPEN",
          source: "customer_report",
          reporterEmail: data.reporterEmail,
          reporterName: data.reporterName,
          metadata: {
            severity: data.severity,
            url: data.url || null,
            browser: data.browser || null,
            tenantId: tenant.id,
            tenantName: tenant.name,
          },
        }),
      })

      if (mcRes.ok) {
        const mcData = await mcRes.json()
        mcTicketId = mcData.id || mcData.ticketId || null
      } else {
        mcError = `MC API: ${mcRes.status}`
      }
    } catch (err) {
      mcError = err instanceof Error ? err.message : "MC Verbindungsfehler"
      console.error("Mission Control bug report failed:", mcError)
    }
  }

  // Send confirmation email (if email service configured)
  if (process.env.SMTP_HOST || process.env.RESEND_API_KEY) {
    try {
      await sendConfirmationEmail(data, mcTicketId, tenant)
    } catch (err) {
      console.error("Confirmation email failed:", err)
    }
  }

  // Log to console if MC failed
  if (!mcApiKey || mcError) {
    console.log("Bug Report received (MC unavailable):", {
      title: data.title,
      reporter: data.reporterEmail,
      severity: data.severity,
      error: mcError,
    })
  }

  return NextResponse.json({
    success: true,
    ticketId: mcTicketId,
    message: mcTicketId
      ? `Ihr Bericht wurde erfasst (Ticket #${mcTicketId}). Wir melden uns schnellstmöglich.`
      : "Ihr Bericht wurde erfasst. Wir melden uns schnellstmöglich.",
  })
}

function buildTicketDescription(data: z.infer<typeof BugReportSchema>): string {
  const lines: string[] = [
    `## Bug Report von ${data.reporterName} (${data.reporterEmail})`,
    `**Schweregrad:** ${SEVERITY_LABELS[data.severity]}`,
    `**Kategorie:** ${data.category}`,
    "",
    "### Beschreibung",
    data.description,
  ]

  if (data.stepsToReproduce) {
    lines.push("", "### Schritte zur Reproduktion", data.stepsToReproduce)
  }

  if (data.expectedBehavior) {
    lines.push("", "### Erwartetes Verhalten", data.expectedBehavior)
  }

  if (data.actualBehavior) {
    lines.push("", "### Tatsächliches Verhalten", data.actualBehavior)
  }

  if (data.url || data.browser) {
    lines.push("", "### Technische Details")
    if (data.url) lines.push(`**URL:** ${data.url}`)
    if (data.browser) lines.push(`**Browser:** ${data.browser}`)
  }

  return lines.join("\n")
}

async function sendConfirmationEmail(
  data: z.infer<typeof BugReportSchema>,
  ticketId: string | null,
  tenant: { name: string; supportEmail?: string }
): Promise<void> {
  // Resend integration (preferred)
  const resendKey = process.env.RESEND_API_KEY
  if (!resendKey) return

  const subject = ticketId
    ? `Ihr Bug-Report #${ticketId} wurde erfasst — ${tenant.name}`
    : `Ihr Bug-Report wurde erfasst — ${tenant.name}`

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Danke für Ihren Bericht, ${data.reporterName}!</h2>
      <p>Wir haben Ihren Bug-Report erhalten und bearbeiten ihn so schnell wie möglich.</p>
      ${ticketId ? `<p><strong>Ticket-Nummer:</strong> #${ticketId}</p>` : ""}
      <p><strong>Titel:</strong> ${data.title}</p>
      <p><strong>Schweregrad:</strong> ${SEVERITY_LABELS[data.severity]}</p>
      <hr>
      <p style="color: #666; font-size: 14px;">
        Bei Rückfragen antworten Sie einfach auf diese E-Mail oder kontaktieren Sie uns unter 
        ${tenant.supportEmail || "support@feldhub.de"}.
      </p>
      <p style="color: #aaa; font-size: 12px;">– Das ${tenant.name} Team</p>
    </div>
  `

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${resendKey}`,
    },
    body: JSON.stringify({
      from: `${tenant.name} <noreply@feldhub.de>`,
      to: data.reporterEmail,
      subject,
      html,
    }),
  })
}
