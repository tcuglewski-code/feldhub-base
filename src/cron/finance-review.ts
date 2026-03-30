/**
 * Finance Review Cron - Monatlicher Finanz-Report
 * Läuft am 1. jeden Monats um 06:00 UTC
 * 
 * Sammelt:
 * - MRR (Monthly Recurring Revenue)
 * - Offene Rechnungen
 * - Neue Kunden im letzten Monat
 * - Churn Rate
 * 
 * Output:
 * - Markdown Report → /reports/finance/YYYY-MM.md
 * - CSV Export → /reports/finance/YYYY-MM.csv
 * - Mission Control API Notification
 */

import { prisma } from '../lib/prisma'
import * as fs from 'fs/promises'
import * as path from 'path'

// Mission Control API Configuration
const MC_API_URL = process.env.MC_API_URL || 'https://mission-control-tawny-omega.vercel.app'
const MC_API_KEY = process.env.MC_API_KEY || ''

// Paketpreise (monatlich in EUR)
const PACKAGE_PRICES: Record<string, number> = {
  starter: 299,
  professional: 599,
  enterprise: 999,
  custom: 0, // wird individuell berechnet
}

interface TenantFinanceData {
  id: string
  name: string
  package: string
  monthlyPrice: number
  status: 'active' | 'inactive' | 'trial' | 'churned'
  createdAt: Date
  cancelledAt?: Date | null
}

interface InvoiceData {
  id: string
  tenantId: string
  tenantName: string
  amount: number
  status: 'open' | 'paid' | 'overdue' | 'cancelled'
  dueDate: Date
  issuedAt: Date
}

interface FinanceReport {
  period: string
  generatedAt: Date
  
  // MRR Metrics
  mrr: number
  mrrGrowth: number
  mrrGrowthPercent: number
  
  // Customer Metrics
  totalActiveTenants: number
  newCustomers: number
  churnedCustomers: number
  churnRate: number
  netGrowth: number
  
  // Invoice Metrics
  openInvoices: number
  openInvoicesAmount: number
  overdueInvoices: number
  overdueAmount: number
  paidThisMonth: number
  paidAmount: number
  
  // Breakdown by Package
  packageBreakdown: {
    package: string
    count: number
    mrr: number
  }[]
  
  // Lists
  newCustomersList: { name: string; package: string; date: string }[]
  churnedList: { name: string; package: string; date: string; reason?: string }[]
  overdueList: { tenant: string; amount: number; daysPastDue: number }[]
}

/**
 * Holt alle Tenant-Daten für Finance-Berechnung
 */
async function getTenantFinanceData(): Promise<TenantFinanceData[]> {
  // In Production: Prisma Query
  // Hier ein Beispiel mit Mock-Daten für Tests
  try {
    const tenants = await prisma.tenant.findMany({
      select: {
        id: true,
        name: true,
        package: true,
        customPrice: true,
        status: true,
        createdAt: true,
        cancelledAt: true,
      },
    })
    
    return tenants.map(t => ({
      id: t.id,
      name: t.name,
      package: t.package || 'professional',
      monthlyPrice: t.customPrice || PACKAGE_PRICES[t.package || 'professional'] || 599,
      status: t.status as TenantFinanceData['status'],
      createdAt: t.createdAt,
      cancelledAt: t.cancelledAt,
    }))
  } catch {
    // Fallback für Dev/Test ohne DB
    console.warn('[Finance Review] DB nicht verfügbar, nutze leere Daten')
    return []
  }
}

/**
 * Holt offene Rechnungen
 */
async function getInvoiceData(startDate: Date, endDate: Date): Promise<InvoiceData[]> {
  try {
    const invoices = await prisma.invoice.findMany({
      where: {
        OR: [
          { status: 'open' },
          { status: 'overdue' },
          {
            status: 'paid',
            paidAt: { gte: startDate, lte: endDate }
          }
        ]
      },
      include: {
        tenant: { select: { name: true } }
      }
    })
    
    return invoices.map(inv => ({
      id: inv.id,
      tenantId: inv.tenantId,
      tenantName: inv.tenant?.name || 'Unbekannt',
      amount: inv.amount,
      status: inv.status as InvoiceData['status'],
      dueDate: inv.dueDate,
      issuedAt: inv.issuedAt,
    }))
  } catch {
    console.warn('[Finance Review] Invoice-Daten nicht verfügbar')
    return []
  }
}

