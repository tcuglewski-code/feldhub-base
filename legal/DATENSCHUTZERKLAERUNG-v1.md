# Datenschutzerklärung
## AppFabrik — SaaS-Plattform für KMU im Außendienst

**Version:** 1.0  
**Stand:** März 2026  
**Verantwortlicher:** AppFabrik UG (haftungsbeschränkt) [in Gründung], [Adresse nach Gründung]  
**Kontakt:** [datenschutz@appfabrik.de — nach Gründung einrichten]

> ⚠️ **Template-Hinweis:** Platzhalter in [ECKIGEN KLAMMERN] vor Veröffentlichung ausfüllen. Anwaltliche Prüfung empfohlen.

---

## 1. Verantwortlicher

Verantwortlicher für die Verarbeitung personenbezogener Daten im Sinne der Datenschutz-Grundverordnung (DSGVO) ist:

**AppFabrik UG (haftungsbeschränkt)**  
[Straße, Hausnummer]  
[PLZ, Stadt]  
Deutschland  

E-Mail: [datenschutz@appfabrik.de]  
Web: [https://appfabrik.de]

---

## 2. Datenschutzbeauftragter

Eine Pflicht zur Benennung eines Datenschutzbeauftragten besteht nach Art. 37 DSGVO derzeit nicht [prüfen bei > 20 Personen, die regelmäßig Daten verarbeiten]. Bei datenschutzrechtlichen Fragen wenden Sie sich an: [datenschutz@appfabrik.de]

---

## 3. Allgemeines zur Datenverarbeitung

### 3.1 Grundsätze

Wir verarbeiten personenbezogene Daten unserer Nutzer und Kunden grundsätzlich nur, soweit dies zur Bereitstellung einer funktionierenden Website und unserer Inhalte und Leistungen erforderlich ist. Die Verarbeitung personenbezogener Daten unserer Nutzer erfolgt regelmäßig nur nach Einwilligung des Nutzers oder wenn die Verarbeitung durch gesetzliche Vorschriften gestattet ist.

### 3.2 Rechtsgrundlagen

Wir verarbeiten personenbezogene Daten auf Basis folgender Rechtsgrundlagen:
- **Art. 6 Abs. 1 lit. a DSGVO** — Einwilligung
- **Art. 6 Abs. 1 lit. b DSGVO** — Vertragserfüllung
- **Art. 6 Abs. 1 lit. c DSGVO** — Rechtliche Verpflichtung
- **Art. 6 Abs. 1 lit. f DSGVO** — Berechtigte Interessen

---

## 4. Website-Betrieb

### 4.1 Server-Logfiles

Beim Besuch unserer Website werden automatisch Informationen erhoben, die Ihr Browser übermittelt:

- IP-Adresse (anonymisiert)
- Datum und Uhrzeit des Zugriffs
- Aufgerufene URL
- Referrer-URL
- Browser-Typ und -Version
- Betriebssystem

**Zweck:** Sicherstellung des Betriebs, Fehlerbehebung, Sicherheitsanalyse  
**Rechtsgrundlage:** Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse)  
**Speicherdauer:** 7 Tage, dann automatische Löschung

### 4.2 Kontaktformular

Wenn Sie uns über das Kontaktformular kontaktieren, speichern wir:
- Name, E-Mail-Adresse
- Nachricht / Betreff
- Zeitpunkt der Anfrage
- Optional: Unternehmen, Telefon

**Zweck:** Bearbeitung Ihrer Anfrage  
**Rechtsgrundlage:** Art. 6 Abs. 1 lit. b DSGVO (vorvertragliche Maßnahmen)  
**Speicherdauer:** Bis zur Erledigung der Anfrage, max. 3 Jahre nach letztem Kontakt

### 4.3 Cookies

Unsere Website verwendet folgende Cookies:

| Cookie | Typ | Zweck | Laufzeit |
|--------|-----|-------|---------|
| Session Cookie | Notwendig | Login-Session | Sitzungsende |
| CSRF-Token | Notwendig | Sicherheit | Sitzungsende |
| [Analytics-Cookie] | Optional (Opt-in) | Nutzungsstatistik | 1 Jahr |

Technisch notwendige Cookies werden ohne Einwilligung gesetzt (Art. 6 Abs. 1 lit. f DSGVO).  
Für optionale Cookies holen wir Ihre Einwilligung ein (Art. 6 Abs. 1 lit. a DSGVO).

---

## 5. SaaS-Plattform (Kundendaten)

### 5.1 Rolle der AppFabrik

Im Rahmen der SaaS-Nutzung durch unsere Unternehmenskunden (Tenants) ist AppFabrik in der Regel **Auftragsverarbeiter** gemäß Art. 28 DSGVO. Der Kunde (Tenant) ist der **Verantwortliche** für die von ihm in die Plattform eingebrachten Daten.

Für die Verarbeitung dieser Daten gilt der separate Auftragsverarbeitungsvertrag (AVV).

### 5.2 Verarbeitete Daten im SaaS-Betrieb

Im Rahmen des SaaS-Betriebs werden folgende Datenkategorien verarbeitet:

| Datenkategorie | Betroffene | Zweck |
|---------------|-----------|-------|
| Nutzerkonto-Daten | Mitarbeiter des Kunden | Login, Zugriffsverwaltung |
| Betriebsdaten | Mitarbeiter, Endkunden | Auftrags-/Projektverwaltung |
| GPS/Standort | Außendienstmitarbeiter | Einsatzplanung, Protokollierung |
| Fotos/Dokumente | Beliebige Personen | Projektdokumentation |
| Metadaten | Alle Nutzer | System-Logs, Performance |

### 5.3 Datenstandort

