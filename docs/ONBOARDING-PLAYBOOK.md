# AppFabrik Onboarding-Playbook

> Standardisierter 4-Wochen-Prozess für neue Kunden

## Übersicht

| Phase | Zeitraum | Fokus |
|-------|----------|-------|
| Woche 1 | Tag 1-7 | Kickoff & Technisches Setup |
| Woche 2 | Tag 8-14 | Datenmigration & Konfiguration |
| Woche 3 | Tag 15-21 | Training & Testing |
| Woche 4 | Tag 22-28 | Go-Live & Stabilisierung |

---

## Woche 1: Kickoff & Technisches Setup

### Tag 1: Kickoff-Call (60-90 Min)

**Teilnehmer:**
- AppFabrik: Tomek (Account), Amadeus (Technik)
- Kunde: Geschäftsführer, IT-Ansprechpartner, 1-2 Key User

**Agenda:**

1. **Vorstellungsrunde** (5 Min)
   - Wer macht was bei AppFabrik?
   - Wer sind die Ansprechpartner beim Kunden?

2. **Projektziele definieren** (15 Min)
   - Was soll die Software lösen?
   - Welche Prozesse werden digitalisiert?
   - Welche KPIs werden gemessen? (z.B. Zeitersparnis, Fehlerreduktion)

3. **Scope-Abstimmung** (20 Min)
   - Welches Paket wurde gebucht? (Basic/Pro/Enterprise)
   - Welche Module werden aktiviert?
   - Anzahl Nutzer / Geräte
   - Mobile App: Android, iOS oder beide?

4. **Datenmigration besprechen** (15 Min)
   - Welche Daten existieren bereits? (Excel, Legacy-System)
   - Format der Daten?
   - Wer liefert die Daten bis wann?

5. **Zeitplan & Meilensteine** (10 Min)
   - Bestätigung der 4-Wochen-Timeline
   - Go-Live-Termin festlegen
   - Wöchentliche Check-in-Termine vereinbaren

6. **Nächste Schritte** (5 Min)
   - Kunde liefert: Logo, Firmenfarben, Mitarbeiterliste
   - AppFabrik: Technisches Setup beginnt

**Deliverable:** Kickoff-Protokoll mit allen Entscheidungen (PDF an alle Teilnehmer)

### Tag 2-3: Technisches Setup

**Verantwortlich:** Amadeus (oder technischer Agent)

**Checkliste:**

- [ ] **GitHub Repository** — Fork von appfabrik-base erstellen
  - Repo-Name: `{kundenname}-manager`
  - Branch Protection aktivieren (main)

- [ ] **Vercel Projekt** — Neues Projekt anlegen
  - Mit GitHub verbinden
  - Domain: `{kundenname}-manager.vercel.app` (temporär)
  - Später: `app.{kundendomain}.de`

- [ ] **Neon Datenbank** — Neues Projekt erstellen
  - Projekt-Name: `{kundenname}-prod`
  - Region: eu-central-1 (Frankfurt)
  - Connection String → Vercel ENV

- [ ] **ENV-Variablen setzen:**
  ```
  DATABASE_URL=postgresql://...
  NEXTAUTH_SECRET=... (generieren)
  NEXTAUTH_URL=https://...
  TENANT_ID={kundenname}
  TENANT_NAME={Firmenname}
  ```

- [ ] **tenant.ts konfigurieren:**
  - Firmenname
  - Logo-URL (später)
  - Primär-/Sekundärfarben
  - Aktivierte Module
  - Rollen-Konfiguration

- [ ] **Prisma Migration** — Schema deployen
  ```bash
  npx prisma migrate deploy
  npx prisma db seed
  ```

- [ ] **Admin-Account** anlegen
  - Email des Kunden-Admins
  - Temporäres Passwort (muss beim ersten Login geändert werden)

- [ ] **SSL/Domain** (falls Kundendomain)
  - DNS CNAME auf Vercel
  - SSL automatisch via Vercel

**Deliverable:** System online + Admin-Login-Daten an Kunden

### Tag 4-5: Mobile App Setup (falls gebucht)

- [ ] **EAS Projekt** — Neues Projekt in Expo Account
- [ ] **App-Branding:**
  - Bundle ID: `de.{kundenname}.app`
  - App-Name
  - App-Icon (von Kunde)
  - Splash Screen
- [ ] **eas.json** konfigurieren
- [ ] **Interner Test-Build** starten
  - Android APK für internen Test
  - iOS TestFlight (falls Apple Developer Account vorhanden)

### Tag 6-7: Technische Abnahme

- [ ] Web-Dashboard erreichbar
- [ ] Login funktioniert
- [ ] Basis-Navigation vorhanden
- [ ] Farben/Logo korrekt
- [ ] Mobile App installierbar (Test-Build)

