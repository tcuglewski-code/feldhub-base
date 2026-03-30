/**
 * monthly-report.ts — Monatlicher Kunden-Report Generator
 * Sprint JO | Feldhub Base
 *
 * Aggregiert alle relevanten Daten eines Monats:
 * - Aufträge (abgeschlossen, laufend, geplant)
 * - Mitarbeiter-Stunden
 * - Geräte-Einsätze
 * - Protokolle / Abnahmen
 * - Optional: Rechnungen / Umsatz
 */

import { prisma } from "@/lib/prisma"
import { getTenantConfig } from "@/config/tenant"

export interface MonthlyReportData {
  period: { year: number; month: number; label: string }
  tenant: { id: string; name: string }
  auftraege: {
    abgeschlossen: number
    laufend: number
    geplant: number
    gesamtFlaeche: number
    topBaumarten: { name: string; count: number }[]
  }
  stunden: {
    gesamt: number
    billable: number
    mitarbeiterTop: { name: string; stunden: number }[]
  }
  protokolle: {
    gesamt: number
    abnahmen: number
  }
  kunden: {
    aktiv: number
    neu: number
  }
  highlights: string[]
  generatedAt: string
}

export async function generateMonthlyReport(
  year: number,
  month: number
): Promise<MonthlyReportData> {
  const tenant = getTenantConfig()

  const startDate = new Date(year, month - 1, 1)
  const endDate = new Date(year, month, 0, 23, 59, 59)

  const monthLabel = new Intl.DateTimeFormat("de-DE", {
    month: "long",
    year: "numeric",
  }).format(startDate)

  // Parallel queries
  const [auftraegeRaw, stundenRaw, protokolleRaw, kundenRaw] = await Promise.allSettled([
    // Aufträge im Monat
    prisma.auftrag
      .findMany({
        where: {
          OR: [
            { startDatum: { gte: startDate, lte: endDate } },
            { endDatum: { gte: startDate, lte: endDate } },
            { AND: [{ startDatum: { lte: startDate } }, { endDatum: { gte: endDate } }] },
          ],
        },
        select: {
          status: true,
          flaeche: true,
          baumarten: true,
        },
      })
      .catch(() => []),

    // Stunden im Monat
    prisma.stundeneintrag
      .findMany({
        where: {
          datum: { gte: startDate, lte: endDate },
        },
        select: {
          stunden: true,
          billable: true,
          user: { select: { name: true } },
        },
      })
      .catch(() => []),

    // Tagesprotokolle
    prisma.tagesprotokoll
      .findMany({
        where: {
          datum: { gte: startDate, lte: endDate },
        },
        select: {
          typ: true,
        },
      })
      .catch(() => []),

    // Kunden/Kontakte
    prisma.kontakt
      .aggregate({
        where: { typ: "KUNDE" },
        _count: { id: true },
      })
      .catch(() => ({ _count: { id: 0 } })),
  ])

  // Process Aufträge
  const auftraege = auftraegeRaw.status === "fulfilled" ? auftraegeRaw.value : []
  const auftragStats = {
    abgeschlossen: auftraege.filter((a) => a.status === "ABGESCHLOSSEN").length,
    laufend: auftraege.filter((a) => a.status === "LAUFEND" || a.status === "IN_BEARBEITUNG").length,
    geplant: auftraege.filter((a) => a.status === "GEPLANT" || a.status === "NEU").length,
    gesamtFlaeche: auftraege.reduce((sum, a) => sum + (Number(a.flaeche) || 0), 0),
    topBaumarten: getTopBaumarten(auftraege.map((a) => String(a.baumarten || ""))),
  }

  // Process Stunden
  const stundenEntries =
    stundenRaw.status === "fulfilled"
      ? (stundenRaw.value as { stunden: number; billable: boolean; user: { name: string | null } }[])
      : []
  const gesamtStunden = stundenEntries.reduce((sum, s) => sum + (Number(s.stunden) || 0), 0)
  const billableStunden = stundenEntries
    .filter((s) => s.billable)
    .reduce((sum, s) => sum + (Number(s.stunden) || 0), 0)

  const stundenByMitarbeiter: Record<string, number> = {}
  for (const s of stundenEntries) {
    const name = s.user?.name || "Unbekannt"
    stundenByMitarbeiter[name] = (stundenByMitarbeiter[name] || 0) + Number(s.stunden || 0)
  }
  const mitarbeiterTop = Object.entries(stundenByMitarbeiter)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([name, stunden]) => ({ name, stunden: Math.round(stunden * 10) / 10 }))

  // Process Protokolle
  const protokolle = protokolleRaw.status === "fulfilled" ? protokolleRaw.value : []
  const protokollStats = {
    gesamt: protokolle.length,
    abnahmen: protokolle.filter(
      (p) => p.typ === "ABNAHME" || p.typ === "abnahme"
    ).length,
  }

  // Process Kunden
  const kundenTotal =
    kundenRaw.status === "fulfilled" ? kundenRaw.value._count.id : 0

  // Build highlights
  const highlights: string[] = []
  if (auftragStats.abgeschlossen > 0) {
    highlights.push(`${auftragStats.abgeschlossen} Aufträge erfolgreich abgeschlossen`)
  }
  if (auftragStats.gesamtFlaeche > 0) {
    highlights.push(`${auftragStats.gesamtFlaeche.toFixed(1)} ha Gesamtfläche bearbeitet`)
  }
  if (gesamtStunden > 0) {
    highlights.push(`${Math.round(gesamtStunden)} Arbeitsstunden geleistet`)
  }
  if (protokollStats.abnahmen > 0) {
    highlights.push(`${protokollStats.abnahmen} Abnahmen durchgeführt`)
  }
  if (highlights.length === 0) {
    highlights.push("Kein Aktivitäten in diesem Monat")
  }

  return {
    period: { year, month, label: monthLabel },
    tenant: { id: tenant.id, name: tenant.name },
    auftraege: auftragStats,
    stunden: {
      gesamt: Math.round(gesamtStunden * 10) / 10,
      billable: Math.round(billableStunden * 10) / 10,
      mitarbeiterTop,
    },
    protokolle: protokollStats,
    kunden: { aktiv: kundenTotal, neu: 0 }, // neu = wäre komplexer
    highlights,
    generatedAt: new Date().toISOString(),
  }
}

