/**
 * Conto-Agent — Automatische Zahlungseingangsprüfung
 * Sprint KB | 31.03.2026
 *
 * Prüft monatlich ob alle SaaS-Kunden ihre Gebühren bezahlt haben:
 * - Liest offene Rechnungen aus Mission Control
 * - Prüft Zahlungsstatus (Stripe-Simulation / SEPA-CSV-Import)
 * - Erstellt Mahnungs-Tasks in MC bei überfälligen Zahlungen
 * - Sendet Finance-Summary an Tomek
 *
 * Cron: täglich 07:00 → prüft fällige Rechnungen
 */

import { MC_BASE_URL, MC_API_KEY } from '@/config/env';

// ─── Types ──────────────────────────────────────────────────────────────────

export type InvoiceStatus =
  | 'draft'
  | 'sent'
  | 'paid'
  | 'overdue'
  | 'cancelled'
  | 'refunded';

export type PaymentMethod = 'sepa' | 'stripe' | 'bank_transfer' | 'cash';

export interface Invoice {
  id: string;
  tenantId: string;
  tenantName: string;
  invoiceNumber: string;
  amount: number; // in Cent
  currency: 'EUR';
  dueDate: Date;
  issueDate: Date;
  status: InvoiceStatus;
  paymentMethod: PaymentMethod;
  stripePaymentIntentId?: string;
  sepaReference?: string;
  paidAt?: Date;
  overdueReminderCount: number;
}

export interface ContoSummary {
  runAt: Date;
  totalInvoices: number;
  paidCount: number;
  overdueCount: number;
  dueCount: number; // fällig heute/morgen
  totalMRR: number; // in Cent
  totalArrears: number; // offene Beträge in Cent
  newTasksCreated: number;
  errors: string[];
}

export interface PaymentCheckResult {
  invoiceId: string;
  wasOverdue: boolean;
  isPaid: boolean;
  daysPastDue: number;
}

// ─── MC API Helpers ──────────────────────────────────────────────────────────

async function fetchOpenInvoices(): Promise<Invoice[]> {
  try {
    const res = await fetch(`${MC_BASE_URL}/api/invoices?status=sent,overdue`, {
      headers: { 'x-api-key': MC_API_KEY },
    });
    if (!res.ok) throw new Error(`MC API ${res.status}: ${await res.text()}`);
    const data = await res.json();
    return (data.invoices ?? []).map((inv: Record<string, unknown>) => ({
      ...inv,
      dueDate: new Date(inv.dueDate as string),
      issueDate: new Date(inv.issueDate as string),
      paidAt: inv.paidAt ? new Date(inv.paidAt as string) : undefined,
    }));
  } catch (err) {
    console.error('[Conto-Agent] fetchOpenInvoices failed:', err);
    return [];
  }
}

async function updateInvoiceStatus(
  invoiceId: string,
  status: InvoiceStatus,
  paidAt?: Date
): Promise<void> {
  await fetch(`${MC_BASE_URL}/api/invoices/${invoiceId}`, {
    method: 'PATCH',
    headers: { 'x-api-key': MC_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, ...(paidAt && { paidAt: paidAt.toISOString() }) }),
  });
}

async function createReminderTask(invoice: Invoice, daysPastDue: number): Promise<void> {
  const urgency = daysPastDue >= 30 ? '🔴 DRINGEND' : daysPastDue >= 14 ? '🟡' : '⚪';
  const title = `${urgency} Zahlung überfällig: ${invoice.tenantName} — ${formatEuro(invoice.amount)}`;

  await fetch(`${MC_BASE_URL}/api/tasks`, {
    method: 'POST',
    headers: { 'x-api-key': MC_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title,
      description: [
        `Rechnung: ${invoice.invoiceNumber}`,
        `Fällig seit: ${daysPastDue} Tagen (${invoice.dueDate.toLocaleDateString('de-DE')})`,
        `Betrag: ${formatEuro(invoice.amount)}`,
        `Zahlungsart: ${invoice.paymentMethod.toUpperCase()}`,
        `Mahnungen bisher: ${invoice.overdueReminderCount}`,
        '',
        daysPastDue >= 30
          ? '⚠️ Über 30 Tage überfällig — letzte Mahnung vor gerichtlicher Klärung?'
          : daysPastDue >= 14
          ? '📧 2. Mahnung empfohlen'
          : '📧 Erste freundliche Erinnerung senden',
      ].join('\n'),
      priority: daysPastDue >= 30 ? 'critical' : daysPastDue >= 14 ? 'high' : 'medium',
      source: 'conto-agent',
      tags: ['zahlung', 'rechnung', invoice.tenantId],
    }),
  });
}