Alle Kundendaten werden auf Servern innerhalb der EU oder in Ländern mit angemessenem Datenschutzniveau gespeichert (Neon PostgreSQL: USA mit EU-US DPF + SCCs; Vercel: USA mit EU-US DPF + SCCs).

---

## 6. Account-Registrierung und Login

Beim Anlegen eines Kontos verarbeiten wir:
- E-Mail-Adresse (Pflichtfeld)
- Name (Pflichtfeld)
- Passwort (gespeichert als bcrypt-Hash — niemals im Klartext)
- Unternehmen und Rolle
- Registrierungsdatum

**Rechtsgrundlage:** Art. 6 Abs. 1 lit. b DSGVO  
**Speicherdauer:** Dauer der Kontonutzung + 30 Tage nach Löschung (Kulanzfrist)

---

## 7. Subauftragsverarbeiter (externe Dienstleister)

AppFabrik setzt folgende externe Dienstleister ein, die als Subauftragsverarbeiter agieren:

| Dienstleister | Leistung | Sitz | Datenschutzbasis |
|--------------|---------|------|-----------------|
| Vercel Inc. | Web-Hosting, CDN, Deployment | San Francisco, USA | EU-US DPF, SCCs |
| Neon Inc. | PostgreSQL Datenbank | USA | EU-US DPF, SCCs |
| Expo / Expo Inc. | Mobile App Build & Distribution | USA | EU-US DPF, SCCs |
| [E-Mail-Anbieter] | Transaktions-E-Mails | [Sitz] | [Basis] |

---

## 8. Ihre Rechte als betroffene Person

Als betroffene Person haben Sie folgende Rechte:

### 8.1 Auskunftsrecht (Art. 15 DSGVO)
Sie haben das Recht, Auskunft über die von uns verarbeiteten personenbezogenen Daten zu erhalten.

### 8.2 Recht auf Berichtigung (Art. 16 DSGVO)
Sie haben das Recht, unrichtige Daten berichtigen zu lassen.

### 8.3 Recht auf Löschung (Art. 17 DSGVO)
Sie haben das Recht, unter bestimmten Voraussetzungen die Löschung Ihrer Daten zu verlangen ("Recht auf Vergessenwerden").

### 8.4 Recht auf Einschränkung der Verarbeitung (Art. 18 DSGVO)
Sie haben das Recht, die Einschränkung der Verarbeitung zu verlangen.

### 8.5 Recht auf Datenübertragbarkeit (Art. 20 DSGVO)
Sie haben das Recht, Ihre Daten in einem maschinenlesbaren Format zu erhalten (JSON oder CSV).

### 8.6 Widerspruchsrecht (Art. 21 DSGVO)
Sie haben das Recht, der Verarbeitung Ihrer Daten zu widersprechen, soweit diese auf berechtigten Interessen beruht.

### 8.7 Recht auf Widerruf einer Einwilligung (Art. 7 Abs. 3 DSGVO)
Erteilte Einwilligungen können Sie jederzeit widerrufen. Die Rechtmäßigkeit der bis zum Widerruf erfolgten Verarbeitung bleibt unberührt.

### 8.8 Beschwerderecht (Art. 77 DSGVO)
Sie haben das Recht, sich bei einer Aufsichtsbehörde zu beschweren. Die für AppFabrik zuständige Aufsichtsbehörde ist: [zuständige Datenschutzbehörde nach Gründungsort]

---

## 9. Datensicherheit

Wir setzen technische und organisatorische Sicherheitsmaßnahmen (TOM) ein, um Ihre Daten zu schützen:

- **Verschlüsselung in Transit:** TLS 1.3 für alle Verbindungen
- **Verschlüsselung at Rest:** Datenbankfelder für sensible Daten (bcrypt für Passwörter)
- **Zugriffskontrolle:** Rollenbasiertes System (RBAC), Prinzip der minimalen Rechtevergabe
- **Monitoring:** Sicherheitsrelevante Ereignisse werden geloggt und überwacht
- **Backups:** Tägliche automatisierte Backups, 30 Tage Aufbewahrung
- **Updates:** Regelmäßige Sicherheits-Updates für alle Abhängigkeiten

---

## 10. Aufbewahrungsfristen

| Datentyp | Aufbewahrung | Grundlage |
|---------|-------------|----------|
| Rechnungen und Buchhaltung | 10 Jahre | § 147 AO (Steuerrecht) |
| Verträge | 6 Jahre nach Vertragsende | § 195 ff. BGB |
| Support-Tickets | 2 Jahre nach Schließung | Berechtigtes Interesse |
| Server-Logs | 7 Tage | Berechtigtes Interesse |
| Nutzerkonten | Dauer der Nutzung + 30 Tage | Vertragserfüllung |
| Bewerbungen | 6 Monate nach Ablehnung | AGG |

---

## 11. Änderungen dieser Datenschutzerklärung

Wir behalten uns vor, diese Datenschutzerklärung bei Bedarf anzupassen. Die aktuelle Version ist stets auf unserer Website einsehbar. Bei wesentlichen Änderungen informieren wir registrierte Kunden per E-Mail.

---

## 12. Kontakt bei Datenschutzfragen

Bei Fragen zur Datenverarbeitung oder zur Ausübung Ihrer Rechte:

**AppFabrik UG (haftungsbeschränkt)**  
E-Mail: [datenschutz@appfabrik.de]  
Betreff: Datenschutz-Anfrage

Wir bearbeiten Ihre Anfrage innerhalb von 30 Tagen (Frist gemäß Art. 12 Abs. 3 DSGVO).

---

*Stand: März 2026 — AppFabrik UG (haftungsbeschränkt) [in Gründung]*  
*Anwaltliche Prüfung vor Veröffentlichung erforderlich*