/**
 * Berechnet den vollständigen Finance Report
 */
async function calculateFinanceReport(year: number, month: number): Promise<FinanceReport> {
  const periodStart = new Date(year, month - 1, 1)
  const periodEnd = new Date(year, month, 0, 23, 59, 59)
  const previousMonthStart = new Date(year, month - 2, 1)
  const previousMonthEnd = new Date(year, month - 1, 0, 23, 59, 59)
  
  const tenants = await getTenantFinanceData()
  const invoices = await getInvoiceData(periodStart, periodEnd)
  
  // Active Tenants
  const activeTenants = tenants.filter(t => t.status === 'active')
  
  // MRR Calculation
  const mrr = activeTenants.reduce((sum, t) => sum + t.monthlyPrice, 0)
  
  // Previous Month MRR (simplified - would need historical data)
  const previousActiveTenants = tenants.filter(t => 
    t.status === 'active' && t.createdAt <= previousMonthEnd
  )
  const previousMrr = previousActiveTenants.reduce((sum, t) => sum + t.monthlyPrice, 0)
  
  const mrrGrowth = mrr - previousMrr
  const mrrGrowthPercent = previousMrr > 0 ? (mrrGrowth / previousMrr) * 100 : 0
  
  // New Customers (created this month)
  const newCustomers = tenants.filter(t => 
    t.createdAt >= periodStart && t.createdAt <= periodEnd
  )
  
  // Churned Customers (cancelled this month)
  const churnedCustomers = tenants.filter(t => 
    t.cancelledAt && t.cancelledAt >= periodStart && t.cancelledAt <= periodEnd
  )
  
  // Churn Rate
  const startOfMonthCount = tenants.filter(t => 
    t.createdAt < periodStart && (t.status === 'active' || t.cancelledAt && t.cancelledAt >= periodStart)
  ).length
  const churnRate = startOfMonthCount > 0 
    ? (churnedCustomers.length / startOfMonthCount) * 100 
    : 0
  
  // Invoice Metrics
  const openInvoices = invoices.filter(i => i.status === 'open')
  const overdueInvoices = invoices.filter(i => i.status === 'overdue')
  const paidInvoices = invoices.filter(i => i.status === 'paid')
  
  // Package Breakdown
  const packageBreakdown = Object.keys(PACKAGE_PRICES).map(pkg => {
    const pkgTenants = activeTenants.filter(t => t.package === pkg)
    return {
      package: pkg,
      count: pkgTenants.length,
      mrr: pkgTenants.reduce((sum, t) => sum + t.monthlyPrice, 0)
    }
  }).filter(p => p.count > 0)
  
  // Overdue List with days past due
  const now = new Date()
  const overdueList = overdueInvoices.map(inv => ({
    tenant: inv.tenantName,
    amount: inv.amount,
    daysPastDue: Math.floor((now.getTime() - inv.dueDate.getTime()) / (1000 * 60 * 60 * 24))
  })).sort((a, b) => b.daysPastDue - a.daysPastDue)
  
  return {
    period: `${year}-${String(month).padStart(2, '0')}`,
    generatedAt: new Date(),
    
    mrr,
    mrrGrowth,
    mrrGrowthPercent: Math.round(mrrGrowthPercent * 100) / 100,
    
    totalActiveTenants: activeTenants.length,
    newCustomers: newCustomers.length,
    churnedCustomers: churnedCustomers.length,
    churnRate: Math.round(churnRate * 100) / 100,
    netGrowth: newCustomers.length - churnedCustomers.length,
    
    openInvoices: openInvoices.length,
    openInvoicesAmount: openInvoices.reduce((sum, i) => sum + i.amount, 0),
    overdueInvoices: overdueInvoices.length,
    overdueAmount: overdueInvoices.reduce((sum, i) => sum + i.amount, 0),
    paidThisMonth: paidInvoices.length,
    paidAmount: paidInvoices.reduce((sum, i) => sum + i.amount, 0),
    
    packageBreakdown,
    
    newCustomersList: newCustomers.map(c => ({
      name: c.name,
      package: c.package,
      date: c.createdAt.toISOString().split('T')[0]
    })),
    
    churnedList: churnedCustomers.map(c => ({
      name: c.name,
      package: c.package,
      date: c.cancelledAt?.toISOString().split('T')[0] || 'N/A'
    })),
    
    overdueList
  }
}