// ─── Payment Providers ───────────────────────────────────────────────────────

/**
 * Stripe-Zahlungsprüfung (TODO: echte Stripe API)
 * In Produktion: stripe.paymentIntents.retrieve(id)
 */
async function checkStripePayment(invoice: Invoice): Promise<PaymentCheckResult> {
  // TODO: echte Stripe API
  // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  // const pi = await stripe.paymentIntents.retrieve(invoice.stripePaymentIntentId!);
  // return { isPaid: pi.status === 'succeeded', ... };

  console.log(`[Conto-Agent] Stripe check (simuliert): ${invoice.invoiceNumber}`);
  const now = new Date();
  const daysPastDue = Math.max(
    0,
    Math.floor((now.getTime() - invoice.dueDate.getTime()) / (1000 * 60 * 60 * 24))
  );

  return {
    invoiceId: invoice.id,
    wasOverdue: invoice.status === 'overdue',
    isPaid: false, // Simulation
    daysPastDue,
  };
}

/**
 * SEPA-Kontoauszug-Import (CSV-basiert)
 * Format: Datum;Empfänger;Betrag;Verwendungszweck;IBAN
 *
 * In Produktion: CSV-Upload via Hostinger/Bank-Export
 */
export function parseSepaCsv(csvContent: string): Map<string, { paid: boolean; date: Date }> {
  const results = new Map<string, { paid: boolean; date: Date }>();
  const lines = csvContent.trim().split('\n').slice(1); // Skip header

  for (const line of lines) {
    const cols = line.split(';');
    if (cols.length < 5) continue;

    const [dateStr, , amountStr, reference] = cols;
    const amount = parseFloat(amountStr.replace(',', '.'));

    if (amount > 0 && reference) {
      // Suche Rechnungsnummer im Verwendungszweck (z.B. "FH-2026-001")
      const match = reference.match(/FH-\d{4}-\d{3,}/);
      if (match) {
        results.set(match[0], {
          paid: true,
          date: new Date(dateStr.split('.').reverse().join('-')),
        });
      }
    }
  }

  return results;
}

/**
 * Prüft alle offenen Rechnungen gegen SEPA-Kontoauszug
 */
async function checkSepaPayments(
  invoices: Invoice[],
  csvContent?: string
): Promise<PaymentCheckResult[]> {
  const results: PaymentCheckResult[] = [];
  const now = new Date();

  const sepaMap = csvContent ? parseSepaCsv(csvContent) : new Map();

  for (const invoice of invoices) {
    const daysPastDue = Math.max(
      0,
      Math.floor((now.getTime() - invoice.dueDate.getTime()) / (1000 * 60 * 60 * 24))
    );

    const sepaResult = sepaMap.get(invoice.invoiceNumber);
    const isPaid = sepaResult?.paid ?? false;

    results.push({
      invoiceId: invoice.id,
      wasOverdue: invoice.status === 'overdue',
      isPaid,
      daysPastDue,
    });
  }

  return results;
}

// ─── Utilities ───────────────────────────────────────────────────────────────

function formatEuro(cents: number): string {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(
    cents / 100
  );
}

function isSoonDue(invoice: Invoice, withinDays = 3): boolean {
  const now = new Date();
  const diff = invoice.dueDate.getTime() - now.getTime();
  return diff > 0 && diff <= withinDays * 24 * 60 * 60 * 1000;
}

// ─── Summary Reporter ────────────────────────────────────────────────────────

