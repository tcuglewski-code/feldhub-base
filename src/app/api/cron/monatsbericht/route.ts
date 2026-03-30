/**
 * Cron: GET /api/cron/monatsbericht
 * Sprint JO — Monatlicher Kunden-Report
 *
 * Wird am 1. jeden Monats ausgeführt (Vercel Cron).
 * Generiert Report für den Vormonat und:
 * 1. Speichert als Dokument in Mission Control
 * 2. Sendet E-Mail an Admins (via Resend)
 * 3. Postet Zusammenfassung als MC-Announcement
 */

import { NextRequest, NextResponse } from "next/server"
import { generateMonthlyReport, renderReportMarkdown, renderReportHTML } from "@/lib/monthly-report"

export const dynamic = "force-dynamic"
export const maxDuration = 60

export async function GET(request: NextRequest) {
  // Auth: Vercel Cron secret oder Bearer token
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    // Also allow manual trigger by admins
    const apiKey = request.headers.get("x-api-key")
    const mcKey = process.env.MISSION_CONTROL_API_KEY || process.env.MC_API_KEY
    if (!apiKey || apiKey !== mcKey) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  }

  // Determine report period (default: previous month)
  const { searchParams } = new URL(request.url)
  const now = new Date()
  const year = parseInt(searchParams.get("year") || String(
    now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()
  ))
  const month = parseInt(searchParams.get("month") || String(
    now.getMonth() === 0 ? 12 : now.getMonth()
  ))

  try {
    console.log(`[monatsbericht] Generating report for ${year}/${month}`)

    const report = await generateMonthlyReport(year, month)
    const markdown = renderReportMarkdown(report)
    const html = renderReportHTML(report)

    const results: Record<string, unknown> = {}

    // 1. Save to Mission Control as Document
    const mcUrl = process.env.MISSION_CONTROL_URL || "https://mission-control-tawny-omega.vercel.app"
    const mcApiKey = process.env.MISSION_CONTROL_API_KEY || process.env.MC_API_KEY

    if (mcApiKey) {
      try {
        const docRes = await fetch(`${mcUrl}/api/documents`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": mcApiKey,
          },
          body: JSON.stringify({
            title: `Monatsbericht ${report.period.label}`,
            content: markdown,
            category: "BERICHT",
            tags: ["monatsbericht", "automatisch", report.period.label],
            metadata: {
              reportType: "monthly",
              year: report.period.year,
              month: report.period.month,
              tenantId: report.tenant.id,
            },
          }),
        })
        results.mcDocument = docRes.ok ? "saved" : `error: ${docRes.status}`
      } catch (err) {
        results.mcDocument = `error: ${err}`
      }

      // 2. Post announcement to Mission Control
      try {
        const annoRes = await fetch(`${mcUrl}/api/announcements`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": mcApiKey,
          },
          body: JSON.stringify({
            title: `📊 Monatsbericht ${report.period.label}`,
            content: [
              `**${report.tenant.name}** — Monatsbericht für ${report.period.label}`,
              "",
              "**Highlights:**",
              ...report.highlights.map((h) => `• ${h}`),
              "",
              `Aufträge: ${report.auftraege.abgeschlossen} abgeschlossen · ${report.auftraege.laufend} laufend`,
              `Arbeitsstunden: ${report.stunden.gesamt}h`,
            ].join("\n"),
            priority: "NORMAL",
            type: "INFO",
          }),
        })
        results.mcAnnouncement = annoRes.ok ? "posted" : `error: ${annoRes.status}`
      } catch (err) {
        results.mcAnnouncement = `error: ${err}`
      }
    }

    // 3. Send email (if configured)
    const resendKey = process.env.RESEND_API_KEY
    const adminEmail = process.env.ADMIN_EMAIL || process.env.REPORT_EMAIL
    if (resendKey && adminEmail) {
      try {
        const emailRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${resendKey}`,
          },
          body: JSON.stringify({
            from: `${report.tenant.name} <noreply@feldhub.de>`,
            to: adminEmail,
            subject: `📊 Monatsbericht ${report.period.label} — ${report.tenant.name}`,
            html,
          }),
        })
        results.email = emailRes.ok ? "sent" : `error: ${emailRes.status}`
      } catch (err) {
        results.email = `error: ${err}`
      }
    }

    return NextResponse.json({
      success: true,
      period: `${report.period.year}/${String(report.period.month).padStart(2, "0")}`,
      report: {
        highlights: report.highlights,
        auftraege: report.auftraege,
        stunden: { gesamt: report.stunden.gesamt, billable: report.stunden.billable },
        protokolle: report.protokolle,
      },
      results,
    })
  } catch (err) {
    console.error("[monatsbericht] Error:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Report generation failed" },
      { status: 500 }
    )
  }
}