function getTopBaumarten(baumartenStrings: string[]): { name: string; count: number }[] {
  const counts: Record<string, number> = {}
  for (const s of baumartenStrings) {
    if (!s) continue
    const parts = s
      .split(/[,;|/\n]/)
      .map((p) => p.trim())
      .filter(Boolean)
    for (const part of parts) {
      counts[part] = (counts[part] || 0) + 1
    }
  }
  return Object.entries(counts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }))
}

/**
 * Render report as Markdown
 */
export function renderReportMarkdown(report: MonthlyReportData): string {
  const { period, tenant, auftraege, stunden, protokolle, kunden, highlights } = report

  const lines: string[] = [
    `# Monatsbericht ${period.label}`,
    `**Mandant:** ${tenant.name}  `,
    `**Generiert:** ${new Date(report.generatedAt).toLocaleString("de-DE")}`,
    "",
    "## 🌟 Highlights",
    ...highlights.map((h) => `- ${h}`),
    "",
    "## 📋 Aufträge",
    `| Status | Anzahl |`,
    `|--------|--------|`,
    `| ✅ Abgeschlossen | ${auftraege.abgeschlossen} |`,
    `| 🔄 Laufend | ${auftraege.laufend} |`,
    `| 📅 Geplant | ${auftraege.geplant} |`,
    `| **Gesamt** | **${auftraege.abgeschlossen + auftraege.laufend + auftraege.geplant}** |`,
    "",
    auftraege.gesamtFlaeche > 0
      ? `**Gesamtfläche:** ${auftraege.gesamtFlaeche.toFixed(1)} ha`
      : "",
    "",
  ]

  if (auftraege.topBaumarten.length > 0) {
    lines.push("**Top Baumarten:**")
    for (const b of auftraege.topBaumarten) {
      lines.push(`- ${b.name}: ${b.count}×`)
    }
    lines.push("")
  }

  lines.push(
    "## ⏱️ Arbeitsstunden",
    `| Kategorie | Stunden |`,
    `|-----------|---------|`,
    `| Gesamt | ${stunden.gesamt}h |`,
    `| Billable | ${stunden.billable}h |`,
    ""
  )

  if (stunden.mitarbeiterTop.length > 0) {
    lines.push("**Top Mitarbeiter:**")
    for (const m of stunden.mitarbeiterTop) {
      lines.push(`- ${m.name}: ${m.stunden}h`)
    }
    lines.push("")
  }

  lines.push(
    "## 📝 Protokolle & Abnahmen",
    `- Protokolle gesamt: ${protokolle.gesamt}`,
    `- Abnahmen: ${protokolle.abnahmen}`,
    "",
    "## 👥 Kunden",
    `- Aktive Kunden: ${kunden.aktiv}`,
    "",
    "---",
    `*Automatisch generiert von Feldhub | ${report.generatedAt}*`
  )

  return lines.filter((l) => l !== null).join("\n")
}

