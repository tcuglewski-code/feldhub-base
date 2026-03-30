# Finance Review Cron

Automatisierter monatlicher Finanz-Report für Feldhub.

## Überblick

Der Finance Review Cron läuft am **1. jeden Monats um 06:00 UTC** und erstellt einen umfassenden Finanzbericht über den Vormonat.

## Features

### Metriken

- **MRR (Monthly Recurring Revenue)** — Summe aller aktiven Tenant-Abos
- **MRR Wachstum** — Veränderung zum Vormonat (absolut + prozentual)
- **Neue Kunden** — Im Monat hinzugekommene Tenants
- **Churn** — Gekündigte Tenants + Churn Rate
- **Offene Rechnungen** — Unbezahlte + überfällige Rechnungen
- **Paket-Breakdown** — MRR aufgeschlüsselt nach Paketen

### Outputs

1. **Markdown Report** → `/reports/finance/YYYY-MM.md`
2. **CSV Export** → `/reports/finance/YYYY-MM.csv` (für Steuerberater)
3. **Mission Control API** → POST an `/api/reports`

## Konfiguration

### Umgebungsvariablen

```env
# Mission Control API
MC_API_URL=https://mission-control-tawny-omega.vercel.app
MC_API_KEY=mc_live_xxx

# Optional: Custom Paketpreise
PACKAGE_PRICE_STARTER=299
PACKAGE_PRICE_PROFESSIONAL=599
PACKAGE_PRICE_ENTERPRISE=999
```

### Paketpreise

Standard-Preise (monatlich in EUR):

| Paket | Preis |
|-------|-------|
| Starter | €299 |
| Professional | €599 |
| Enterprise | €999 |
| Custom | individuell per `tenant.customPrice` |

## Cron Setup

### Vercel Cron

In `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/finance-review",
      "schedule": "0 6 1 * *"
    }
  ]
}
```

### API Route

Erstelle `/app/api/cron/finance-review/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { runFinanceReview } from '@/src/cron/finance-review'

export async function GET(request: Request) {
  // Cron Secret validieren
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    const report = await runFinanceReview()
    return NextResponse.json({ 
      success: true, 
      period: report.period,
      mrr: report.mrr,
      activeTenants: report.totalActiveTenants
    })
  } catch (error) {
    console.error('[Finance Review Cron] Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
```

### Manueller Aufruf

```bash
# Aktuellen Monat (Vormonat)
npx ts-node src/cron/finance-review.ts

# Spezifischer Monat
MC_API_KEY=xxx npx ts-node -e "require('./src/cron/finance-review').runFinanceReview(2026, 3)"
```

## Report-Beispiel

```markdown
# Finance Report 2026-03

## 📊 Executive Summary

| Metrik | Wert |
|--------|------|
| **MRR** | €2.396 |
| **MRR Wachstum** | +€599 (+33.3%) |
| **Aktive Kunden** | 4 |
| **Churn Rate** | 0% |
```

## CSV Format

Das CSV enthält alle Daten in einem Format, das direkt an den Steuerberater weitergegeben werden kann:

```csv
Kategorie,Beschreibung,Wert,Währung
MRR,Monthly Recurring Revenue,2396,EUR
ARR,Annual Recurring Revenue,28752,EUR
...
```

## Mission Control Integration

Der Report wird automatisch an Mission Control gesendet:

- **Endpoint:** `POST /api/reports`
- **Auth:** `x-api-key` Header
- **Payload:** JSON mit Report-Daten + Markdown

## Datenbank-Anforderungen

### Tenant Table

```prisma
model Tenant {
  id           String    @id @default(cuid())
  name         String
  package      String    @default("professional")
  customPrice  Int?      // Überschreibt Paketpreis
  status       String    @default("active") // active, inactive, trial, churned
  createdAt    DateTime  @default(now())
  cancelledAt  DateTime?
}
```

### Invoice Table

```prisma
model Invoice {
  id        String   @id @default(cuid())
  tenantId  String
  tenant    Tenant   @relation(fields: [tenantId], references: [id])
  amount    Int      // Cent-Betrag
  status    String   // open, paid, overdue, cancelled
  dueDate   DateTime
  issuedAt  DateTime @default(now())
  paidAt    DateTime?
}
```

## Fehlerbehandlung

- **DB nicht erreichbar:** Report mit leeren Daten, Warnung in Console
- **MC API Fehler:** Report trotzdem lokal geschrieben, Fehler geloggt
- **Keine Daten:** Leerer Report wird generiert (keine Tenants = €0 MRR)

## Erweiterungen (geplant)

- [ ] Cohort-Analyse (Retention nach Signup-Monat)
- [ ] Revenue Forecasting (3-Monats-Prognose)
- [ ] Email-Versand an Tomek
- [ ] Slack/Telegram Notification
