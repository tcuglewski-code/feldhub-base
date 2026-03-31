# Conto-Agent — Automatische Zahlungseingangsprüfung
## Sprint KB | 31.03.2026

---

## Was macht der Conto-Agent?

Täglich prüft der Conto-Agent ob alle SaaS-Kunden ihre Rechnungen bezahlt haben:

1. **Lädt offene Rechnungen** aus Mission Control
2. **Prüft Zahlungsstatus** via Stripe API oder SEPA-CSV-Import
3. **Markiert bezahlte Rechnungen** als `paid` in MC
4. **Erstellt Mahnungs-Tasks** für überfällige Rechnungen
5. **Speichert Finance-Summary** in MC Reports

---

## Architektur

```
Cron: täglich 07:00
     ↓
  fetchOpenInvoices()    ← MC /api/invoices?status=sent,overdue
     ↓
  checkStripePayment()   ← Stripe API (TODO: echte Integration)
  checkSepaPayments()    ← SEPA CSV-Import (Kontoauszug)
     ↓
  isPaid?
    ✅ updateInvoiceStatus('paid')
    ❌ daysPastDue > 0?
       → updateInvoiceStatus('overdue')
       → createReminderTask() bei Tag 7/21/35/60+
     ↓
  saveSummaryToMC()      ← MC /api/reports
```

---

## Datei

`src/cron/conto-agent.ts`

---

## Mahnungslogik

| Tag | Aktion |
|-----|--------|
| 0 | Rechnung als "overdue" markieren |
| 7 | MC-Task: 1. Mahnung empfohlen |
| 21 | MC-Task: 2. Mahnung empfohlen |
| 35 | MC-Task: 3. Mahnung / letzte Frist |
| 60+ | MC-Task: KRITISCH — rechtliche Schritte |

---

## Payment Methods

| Methode | Status | Integration |
|---------|--------|-------------|
| Stripe | 🟡 Simulation | TODO: `STRIPE_SECRET_KEY` env + `stripe` npm |
| SEPA CSV | ✅ Implementiert | CSV-Import via `parseSepaCsv()` |
| Banküberweisung | 🟡 Via SEPA CSV | Kontoauszug manuell importieren |

---

## SEPA CSV Format

```csv
Datum;Empfänger;Betrag;Verwendungszweck;IBAN
01.04.2026;Koch Aufforstung GmbH;490,00;FH-2026-001 Monatliche Gebuehr;DE12345678901234567890
```

Rechnungsnummer im Verwendungszweck: `FH-YYYY-NNN`

---

## MC API Endpoints (zu implementieren)

| Methode | Route | Beschreibung |
|---------|-------|-------------|
| GET | /api/invoices | Rechnungen mit Status-Filter |
| PATCH | /api/invoices/:id | Status updaten |
| POST | /api/reports | Report/Summary speichern |

---

## Nächste Schritte

- [ ] **Stripe API Integration** — `STRIPE_SECRET_KEY` + `stripe` npm package
- [ ] **MC Invoices Routes** — Archie implementiert /api/invoices
- [ ] **SEPA CSV Upload** — Formular in MC für Kontoauszug-Import
- [ ] **E-Mail Mahnungen** — Himalaya-Integration für automatische Mahnschreiben
- [ ] **Cron in OpenClaw** anlegen: täglich 07:00

---

## Zusammenspiel mit anderen Agenten

```
Conto-Agent (KB)         → prüft Zahlungen, erstellt Tasks
Finance-Review (JR)      → monatliche Zusammenfassung MRR/Churn
Rechnungsvorlage (JT)    → erzeugt Rechnungen (PDF)
Cash Flow Dashboard (JQ) → zeigt Runway + Forecast
```