/**
 * Generiert Markdown Report
 */
function generateMarkdownReport(report: FinanceReport): string {
  const { period, generatedAt } = report
  
  return `# Finance Report ${period}

> Generiert am ${generatedAt.toISOString().split('T')[0]} um ${generatedAt.toISOString().split('T')[1].split('.')[0]} UTC

---

## 📊 Executive Summary

| Metrik | Wert |
|--------|------|
| **MRR** | €${report.mrr.toLocaleString('de-DE')} |
| **MRR Wachstum** | €${report.mrrGrowth.toLocaleString('de-DE')} (${report.mrrGrowthPercent > 0 ? '+' : ''}${report.mrrGrowthPercent}%) |
| **Aktive Kunden** | ${report.totalActiveTenants} |
| **Netto-Wachstum** | ${report.netGrowth > 0 ? '+' : ''}${report.netGrowth} |
| **Churn Rate** | ${report.churnRate}% |

---

## 💰 Umsatz-Details

### MRR nach Paket

| Paket | Kunden | MRR |
|-------|--------|-----|
${report.packageBreakdown.map(p => 
  `| ${p.package.charAt(0).toUpperCase() + p.package.slice(1)} | ${p.count} | €${p.mrr.toLocaleString('de-DE')} |`
).join('\n')}
| **Gesamt** | **${report.totalActiveTenants}** | **€${report.mrr.toLocaleString('de-DE')}** |

### ARR Projektion

- **Annual Recurring Revenue:** €${(report.mrr * 12).toLocaleString('de-DE')}

---

## 📋 Rechnungen

| Status | Anzahl | Betrag |
|--------|--------|--------|
| Offen | ${report.openInvoices} | €${report.openInvoicesAmount.toLocaleString('de-DE')} |
| Überfällig | ${report.overdueInvoices} | €${report.overdueAmount.toLocaleString('de-DE')} |
| Bezahlt (dieser Monat) | ${report.paidThisMonth} | €${report.paidAmount.toLocaleString('de-DE')} |

${report.overdueList.length > 0 ? `
### ⚠️ Überfällige Rechnungen

| Kunde | Betrag | Tage überfällig |
|-------|--------|-----------------|
${report.overdueList.map(o => 
  `| ${o.tenant} | €${o.amount.toLocaleString('de-DE')} | ${o.daysPastDue} |`
).join('\n')}
` : ''}

---

## 👥 Kundenentwicklung

### Neue Kunden (${report.newCustomers})

${report.newCustomersList.length > 0 
  ? report.newCustomersList.map(c => `- **${c.name}** (${c.package}) — ${c.date}`).join('\n')
  : '_Keine neuen Kunden in diesem Monat_'}

### Kündigungen (${report.churnedCustomers})

${report.churnedList.length > 0 
  ? report.churnedList.map(c => `- **${c.name}** (${c.package}) — ${c.date}`).join('\n')
  : '_Keine Kündigungen in diesem Monat_ ✅'}

---

## 📈 Trends

- **Customer Lifetime Value (CLV):** €${Math.round(report.mrr / Math.max(report.totalActiveTenants, 1) * (100 / Math.max(report.churnRate, 1))).toLocaleString('de-DE')} (geschätzt)
- **Durchschnittlicher Umsatz pro Kunde:** €${Math.round(report.mrr / Math.max(report.totalActiveTenants, 1)).toLocaleString('de-DE')}/Monat

---

*Report automatisch generiert von Feldhub Finance Cron*
`
}

/**
 * Generiert CSV für Steuerberater
 */
