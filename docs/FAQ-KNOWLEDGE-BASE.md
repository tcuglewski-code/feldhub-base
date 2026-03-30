# FAQ & Knowledge Base — Feldhub
**Sprint JM | Stand: 31.03.2026**

---

## Übersicht

Diese Knowledge Base dient drei Zielgruppen:
1. **Interessenten** — Antworten auf Fragen vor dem Kauf
2. **Kunden** — Support-Antworten nach dem Kauf
3. **Intern** — Feldhub Team + Agenten

---

## 🟢 Teil 1: FAQ für Interessenten

### Allgemein

**Was ist Feldhub?**
Feldhub entwickelt maßgeschneiderte digitale Betriebssysteme für Unternehmen mit
Außendienst — Forst, GaLaBau, Tief- und Agrarbau, Reinigung. Wir kombinieren ein
Web-Dashboard für die Büroverwaltung mit einer Offline-fähigen mobilen App für die
Mitarbeiter im Feld.

---

**Was ist der Unterschied zu einer Standard-Software wie SAP, Sage oder Trello?**
Standard-Software ist für alle Branchen gebaut — und deshalb für keine perfekt.
Feldhub startet mit Ihren Prozessen: Wie arbeiten Ihre Mitarbeiter heute? Was sind
die typischen Auftragstypen? Welche Formulare nutzen Sie?

Darauf aufbauend liefern wir eine Lösung, die sich anfühlt wie für Sie gemacht —
weil sie das ist.

---

**Muss ich mich um Hosting und Updates kümmern?**
Nein. Feldhub hostet alles, übernimmt alle Updates, Backups und Sicherheitspatches.
Ihr Betrieb bekommt eine URL und Zugangsdaten — fertig. (SaaS-Modell, wie Netflix
für Ihre Betriebssoftware.)

---

**Funktioniert die App auch ohne Internet?**
Ja. Die mobile App ist Offline-First gebaut. Mitarbeiter können Protokolle ausfüllen,
Fotos machen und GPS-Daten erfassen — auch ohne Netz. Sobald wieder Verbindung
besteht, synchronisiert alles automatisch.

---

**Welche Geräte werden unterstützt?**
- **App:** iOS (iPhone) und Android (alle gängigen Smartphones)
- **Dashboard:** Alle Browser auf PC, Mac, Tablet
- Empfehlung für Außendienst: Robustes Android-Gerät (Samsung Galaxy XCover)

---

**Was kostet Feldhub?**
Feldhub berechnet:
1. **Einmalige Setup-Fee:** Abhängig von Betriebsgröße und Anforderungen (ab 3.000€)
2. **Monatliche SaaS-Gebühr:** Für Hosting, Updates, Support (ab 149€/Monat)

Detailliertes Preismodell → [Preismodell-Dokument](preismodell.md)

---

**Gibt es eine kostenlose Demo?**
Ja. Wir zeigen Ihnen in einem 20-minütigen Videocall, wie eine Lösung für Ihren
Betrieb aussehen würde. Kein Verkaufsgespräch — nur ein ehrliches Gespräch.
→ Demo buchen: [Calendly-Link]

---

**Wie schnell sind wir live?**
Typischerweise 4–8 Wochen von Vertragsabschluss bis Go-Live:
- Woche 1-2: Prozessanalyse + Konfiguration
- Woche 3-4: Entwicklung kundenspezifischer Anpassungen
- Woche 5-6: Test-Phase + Mitarbeiterschulung
- Woche 7-8: Go-Live + Nachbetreuung

---

**Gibt es Referenzkunden?**
Unser erster Kunde ist Koch Aufforstung GmbH — ein Forstdienstleistungsunternehmen
mit über 40 Mitarbeitern in mehreren Bundesländern. Wir können eine Case Study und
auf Wunsch ein Referenzgespräch vermitteln.

---

### Technik & Sicherheit

**Wo werden meine Daten gespeichert?**
Alle Daten liegen auf EU-Servern (Deutschland/Irland). Kein US-Cloud-Anbieter ohne
EU-Standard-Vertragsklauseln. DSGVO-konform. AVV wird standardmäßig abgeschlossen.

---

**Wer hat Zugriff auf meine Daten?**
Nur Sie und Ihr Team. Feldhub-Mitarbeiter haben keinen Zugriff auf Ihre Betriebsdaten,
außer Sie erteilen explizit Support-Zugang für eine bestimmte Aufgabe.

---

**Kann ich Daten exportieren?**
Ja. Jederzeit. Vollständiger Datenexport als JSON und CSV ist im Standard enthalten.
Sie sind nicht gefangen (Kein Vendor Lock-in).

---

**Gibt es eine API für externe Tools?**
Ja. RESTful API mit OpenAPI 3.1 Spec. Integration mit bestehenden Tools
(z.B. Lexoffice, DATEV, GIS-Systeme) möglich. Aufwand abhängig von Komplexität.

---

**Was passiert, wenn Feldhub aufhört zu existieren?**
Vertragsklausel: Bei Betriebsaufgabe erhalten Kunden vollständigen Code-Zugang
und Daten-Export. Außerdem: Daten gehören immer dem Kunden.

---

### Vertrag & Kündigung

**Wie lange ist die Mindestlaufzeit?**
12 Monate. Danach monatliche Kündigung mit 30 Tagen Frist.

