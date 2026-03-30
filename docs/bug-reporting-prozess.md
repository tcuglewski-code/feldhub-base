# Bug-Reporting Prozess — Feldhub

> Sprint JN | Erstellt: 31.03.2026

## Übersicht

Kunden können Fehler und Feature-Wünsche direkt über das System melden.
Der Report wird automatisch als Ticket in Mission Control angelegt.

## Flow

```
Kunde füllt Formular aus
        ↓
POST /api/bug-report
        ↓
Validierung (Zod Schema)
        ↓
Mission Control API → Ticket anlegen
        ↓
E-Mail-Bestätigung an Kunden (optional, via Resend)
        ↓
Team bearbeitet Ticket in Mission Control
```

## Endpunkt

```
POST /api/bug-report
Content-Type: application/json
```

### Request Body

| Feld | Typ | Pflicht | Beschreibung |
|------|-----|---------|-------------|
| reporterName | string | ✅ | Name des Meldenden |
| reporterEmail | email | ✅ | E-Mail für Rückmeldung |
| title | string | ✅ | Kurztitel (5-200 Zeichen) |
| description | string | ✅ | Detaillierte Beschreibung |
| severity | low\|medium\|high\|critical | — | Default: medium |
| category | bug\|feature\|question\|other | — | Default: bug |
| stepsToReproduce | string | — | Optionale Schritte |
| expectedBehavior | string | — | Was sollte passieren |
| actualBehavior | string | — | Was ist passiert |
| url | url | — | Betroffene Seite |
| browser | string | — | Browser/Version |

### Response

```json
{
  "success": true,
  "ticketId": "ticket_abc123",
  "message": "Ihr Bericht wurde erfasst (Ticket #ticket_abc123)."
}
```

## UI-Komponenten

- `BugReportForm` — Formular-Komponente (einbettbar, `compact` Prop für kleine Spaces)
- `/support/bug-report` — Standalone-Seite (auch ohne Login erreichbar)

## Anti-Spam

- Honeypot-Feld `website` (muss leer bleiben)
- IP-basiertes Rate-Limiting (TODO: Redis/Upstash in Produktion)
- Zod-Validierung mit Min/Max Längen

## Environment Variables

```env
MISSION_CONTROL_URL=https://mission-control-tawny-omega.vercel.app
MISSION_CONTROL_API_KEY=mc_live_...   # oder MC_API_KEY
RESEND_API_KEY=re_...                  # optional, für Bestätigungs-E-Mails
```

## Mission Control Integration

Tickets werden automatisch erstellt mit:
- Priority: LOW/MEDIUM/HIGH/URGENT (aus severity)
- Category: BUG/FEATURE/QUESTION/OTHER
- Status: OPEN
- Source: `customer_report`
- Metadata: severity, url, browser, tenantId

## Einbinden in eigene Seite

```tsx
import { BugReportForm } from "@/components/support/BugReportForm"

// Standard
<BugReportForm onSuccess={(ticketId) => console.log(ticketId)} />

// Kompakt (für Modals/Sidebars)
<BugReportForm compact />
```

## SLA (aus SLA-Dokument)

| Schweregrad | Reaktionszeit | Lösungszeit |
|-------------|--------------|-------------|
| Kritisch | 1 Stunde | 4 Stunden |
| Hoch | 4 Stunden | 1 Werktag |
| Mittel | 1 Werktag | 3 Werktage |
| Niedrig | 3 Werktage | 10 Werktage |