/**
 * Render report as HTML (für E-Mail)
 */
export function renderReportHTML(report: MonthlyReportData): string {
  const { period, tenant, auftraege, stunden, protokolle, highlights } = report

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
  <div style="background: linear-gradient(135deg, #2C3A1C, #4a6030); padding: 24px; border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 20px;">📊 Monatsbericht ${period.label}</h1>
    <p style="color: rgba(255,255,255,0.7); margin: 4px 0 0; font-size: 14px;">${tenant.name}</p>
  </div>
  <div style="background: white; border: 1px solid #e5e7eb; border-top: none; padding: 24px; border-radius: 0 0 12px 12px;">
    
    <h2 style="color: #2C3A1C; font-size: 16px;">🌟 Highlights</h2>
    <ul style="padding-left: 20px; color: #555;">
      ${highlights.map((h) => `<li style="margin-bottom: 6px;">${h}</li>`).join("")}
    </ul>

    <h2 style="color: #2C3A1C; font-size: 16px; margin-top: 20px;">📋 Aufträge</h2>
    <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
      <tr style="background: #f9fafb;">
        <td style="padding: 8px 12px; border: 1px solid #e5e7eb;">✅ Abgeschlossen</td>
        <td style="padding: 8px 12px; border: 1px solid #e5e7eb; font-weight: bold;">${auftraege.abgeschlossen}</td>
      </tr>
      <tr>
        <td style="padding: 8px 12px; border: 1px solid #e5e7eb;">🔄 Laufend</td>
        <td style="padding: 8px 12px; border: 1px solid #e5e7eb;">${auftraege.laufend}</td>
      </tr>
      <tr style="background: #f9fafb;">
        <td style="padding: 8px 12px; border: 1px solid #e5e7eb;">📅 Geplant</td>
        <td style="padding: 8px 12px; border: 1px solid #e5e7eb;">${auftraege.geplant}</td>
      </tr>
      ${auftraege.gesamtFlaeche > 0 ? `<tr><td style="padding: 8px 12px; border: 1px solid #e5e7eb;">🌲 Gesamtfläche</td><td style="padding: 8px 12px; border: 1px solid #e5e7eb;">${auftraege.gesamtFlaeche.toFixed(1)} ha</td></tr>` : ""}
    </table>

    <h2 style="color: #2C3A1C; font-size: 16px; margin-top: 20px;">⏱️ Arbeitsstunden</h2>
    <p style="margin: 4px 0; font-size: 14px;"><strong>${stunden.gesamt}h</strong> gesamt · <strong>${stunden.billable}h</strong> billable</p>
    ${stunden.mitarbeiterTop.length > 0 ? `<ul style="font-size: 13px; color: #666;">${stunden.mitarbeiterTop.map((m) => `<li>${m.name}: ${m.stunden}h</li>`).join("")}</ul>` : ""}

    <h2 style="color: #2C3A1C; font-size: 16px; margin-top: 20px;">📝 Protokolle</h2>
    <p style="font-size: 14px; margin: 4px 0;">${protokolle.gesamt} Protokolle · ${protokolle.abnahmen} Abnahmen</p>

    <hr style="margin: 24px 0; border: none; border-top: 1px solid #e5e7eb;">
    <p style="font-size: 11px; color: #9ca3af; margin: 0;">Automatisch generiert von Feldhub · ${new Date(report.generatedAt).toLocaleString("de-DE")}</p>
  </div>
</body>
</html>`
}