**Wöchentlicher Check-in (30 Min):**
- Demo des Systems
- Offene Fragen klären
- Datenlieferung für Woche 2 bestätigen

---

## Woche 2: Datenmigration & Konfiguration

### Tag 8-10: Datenimport

**Vorbereitung:**
- Daten vom Kunden erhalten (Excel, CSV, Datenbank-Export)
- Datenqualität prüfen (Duplikate, fehlende Felder)

**Migration Reihenfolge:**

1. **Stammdaten:**
   - Mitarbeiter (Name, Email, Rolle)
   - Kunden/Auftraggeber
   - Standorte/Adressen

2. **Projektdaten:**
   - Aktive Projekte/Aufträge
   - Historische Daten (optional, nach Aufwand)

3. **Materialien/Lager:**
   - Inventar
   - Kategorien

**Import-Methoden:**
- CSV-Import via Admin-Dashboard (empfohlen)
- API-Bulk-Import (bei großen Datenmengen)
- Manuell via Prisma Seed (Sonderfälle)

**Qualitätssicherung:**
- Stichproben-Prüfung mit Kunde
- Alle importierten Datensätze im Dashboard verifizieren

### Tag 11-12: Modul-Konfiguration

Je nach gebuchten Modulen:

**Auftragsverwaltung:**
- [ ] Auftragstypen definieren (z.B. Pflanzung, Pflege, Ernte)
- [ ] Status-Workflow konfigurieren
- [ ] Pflichtfelder festlegen

**Zeiterfassung:**
- [ ] Arbeitszeit-Regeln (Beginn, Ende, Pausen)
- [ ] Überstunden-Berechnung
- [ ] Export-Format (DATEV, Excel)

**Rechnungsstellung:**
- [ ] Rechnungsvorlage mit Kunden-Logo
- [ ] Steuersätze, Zahlungsziele
- [ ] Rechnungsnummern-Schema

**Dokumentenverwaltung:**
- [ ] Ordnerstruktur anlegen
- [ ] Upload-Berechtigungen pro Rolle

**Benachrichtigungen:**
- [ ] Push-Notifications aktivieren
- [ ] Email-Benachrichtigungen konfigurieren
- [ ] Welche Events triggern Notifications?

### Tag 13-14: Berechtigungen & Rollen

- [ ] Rollen definieren (z.B. Admin, Büro, Gruppenführer, Mitarbeiter)
- [ ] Berechtigungsmatrix mit Kunden abstimmen:
  | Modul | Admin | Büro | Gruppenführer | Mitarbeiter |
  |-------|-------|------|---------------|-------------|
  | Aufträge anlegen | ✅ | ✅ | ❌ | ❌ |
  | Aufträge bearbeiten | ✅ | ✅ | ✅ | ❌ |
  | Zeiten erfassen | ✅ | ✅ | ✅ | ✅ |
  | Rechnungen | ✅ | ✅ | ❌ | ❌ |
  | Mitarbeiter verwalten | ✅ | ❌ | ❌ | ❌ |

- [ ] Test-Accounts für jede Rolle erstellen
- [ ] Berechtigungen verifizieren

**Wöchentlicher Check-in (30 Min):**
- Datenimport-Ergebnis präsentieren
- Konfiguration abnehmen lassen
- Training-Agenda für Woche 3 besprechen

---

## Woche 3: Training & Testing

### Tag 15-17: Admin-Training

**Teilnehmer:** Kunden-Admin + Büro-Mitarbeiter
**Format:** Videocall (Screen-Sharing) oder vor Ort
**Dauer:** 2-3 Stunden

**Agenda Admin-Training:**

1. **System-Übersicht** (15 Min)
   - Dashboard verstehen
   - Navigation
   - Schnellsuche (Cmd+K)

2. **Stammdaten verwalten** (30 Min)
   - Mitarbeiter anlegen/bearbeiten
   - Kunden verwalten
   - Rollen zuweisen

3. **Aufträge managen** (30 Min)
   - Auftrag anlegen
   - Status ändern
   - Mitarbeiter zuweisen
   - Dokumente anhängen

4. **Zeiterfassung** (20 Min)
   - Zeiten einsehen
   - Korrekturen vornehmen
   - Export für Lohnbuchhaltung

5. **Rechnungen** (20 Min)
   - Rechnung erstellen
   - PDF-Export
   - Zahlungseingang verbuchen

6. **Einstellungen** (15 Min)
   - Benutzer einladen
   - 2FA aktivieren
   - Benachrichtigungen konfigurieren

7. **Fragen & Antworten** (20 Min)