async function saveSummaryToMC(summary: ContoSummary): Promise<void> {
  const report = `
# Conto-Agent Report — ${summary.runAt.toLocaleDateString('de-DE')}

## Übersicht
- **Offene Rechnungen:** ${summary.totalInvoices}
- **Bezahlt:** ${summary.paidCount}
- **Überfällig:** ${summary.overdueCount}
- **Bald fällig (3 Tage):** ${summary.dueCount}
- **MRR gesamt:** ${formatEuro(summary.totalMRR)}
- **Offene Beträge:** ${formatEuro(summary.totalArrears)}
- **Neue Tasks erstellt:** ${summary.newTasksCreated}
${summary.errors.length > 0 ? `\n## Fehler\n${summary.errors.map((e) => `- ${e}`).join('\n')}` : ''}
  `.trim();

  await fetch(`${MC_BASE_URL}/api/reports`, {
    method: 'POST',
    headers: { 'x-api-key': MC_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'conto-agent',
      content: report,
      runAt: summary.runAt.toISOString(),
      metadata: {
        paidCount: summary.paidCount,
        overdueCount: summary.overdueCount,
        totalMRR: summary.totalMRR,
        totalArrears: summary.totalArrears,
      },
    }),
  });
}

// ─── Main Run ────────────────────────────────────────────────────────────────

/**
 * Haupt-Funktion: Täglich 07:00 via Cron
 *
 * Ablauf:
 * 1. Alle offenen Rechnungen aus MC laden
 * 2. Zahlungsstatus prüfen (Stripe oder SEPA-CSV)
 * 3. Bezahlte Rechnungen in MC als 'paid' markieren
 * 4. Überfällige Rechnungen → MC-Task erstellen
 * 5. Zusammenfassung in MC speichern
 */
export async function runContoAgent(sepaCsvContent?: string): Promise<ContoSummary> {
  const runAt = new Date();
  const summary: ContoSummary = {
    runAt,
    totalInvoices: 0,
    paidCount: 0,
    overdueCount: 0,
    dueCount: 0,
    totalMRR: 0,
    totalArrears: 0,
    newTasksCreated: 0,
    errors: [],
  };

  console.log(`[Conto-Agent] Start: ${runAt.toISOString()}`);

  // 1. Offene Rechnungen laden
  const invoices = await fetchOpenInvoices();
  summary.totalInvoices = invoices.length;

  if (invoices.length === 0) {
    console.log('[Conto-Agent] Keine offenen Rechnungen.');
    return summary;
  }

  // 2. Zahlungsstatus prüfen
  const stripeInvoices = invoices.filter((inv) => inv.paymentMethod === 'stripe');
  const sepaInvoices = invoices.filter((inv) => inv.paymentMethod !== 'stripe');

  const stripeResults = await Promise.all(stripeInvoices.map(checkStripePayment));
  const sepaResults = await checkSepaPayments(sepaInvoices, sepaCsvContent);
  const allResults = [...stripeResults, ...sepaResults];

  // 3. Status updaten + Tasks erstellen
  for (const result of allResults) {
    const invoice = invoices.find((inv) => inv.id === result.invoiceId)!;

    summary.totalMRR += invoice.amount;

    if (result.isPaid) {
      // Rechnung als bezahlt markieren
      await updateInvoiceStatus(invoice.id, 'paid', new Date());
      summary.paidCount++;
      console.log(`[Conto-Agent] ✅ Bezahlt: ${invoice.invoiceNumber} (${invoice.tenantName})`);
    } else {
      summary.totalArrears += invoice.amount;

      if (result.daysPastDue > 0) {
        // Überfällig
        if (invoice.status !== 'overdue') {
          await updateInvoiceStatus(invoice.id, 'overdue');
        }
        summary.overdueCount++;

        // Mahnung-Task erstellen (erste Mahnung nach 7 Tagen, dann alle 14 Tage)
        const shouldRemind =
          result.daysPastDue === 7 ||
          result.daysPastDue === 21 ||
          result.daysPastDue === 35 ||
          result.daysPastDue >= 60;

        if (shouldRemind) {
          try {
            await createReminderTask(invoice, result.daysPastDue);
            summary.newTasksCreated++;
          } catch (err) {
            summary.errors.push(`Task für ${invoice.invoiceNumber}: ${err}`);
          }
        }

        console.log(
          `[Conto-Agent] ⚠️ Überfällig (${result.daysPastDue}d): ${invoice.invoiceNumber} — ${formatEuro(invoice.amount)}`
        );
      } else if (isSoonDue(invoice)) {
        // Bald fällig
        summary.dueCount++;
        console.log(
          `[Conto-Agent] 📅 Bald fällig: ${invoice.invoiceNumber} (${invoice.dueDate.toLocaleDateString('de-DE')})`
        );
      }
    }
  }

  // 4. Summary speichern
  try {
    await saveSummaryToMC(summary);
  } catch (err) {
    summary.errors.push(`Summary-Report: ${err}`);
  }

  console.log(
    `[Conto-Agent] Fertig. Bezahlt: ${summary.paidCount}, Überfällig: ${summary.overdueCount}, Neue Tasks: ${summary.newTasksCreated}`
  );
  return summary;
}

// ─── CLI Entry ───────────────────────────────────────────────────────────────

if (require.main === module) {
  const csvPath = process.argv[2];
  const csvContent = csvPath
    ? require('fs').readFileSync(csvPath, 'utf-8')
    : undefined;

  runContoAgent(csvContent)
    .then((s) => {
      console.log('\n[Conto-Agent] Summary:');
      console.log(JSON.stringify(s, null, 2));
      process.exit(0);
    })
    .catch((e) => {
      console.error('[Conto-Agent] Fatal:', e);
      process.exit(1);
    });
}