function generateCSVExport(report: FinanceReport): string {
  const lines: string[] = [
    'Kategorie,Beschreibung,Wert,Währung',
    `MRR,Monthly Recurring Revenue,${report.mrr},EUR`,
    `ARR,Annual Recurring Revenue,${report.mrr * 12},EUR`,
    `MRR Wachstum,Veränderung zum Vormonat,${report.mrrGrowth},EUR`,
    `Aktive Kunden,Anzahl zahlender Kunden,${report.totalActiveTenants},Anzahl`,
    `Neue Kunden,Neukunden im Monat,${report.newCustomers},Anzahl`,
    `Gekündigte Kunden,Churned im Monat,${report.churnedCustomers},Anzahl`,
    `Churn Rate,Kündigungsrate,${report.churnRate},%`,
    `Offene Rechnungen,Unbezahlte Rechnungen Anzahl,${report.openInvoices},Anzahl`,
    `Offener Betrag,Unbezahlte Rechnungen Summe,${report.openInvoicesAmount},EUR`,
    `Überfällige Rechnungen,Überfällig Anzahl,${report.overdueInvoices},Anzahl`,
    `Überfälliger Betrag,Überfällig Summe,${report.overdueAmount},EUR`,
    `Bezahlt im Monat,Einnahmen Anzahl,${report.paidThisMonth},Anzahl`,
    `Bezahlter Betrag,Einnahmen Summe,${report.paidAmount},EUR`,
    '',
    'Paket,Kunden,MRR,Währung',
    ...report.packageBreakdown.map(p => 
      `${p.package},${p.count},${p.mrr},EUR`
    ),
    '',
    'Neue Kunden,Paket,Datum',
    ...report.newCustomersList.map(c => 
      `${c.name},${c.package},${c.date}`
    ),
    '',
    'Gekündigte Kunden,Paket,Datum',
    ...report.churnedList.map(c => 
      `${c.name},${c.package},${c.date}`
    ),
  ]
  
  return lines.join('\n')
}

/**
 * Sendet Report an Mission Control
 */
async function sendToMissionControl(report: FinanceReport, markdownReport: string): Promise<boolean> {
  if (!MC_API_KEY) {
    console.warn('[Finance Review] MC_API_KEY nicht gesetzt, überspringe API-Upload')
    return false
  }
  
  try {
    const response = await fetch(`${MC_API_URL}/api/reports`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': MC_API_KEY,
      },
      body: JSON.stringify({
        type: 'finance-review',
        period: report.period,
        data: report,
        markdown: markdownReport,
        generatedAt: report.generatedAt.toISOString(),
      }),
    })
    
    if (!response.ok) {
      console.error('[Finance Review] MC API Fehler:', response.status, await response.text())
      return false
    }
    
    console.log('[Finance Review] Report erfolgreich an Mission Control gesendet')
    return true
  } catch (error) {
    console.error('[Finance Review] MC API Fehler:', error)
    return false
  }
}

/**
 * Schreibt Reports auf Filesystem
 */
async function writeReports(
  report: FinanceReport, 
  markdownReport: string, 
  csvExport: string
): Promise<void> {
  const reportsDir = path.join(process.cwd(), 'reports', 'finance')
  
  // Sicherstellen dass Verzeichnis existiert
  await fs.mkdir(reportsDir, { recursive: true })
  
  const mdPath = path.join(reportsDir, `${report.period}.md`)
  const csvPath = path.join(reportsDir, `${report.period}.csv`)
  
  await Promise.all([
    fs.writeFile(mdPath, markdownReport, 'utf-8'),
    fs.writeFile(csvPath, csvExport, 'utf-8'),
  ])
  
  console.log(`[Finance Review] Reports geschrieben: ${mdPath}, ${csvPath}`)
}

/**
 * Main Entry Point
 */
export async function runFinanceReview(year?: number, month?: number): Promise<FinanceReport> {
  const now = new Date()
  const targetYear = year ?? now.getFullYear()
  // Default: vorheriger Monat (am 1. des Monats reporten wir den Vormonat)
  const targetMonth = month ?? (now.getMonth() === 0 ? 12 : now.getMonth())
  
  console.log(`[Finance Review] Starte Report für ${targetYear}-${String(targetMonth).padStart(2, '0')}`)
  
  // Report berechnen
  const report = await calculateFinanceReport(targetYear, targetMonth)
  
  // Markdown generieren
  const markdownReport = generateMarkdownReport(report)
  
  // CSV generieren
  const csvExport = generateCSVExport(report)
  
  // Reports schreiben
  await writeReports(report, markdownReport, csvExport)
  
  // An Mission Control senden
  await sendToMissionControl(report, markdownReport)
  
  console.log('[Finance Review] ✅ Abgeschlossen')
  
  return report
}

// CLI Entry
if (require.main === module) {
  runFinanceReview()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[Finance Review] Fehler:', err)
      process.exit(1)
    })
}

export { calculateFinanceReport, generateMarkdownReport, generateCSVExport }