**Deliverable:** Aufzeichnung des Trainings (optional), Quick-Reference-Guide (PDF)

### Tag 18-19: Mobile App Training

**Teilnehmer:** Gruppenführer + ausgewählte Außendienst-Mitarbeiter
**Format:** Vor Ort empfohlen (echte Geräte)
**Dauer:** 1-2 Stunden

**Agenda App-Training:**

1. **App Installation** (10 Min)
   - Download + Login
   - Offline-Modus erklären

2. **Täglicher Workflow** (30 Min)
   - Aufträge einsehen
   - Zeiten starten/stoppen
   - Fotos hochladen
   - GPS-Track aktivieren

3. **Protokolle** (20 Min)
   - Tagesprotokoll erstellen
   - Material-Verbrauch erfassen
   - Unterschrift einholen

4. **Lager/Material** (15 Min)
   - Bestand einsehen
   - Material entnehmen

5. **Offline-Nutzung** (15 Min)
   - Was funktioniert offline?
   - Wann wird synchronisiert?
   - Konfliktlösung

**Deliverable:** App-Kurzanleitung (1-2 Seiten, laminiert für Außendienst)

### Tag 20-21: User Acceptance Testing (UAT)

**Beteiligte:** Alle Key User vom Kunden

**Test-Szenarien:**

1. **Szenario A: Neuer Auftrag**
   - Admin legt Auftrag an
   - Weist Gruppenführer zu
   - Gruppenführer sieht Auftrag in App
   - Mitarbeiter erfassen Zeiten
   - Admin prüft Zeiterfassung

2. **Szenario B: Kompletter Workflow**
   - Auftrag → Durchführung → Protokoll → Rechnung → Bezahlt

3. **Szenario C: Offline-Test**
   - Flugmodus aktivieren
   - Zeiten erfassen
   - Fotos machen
   - Wieder online → Sync prüfen

4. **Szenario D: Fehlerfälle**
   - Falsches Passwort
   - Doppelte Zeiterfassung
   - Fehlende Pflichtfelder

**Bug-Tracking:**
- Alle Probleme in Mission Control Task erfassen
- Prio: Kritisch (Blocker) / Hoch / Mittel / Niedrig
- Kritische Bugs vor Go-Live fixen

**Wöchentlicher Check-in (30 Min):**
- UAT-Ergebnisse besprechen
- Offene Bugs priorisieren
- Go-Live-Readiness prüfen
- Go-Live-Termin final bestätigen

---

## Woche 4: Go-Live & Stabilisierung

### Tag 22: Pre-Go-Live Checkliste

**Technisch:**
- [ ] Alle kritischen Bugs behoben
- [ ] Performance-Check (Ladezeiten <3s)
- [ ] Backup-System aktiv
- [ ] Monitoring aktiv (Uptime-Check)
- [ ] SSL-Zertifikat gültig

**Daten:**
- [ ] Alle Stammdaten importiert
- [ ] Test-Daten entfernt
- [ ] Produktiv-Accounts für alle Nutzer erstellt
- [ ] Admin hat 2FA aktiviert

**Kommunikation:**
- [ ] Alle Mitarbeiter informiert (Go-Live-Datum)
- [ ] Login-Daten verteilt
- [ ] Kurzanleitungen ausgeteilt
- [ ] Support-Kontakt kommuniziert

### Tag 23: Go-Live 🚀

**Morgens:**
- [ ] System nochmals testen
- [ ] "Go-Live"-Flag in tenant.ts aktivieren (falls vorhanden)
- [ ] Alle Nutzer können sich einloggen

**Tagsüber:**
- [ ] Erster echter Arbeitstag mit dem System
- [ ] AppFabrik-Team in Bereitschaft für Fragen
- [ ] Schnelle Reaktion auf Probleme (<1h)

**Abends:**
- [ ] Check: Wurden Daten erfasst?
- [ ] Erste Sync-Zyklen erfolgreich?
- [ ] Grobe Probleme?

### Tag 24-26: Hyper-Care Phase

**Täglicher Check-in (15 Min) mit Kunden-Admin:**
- Was lief gut?
- Was war schwierig?
- Welche Fragen haben die Nutzer?

**Schnelle Reaktion auf:**
- Login-Probleme → Sofort lösen
- Verwirrung bei Nutzern → Kurz-Erklärung per Video
- Feature-Requests → Aufnehmen, nicht versprechen

**Typische Go-Live-Probleme:**
| Problem | Lösung |
|---------|--------|
| "Passwort vergessen" | Passwort-Reset-Link senden |
| "App synchronisiert nicht" | WLAN-Verbindung prüfen, App neustarten |
| "Auftrag nicht sichtbar" | Berechtigungen prüfen |
| "Zeiten doppelt" | Duplikate manuell löschen, Workflow erklären |

