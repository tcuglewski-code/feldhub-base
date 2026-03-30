# Ersttermin-Workflow: Calendly + Automatische Bestätigung
**Sprint JK | Stand: 31.03.2026**

---

## Übersicht

Strukturierter Workflow vom ersten Kontakt bis zum qualifizierten Sales-Gespräch.
Automatisiert wo möglich, persönlich wo es zählt.

```
Lead-Kontakt → Calendly Link → Termin-Buchung → Auto-Bestätigung
    → Erinnerungen → Ersttermin → Follow-up → CRM-Update
```

---

## Teil 1: Calendly Setup

### Konto & Produkt
- **Plan:** Calendly Professional (15€/Monat) oder Standard (10€/Monat)
- **Kalender:** Google Calendar oder Microsoft 365 verbinden
- **URL:** `calendly.com/feldhub` oder `calendly.com/tomek-feldhub`

### Event-Typen erstellen

#### Event Typ 1: "20-Min Demo" (Hauptprodukt)
```yaml
Name: "Feldhub Demo — 20 Minuten"
Beschreibung: |
  Lernen Sie Feldhub kennen. Wir zeigen Ihnen in 20 Minuten,
  wie eine digitale Lösung für Ihren Betrieb aussehen könnte.
  Kein Verkaufsgespräch — ehrliche Einschätzung.
Dauer: 20 Minuten
Format: Video-Call (Google Meet / Zoom)
Verfügbarkeit:
  - Mo-Fr: 09:00-12:00 und 14:00-17:00
  - Puffer nach Termin: 15 Minuten
  - Max. Buchungen/Tag: 4
Fragen (Pflichtfelder):
  - "Welche Branche / welcher Betrieb?" (Text)
  - "Wie viele Außendienstmitarbeiter?" (Auswahl: 1-5 / 5-20 / 20+)
  - "Was ist Ihr größtes Problem aktuell?" (Text, optional)
  - "Wie haben Sie von Feldhub erfahren?" (Auswahl)
```

#### Event Typ 2: "45-Min Discovery Call" (für qualifizierte Leads)
```yaml
Name: "Feldhub Discovery Call — 45 Minuten"
Beschreibung: |
  Für Betriebe, die konkret über eine Digitalisierung nachdenken.
  Wir analysieren Ihre Prozesse und skizzieren eine mögliche Lösung.
Dauer: 45 Minuten
Verfügbarkeit: Di + Do: 10:00-16:00
Fragen:
  - "Beschreiben Sie Ihre aktuellen Hauptprozesse" (Text)
  - "Was hat Sie bisher von einer Digitalisierung abgehalten?" (Text)
  - "Gibt es einen konkreten Zeitplan/Budget?" (Auswahl: sofort/3Mon/6Mon/offen)
```

---

## Teil 2: Automatische E-Mail-Flows

### Buchungsbestätigung (sofort nach Buchung)

**Betreff:** `✅ Ihr Demo-Termin ist bestätigt — [Datum] um [Uhrzeit]`

```
Hallo [Vorname],

vielen Dank für Ihre Buchung!

📅 Termin: [Datum], [Uhrzeit] Uhr
🎥 Meeting-Link: [Calendly/Google Meet Link]
⏱️ Dauer: 20 Minuten

Was Sie erwartet:
• Kurze Vorstellung Feldhub (5 Min)
• Ihre Situation + Ziele (10 Min)
• Erste Einschätzung + nächste Schritte (5 Min)

Vorbereitung (optional):
Wenn Sie Lust haben, notieren Sie sich kurz:
1. Welche Prozesse kosten Sie am meisten Zeit?
2. Wie dokumentieren Sie aktuell (Papier/Excel/App)?

Bis bald,
Tomek Cuglewski
Gründer, Feldhub

P.S. Haben Sie Fragen vorab? Einfach auf diese Mail antworten.
```

---

### Erinnerung 24h vorher

**Betreff:** `⏰ Erinnerung: Feldhub Demo morgen um [Uhrzeit]`

```
Hallo [Vorname],

nur eine kurze Erinnerung — unser Gespräch ist morgen:

📅 [Datum], [Uhrzeit] Uhr
🎥 [Meeting-Link]

Falls Sie den Termin verschieben müssen:
→ [Calendly Reschedule-Link]

Freue mich auf das Gespräch,
Tomek
```

---

### Erinnerung 1h vorher

**Betreff:** `🚀 In 1 Stunde: Ihr Feldhub Demo-Termin`

```
Hallo [Vorname],

in einer Stunde ist es soweit!

🔗 Meeting-Link: [Link]
(Bitte klicken Sie kurz vor [Uhrzeit] Uhr)

Bis gleich,
Tomek
```

---

### Follow-up 1: 2h nach Termin (falls kein Kauf)

**Betreff:** `Danke für das Gespräch + nächste Schritte`