---

**Was passiert nach der Kündigung?**
- 30 Tage Übergangszeit (Daten exportieren)
- Danach: Zugang deaktiviert, Daten auf Wunsch gelöscht (DSGVO-Recht)
- Keine automatische Verlängerung, kein verstecktes Fine-Print

---

## 🔵 Teil 2: Knowledge Base für Kunden

### Nutzerverwaltung

**Wie füge ich einen neuen Mitarbeiter hinzu?**
1. Dashboard → Einstellungen → Nutzerverwaltung
2. "Neuen Nutzer einladen" klicken
3. E-Mail-Adresse + Rolle auswählen (Admin / Gruppenführer / Mitarbeiter)
4. Einladungs-Email wird automatisch gesendet
5. Mitarbeiter lädt App herunter und meldet sich an

---

**Wie setze ich Rollen und Berechtigungen?**
| Rolle | Kann | Kann nicht |
|-------|------|-----------|
| Admin | Alles | — |
| Gruppenführer | Aufträge + Protokolle + Mitarbeiter sehen | Einstellungen |
| Mitarbeiter | Eigene Aufträge + Protokolle | Andere Mitarbeiter |
| Waldbesitzer (Kunden) | Eigene Projekte + Dokumente | Interne Daten |

---

**Ein Mitarbeiter hat sein Passwort vergessen — was tun?**
1. Mitarbeiter klickt "Passwort vergessen" auf Login-Seite
2. Email mit Reset-Link kommt in 5 Minuten
3. Falls keine Email: Spam-Ordner prüfen
4. Als Admin: Dashboard → Nutzer → "Passwort zurücksetzen"

---

### App (Mobile)

**Wo lade ich die App herunter?**
- iOS: App Store → Suche nach "[App-Name]" oder direkter Link vom Dashboard
- Android: Google Play Store oder direkter APK-Link (Enterprise-Variante)

---

**Die App synchronisiert nicht — was tun?**
1. Internetverbindung prüfen (WLAN oder Mobilnetz)
2. App-Einstellungen → "Manuell synchronisieren"
3. App komplett schließen und neu starten
4. Falls Problem anhält: Support kontaktieren mit Screenshot

---

**Kann ich die App auf mehreren Geräten nutzen?**
Ja. Ein Account kann auf beliebig vielen Geräten eingeloggt sein.
Aber: Gleichzeitiges Bearbeiten desselben Protokolls ist nicht möglich
(letzter Speicherstand gewinnt).

---

### Dashboard

**Wie exportiere ich die Projektdaten?**
Dashboard → Projekte → [Projekt auswählen] → "Export" → CSV oder PDF

---

**Wie richte ich Benachrichtigungen ein?**
Dashboard → Einstellungen → Benachrichtigungen
- E-Mail-Benachrichtigungen: Wählbar pro Ereignistyp
- Push-Notifications: In App-Einstellungen aktivieren

---

**Wie erstelle ich einen Kunden-Report?**
Dashboard → Berichte → "Neuer Report"
Verfügbare Vorlagen: Projektabschluss, Monatsbericht, Abnahmeprotokoll
→ PDF-Export mit Firmenlogo

---

## 🔴 Teil 3: Interne FAQ (Feldhub Team)

### Onboarding neuer Kunden

**Wie lange dauert ein typisches Onboarding?**
Siehe Onboarding-Playbook: [ONBOARDING-PLAYBOOK.md](ONBOARDING-PLAYBOOK.md)
Richtwert: 4-8 Wochen

---

**Was ist der erste Schritt nach Vertragsabschluss?**
1. Tenant in feldhub-base konfigurieren (tenant.ts)
2. Neon DB für neuen Tenant anlegen
3. Vercel-Deployment erstellen
4. Custom Domain einrichten
5. Admin-User anlegen + Zugangsdaten an Kunden

Details: [TENANT-SETUP-CHECKLIST.md](TENANT-SETUP-CHECKLIST.md)

---

**Wie deploye ich eine neue Version?**
Über GitHub Actions CI/CD (automatisch bei Push auf `main`).
Manuell: `vercel deploy --prod` mit Vercel CLI.

---

**Wo liegen die Credentials?**
Nie im Code. Immer in:
- Vercel Environment Variables (pro Tenant)
- `/data/.openclaw/workspace/TOOLS.md` (nur für Amadeus)

---

### Support-Prozess

**Level 1 (Customer): User-Fehler, Passwort-Reset, How-To**
→ Kunde löst selbst mit Knowledge Base
→ Falls nicht: Email an support@feldhub.de

**Level 2 (Amadeus): Konfigurationsfehler, kleine Bugs**
→ Amadeus analysiert + löst, kein Vercel-Deployment nötig

**Level 3 (Entwickler): Code-Bug, Datenbankfehler**
→ GitHub Issue + Subagent-Auftrag

---

## Wissenslücken (TODO)

- [ ] Video-Tutorials erstellen (2-3 Min pro Feature)
- [ ] Help-Center auf Website einrichten (HelpScout / Crisp)
- [ ] In-App Tooltips + Onboarding-Tour
- [ ] Mehrsprachigkeit (Polnisch für KA-Mitarbeiter)

---

*Dokument erstellt im Sprint JM — Feldhub Sprint Loop*