### Tag 27-28: Stabilisierung & Abschluss

**Review-Meeting (60 Min):**

1. **Rückblick Onboarding** (15 Min)
   - Was lief gut?
   - Was können wir verbessern?
   - NPS-Abfrage (0-10)

2. **Offene Punkte** (15 Min)
   - Noch nicht umgesetzte Wünsche
   - Geplante Features für nächstes Quartal

3. **Support-Prozess** (15 Min)
   - Wie erreicht der Kunde Support?
   - Reaktionszeiten (SLA)
   - Eskalationspfad

4. **Nächste Schritte** (15 Min)
   - Monatlicher Status-Call vereinbaren
   - Feedback-Schleife etablieren
   - Referenz-Anfrage (falls zufrieden)

**Deliverables an Kunden:**
- [ ] Vollständige Dokumentation (Admin-Handbuch)
- [ ] Kurzanleitungen für alle Rollen
- [ ] Support-Kontaktdaten
- [ ] SLA-Dokument (Uptime, Reaktionszeiten)
- [ ] Erste Rechnung (Setup-Fee + erster Monat)

---

## Checklisten-Zusammenfassung

### Vom Kunden benötigt (vor Kickoff):

- [ ] Firmenlogo (PNG, min. 500x500px, transparent)
- [ ] Firmenfarben (Hex-Codes)
- [ ] Mitarbeiterliste (Name, Email, Rolle)
- [ ] Kundenliste (falls vorhanden)
- [ ] Bestehende Daten (Excel/CSV)
- [ ] Apple Developer Account (für iOS App, falls gebucht)

### Von AppFabrik geliefert (nach Go-Live):

- [ ] Web-Dashboard (URL + Admin-Login)
- [ ] Mobile App (Android APK / iOS TestFlight)
- [ ] Admin-Handbuch (PDF)
- [ ] Kurzanleitungen pro Rolle (PDF)
- [ ] Training-Aufzeichnungen (optional)
- [ ] SLA-Dokument
- [ ] AVV (Auftragsverarbeitungsvertrag)
- [ ] Support-Kontakt

---

## Zeitplan-Vorlage

```
Woche 1
├── Mo: Kickoff-Call
├── Di-Mi: Technisches Setup
├── Do-Fr: Mobile App Setup
└── Fr: Check-in #1

Woche 2
├── Mo-Mi: Datenimport
├── Do-Fr: Konfiguration + Rollen
└── Fr: Check-in #2

Woche 3
├── Mo-Mi: Admin-Training
├── Do: App-Training
├── Fr: UAT + Check-in #3

Woche 4
├── Mo: Pre-Go-Live Check
├── Di: 🚀 GO-LIVE
├── Mi-Fr: Hyper-Care
└── Fr: Abschluss-Meeting
```

---

## Eskalationspfad

| Level | Wer | Wann |
|-------|-----|------|
| L1 | Amadeus (Support-Agent) | Standard-Anfragen, <4h Reaktion |
| L2 | Tomek | Unzufriedener Kunde, technische Blockaden |
| L3 | Tomek (persönlich) | Vertragsthemen, kritische Ausfälle |

---

## Anhang: Email-Vorlagen

### Kickoff-Einladung

```
Betreff: [AppFabrik] Kickoff-Termin {Firmenname}

Hallo {Name},

willkommen bei AppFabrik! 🎉

Für den Start Ihres Projekts möchten wir einen Kickoff-Call vereinbaren:

📅 Terminvorschlag: {Datum}, {Uhrzeit}
⏱️ Dauer: ca. 60-90 Minuten
📍 Online via Google Meet / Teams

Bitte bringen Sie mit:
- Ihr Firmenlogo (PNG, transparent)
- Ihre Firmenfarben (Hex-Codes)
- Eine Liste Ihrer Mitarbeiter (Name, Email, Rolle)

Ich sende Ihnen vorab eine Agenda.

Bei Rückfragen erreichen Sie mich jederzeit unter dieser Email.

Beste Grüße
Tomek
AppFabrik
```

### Go-Live Ankündigung (an Mitarbeiter)

```
Betreff: Unser neues System startet am {Datum}!

Liebe Kolleginnen und Kollegen,

ab {Datum} arbeiten wir mit unserem neuen digitalen System von AppFabrik.

🖥️ Web-Dashboard: {URL}
📱 Mobile App: {Download-Link}

Ihre Zugangsdaten erhalten Sie separat per Email.

Bei Fragen wenden Sie sich bitte an {Admin-Name}.

Viele Grüße
{Geschäftsführer}
```

---

*Erstellt: 29.03.2026 | Version: 1.0 | AppFabrik UG*