```
Hallo [Vorname],

danke für Ihre Zeit heute!

[PERSONALISIERTER ABSCHNITT — manuell anpassen]:
"Wie besprochen, ..."

Nächste Schritte:
→ [Angebot / Demo-Link / Konzept-Dokument]

Ich melde mich in [X] Tagen mit [konkretem Mehrwert].

Viele Grüße,
Tomek

---
Feldhub | Digitale Betriebssysteme für den Außendienst
```

---

### Follow-up 2: 7 Tage nach Termin (falls kein Reply)

**Betreff:** `Kurze Frage zu Ihrer Situation`

```
Hallo [Vorname],

ich wollte kurz nachfragen, ob Sie noch Fragen zu Feldhub haben.

Kein Druck — manchmal braucht eine Entscheidung einfach Zeit.

Falls Sie gerne noch mehr sehen möchten:
→ [Case Study Koch Aufforstung]
→ [ROI-Rechner]

Falls der Zeitpunkt gerade nicht passt, kein Problem — ich melde mich
in 3 Monaten wieder.

Viele Grüße,
Tomek
```

---

## Teil 3: Calendly + CRM Integration

### Automatischer MC-Lead aus Calendly-Buchung

Webhook einrichten in Calendly (Professional Plan):

```javascript
// Calendly Webhook → Mission Control API
// POST https://mission-control-tawny-omega.vercel.app/api/leads

const handleCalendlyBooking = async (event) => {
  const { invitee, event_type, scheduled_event } = event.payload;

  const lead = {
    name: invitee.name,
    email: invitee.email,
    source: 'calendly',
    status: 'demo_booked',
    notes: invitee.questions_and_answers
      .map(qa => `${qa.question}: ${qa.answer}`)
      .join('\n'),
    scheduled_at: scheduled_event.start_time,
    created_at: new Date().toISOString()
  };

  await fetch('https://mission-control-tawny-omega.vercel.app/api/leads', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-amadeus-token': process.env.AMADEUS_TOKEN
    },
    body: JSON.stringify(lead)
  });
};
```

### Status-Updates in MC

| Trigger | MC Status |
|---------|----------|
| Termin gebucht | `demo_booked` |
| Termin stattgefunden | `demo_done` |
| Angebot gesendet | `proposal_sent` |
| Gewonnen | `won` |
| Verloren | `lost` |

---

## Teil 4: Ersttermin — Gesprächsleitfaden

### Struktur (20 Min Demo)

```
00:00 — 02:00: Warm-Up
  "Danke für Ihre Zeit. Kurz zu mir: Ich bin Tomek, Gründer von Feldhub.
   Wir bauen Software für Betriebe wie Ihren. Darf ich kurz fragen..."

02:00 — 10:00: Discovery (WICHTIGSTE Phase!)
  - "Was machen Sie aktuell konkret — wie läuft ein typischer Projekttag?"
  - "Wo verlieren Sie am meisten Zeit / was nervt am meisten?"
  - "Haben Sie schon mal Software ausprobiert? Was hat nicht gepasst?"

10:00 — 17:00: Demo (maßgeschneidert auf Discovery!)
  - Nur die Features zeigen, die für ihre Situation relevant sind
  - Koch Aufforstung als Referenz-Beispiel
  - Einwände sofort aufgreifen

17:00 — 20:00: Nächste Schritte
  - "Passt das zu dem, was Sie suchen?"
  - "Wäre ein 45-Min Discovery Call sinnvoll?"
  - IMMER konkreten nächsten Schritt vereinbaren
```

### Qualifizierungs-Fragen (BANT)

| Kriterium | Frage |
|-----------|-------|
| **Budget** | "Haben Sie ein Jahresbudget für Software/IT?" |
| **Authority** | "Sind Sie der Entscheider, oder sind weitere Personen involviert?" |
| **Need** | "Wie dringend ist das Problem für Sie?" (Skala 1-10) |
| **Timeline** | "Bis wann sollte eine Lösung in Betrieb sein?" |

**Qualifizierter Lead:** Need ≥ 7 + Timeline ≤ 6 Monate + Budget vorhanden

---

## Teil 5: Tech-Stack

| Tool | Zweck | Kosten |
|------|-------|--------|
| Calendly Professional | Buchungssystem | ~15€/Monat |
| Google Meet | Video-Call (im Preis inkl.) | 0€ |
| Mission Control | CRM + Lead-Tracking | (eigenes System) |
| Gmail/Outlook | Email-Follow-ups | 0€ |
| Loom | Demo-Video asynchron | 12€/Monat optional |

**Gesamtkosten: ~15€/Monat**

---

## Nächste Schritte für Tomek

1. **Sofort:** Calendly-Account anlegen (tomek@feldhub.de)
2. **Tag 1:** Event-Typ "20-Min Demo" einrichten mit allen Fragen
3. **Tag 2:** Email-Templates in Calendly hinterlegen
4. **Tag 3:** Calendly-Link auf Website + LinkedIn integrieren
5. **Woche 2:** Webhook → Mission Control aktivieren (Archie einbinden)

---

*Dokument erstellt im Sprint JK — Feldhub Sprint Loop*
