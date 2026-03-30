# IP-Schutz-Konzept: AppFabrik

**Stand:** 30.03.2026  
**Version:** 1.1 (Sprint IK — erweitert um Marken-Strategie, IP-Register, CI License-Check)
**Verantwortlich:** AppFabrik UG (haftungsbeschränkt) [in Gründung]  
**Status:** Konzeptdokument (vor rechtlicher Prüfung)

---

## 1. Zusammenfassung

Dieses Dokument definiert die IP-Strategie (Intellectual Property) für AppFabrik-Produkte:
- **Wer besitzt den Code?** → FELDWERK UG
- **Welche Lizenzstrategie?** → Proprietär (geschlossen)
- **Wie werden Mitarbeiter/Auftragnehmer eingebunden?** → Work-for-hire + NDA

---

## 2. Work-for-Hire Klauseln

### 2.1 Definition
Work-for-Hire bedeutet: Alle Arbeitsergebnisse (Code, Designs, Dokumentation) gehören automatisch dem Auftraggeber (FELDWERK UG), nicht dem Ersteller.

### 2.2 Rechtliche Grundlage (Deutschland)
Im deutschen Urheberrecht gibt es kein automatisches Work-for-Hire. Daher muss **explizit vereinbart** werden:

> „Der Auftragnehmer überträgt sämtliche Nutzungs- und Verwertungsrechte an den im Rahmen dieses Vertrags erstellten Arbeitsergebnissen (insbesondere Quellcode, Dokumentation, Designs) ausschließlich und unwiderruflich auf den Auftraggeber. Dies umfasst alle bekannten und unbekannten Nutzungsarten, zeitlich und räumlich unbeschränkt."

### 2.3 Pflichtklauseln für Verträge

#### Für Freelancer/Auftragnehmer:
```
§ X Rechteübertragung

(1) Der Auftragnehmer überträgt dem Auftraggeber sämtliche 
    urheberrechtlichen Nutzungsrechte an allen Arbeitsergebnissen, 
    die im Rahmen dieses Vertrags entstehen.

(2) Die Übertragung umfasst:
    - alle bekannten und unbekannten Nutzungsarten
    - zeitlich unbeschränkt
    - räumlich unbeschränkt (weltweit)
    - das Recht zur Bearbeitung, Weiterentwicklung und Unterlizenzierung

(3) Der Auftragnehmer verzichtet auf sein Namensnennungsrecht 
    gemäß § 13 UrhG, soweit rechtlich zulässig.

(4) Die Vergütung gemäß § X deckt die Rechteübertragung vollständig ab.
```

#### Für Angestellte:
```
§ X Arbeitsergebnisse

(1) Alle Arbeitsergebnisse, die der Arbeitnehmer im Rahmen seiner 
    Tätigkeit erstellt, gehen mit Entstehung in das Eigentum des 
    Arbeitgebers über.

(2) Dies gilt insbesondere für Software, Dokumentation, Konzepte, 
    Designs und technische Lösungen.

(3) Der Arbeitnehmer hat keinen Anspruch auf gesonderte Vergütung 
    für die Rechteübertragung über sein Gehalt hinaus.
```

### 2.4 KI-Agenten (Sonderfall)
KI-generierter Code (z.B. durch Claude/Amadeus) ist in Deutschland derzeit nicht urheberrechtlich geschützt (fehlendes menschliches Schöpfungselement). Empfehlung:
- KI-Code als Arbeitshilfe, nicht als eigenständiges Werk betrachten
- Human-Review-Prozess für alle KI-Beiträge
- Dokumentation der menschlichen Überprüfung/Anpassung

---

## 3. Lizenz-Strategie

### 3.1 Entscheidung: Proprietär (Closed Source)

**AppFabrik-Code ist proprietär und wird nicht Open Source veröffentlicht.**

#### Begründung:
| Faktor | Proprietär ✅ | Open Source ❌ |
|--------|---------------|----------------|
| Wettbewerbsvorteil | Geschützt | Kopierbar |
| SaaS-Modell | Passt perfekt | Schwierig zu monetarisieren |
| Kunden-Vertrauen | "Exklusiv" | "Kann jeder nutzen" |
| Branchen-Expertise | Kern-IP bleibt geschützt | Kompetenz öffentlich |
| Support-Modell | Kontrolle | Community-Abhängigkeit |

### 3.2 Ausnahmen (potentiell Open Source)

Folgende Komponenten könnten später Open Source werden (Marketing/Community):
- Utility-Libraries ohne Business-Logik
- Generische UI-Komponenten
- Dokumentations-Templates
- Nicht-kritische Tools

**Regel:** Vor jeder Open-Source-Veröffentlichung schriftliche Freigabe durch Tomek.

### 3.3 Lizenztypen im Überblick

| Lizenz | Nutzung bei AppFabrik |
|--------|----------------------|
| MIT/Apache 2.0 | Für externe Tools, nicht für Kern-Produkt |
| Proprietär | Alle AppFabrik-Produkte |
| AGPL | Nicht nutzen (Copyleft-Risiko für SaaS) |
| Creative Commons | Für Dokumentation/Content möglich |

### 3.4 Third-Party-Lizenzen

Alle Abhängigkeiten (node_modules, etc.) müssen lizenzkompatibel sein:
- ✅ MIT, Apache 2.0, BSD → Erlaubt
- ⚠️ LGPL → Mit Vorsicht (Linking-Klauseln beachten)
- ❌ GPL, AGPL → Nicht verwenden (Copyleft-Infektion)

**Empfehlung:** `license-checker` NPM-Paket in CI/CD integrieren.

---

## 4. NDA-Template (Geheimhaltungsvereinbarung)

### 4.1 Einsatzbereich
- Alle Mitarbeiter (vor Arbeitsantritt)
- Alle Freelancer/Auftragnehmer (vor Projektzugang)
- Partner/Dienstleister mit Code-Zugang
- Beta-Tester mit frühem Zugang

### 4.2 NDA-Template

```
GEHEIMHALTUNGSVEREINBARUNG (NDA)

zwischen

FELDWERK UG (haftungsbeschränkt)
[Adresse]
- nachfolgend „Offenbarende Partei" -

und

[Name/Firma]
[Adresse]
- nachfolgend „Empfangende Partei" -

§ 1 Gegenstand

(1) Die Empfangende Partei erhält Zugang zu vertraulichen 
    Informationen der Offenbarenden Partei, insbesondere:
    - Quellcode und technische Dokumentation
    - Geschäftsstrategien und Kundendaten
    - Preismodelle und Kalkulationen
    - Unveröffentlichte Produkte und Features

(2) Als vertraulich gelten alle Informationen, die:
    - als „vertraulich" gekennzeichnet sind
    - ihrer Natur nach vertraulich sind
    - im Rahmen der Zusammenarbeit zugänglich werden

§ 2 Pflichten der Empfangenden Partei

(1) Die Empfangende Partei verpflichtet sich:
    a) Vertrauliche Informationen streng geheim zu halten
    b) Diese nur für den vereinbarten Zweck zu nutzen
    c) Keinen Dritten Zugang zu gewähren
    d) Angemessene Schutzmaßnahmen zu ergreifen

(2) Ausgenommen sind Informationen, die:
    a) Öffentlich bekannt sind (ohne Verschulden der Empfangenden Partei)
    b) Der Empfangenden Partei bereits bekannt waren
    c) Von Dritten rechtmäßig offenbart wurden
    d) Aufgrund gesetzlicher Verpflichtung offengelegt werden müssen

§ 3 Rückgabe und Löschung

Nach Beendigung der Zusammenarbeit sind alle vertraulichen 
Informationen innerhalb von 14 Tagen:
- zurückzugeben oder
- unwiderruflich zu löschen

Auf Verlangen ist die Löschung schriftlich zu bestätigen.

§ 4 Vertragsstrafe

Bei schuldhafter Verletzung dieser Vereinbarung ist eine 
Vertragsstrafe von [10.000 - 50.000] EUR pro Verstoß zu zahlen.
Weitergehende Schadensersatzansprüche bleiben unberührt.

§ 5 Laufzeit

Diese Vereinbarung gilt ab Unterzeichnung und endet:
- [ ] Mit Beendigung der Zusammenarbeit
- [x] 3 Jahre nach Beendigung der Zusammenarbeit
- [ ] Unbefristet

§ 6 Schlussbestimmungen

(1) Änderungen bedürfen der Schriftform.
(2) Sollten einzelne Bestimmungen unwirksam sein, 
    bleibt die Vereinbarung im Übrigen wirksam.
(3) Es gilt deutsches Recht. Gerichtsstand ist [Stadt].


_______________________          _______________________
Ort, Datum                       Ort, Datum

_______________________          _______________________
FELDWERK UG                      Empfangende Partei
```

---

## 5. Umsetzungs-Checkliste

### 5.1 Sofort umsetzen
- [ ] NDA-Template finalisieren (Anwalt prüfen lassen)
- [ ] Work-for-hire Klauseln in Freelancer-Verträge aufnehmen
- [ ] Arbeitsverträge um IP-Klausel ergänzen (für zukünftige Anstellungen)
- [ ] `license-checker` in CI/CD integrieren

### 5.2 Mittelfristig
- [ ] IP-Register anlegen (welcher Code gehört wem, wann erstellt)
- [ ] Markenanmeldung „AppFabrik" prüfen (DPMA)
- [ ] Code-Signing für Releases einrichten

### 5.3 Rechtliche Prüfung
**Empfehlung:** Dieses Dokument und die Templates von einem Fachanwalt für IT-Recht prüfen lassen, bevor sie in Verträgen verwendet werden.

---

## 6. Zusammenfassung der Regeln

| Bereich | Regel |
|---------|-------|
| Code-Eigentum | FELDWERK UG besitzt 100% |
| Lizenz | Proprietär (Closed Source) |
| Freelancer | Work-for-hire Klausel + NDA zwingend |
| Angestellte | IP-Klausel im Arbeitsvertrag + NDA |
| KI-Code | Human-Review dokumentieren |
| Third-Party | MIT/Apache OK, GPL/AGPL verboten |
| Open Source | Nur nach expliziter Freigabe |

---

---

## 7. Marken-Strategie (Trademark)

### 7.1 Schutzwürdige Zeichen

| Zeichen | Typ | Priorität | Status |
|---------|-----|-----------|--------|
| "AppFabrik" | Wortmarke | 🔴 Hoch | Prüfung ausstehend |
| AppFabrik Logo | Bildmarke | 🟡 Mittel | Logo noch in Entwicklung (Sprint IG) |
| "ForstManager" | Wortmarke | 🟡 Mittel | Prüfung ausstehend |

### 7.2 Markenanmeldung DPMA

**Schritte:**
1. Ähnlichkeitsrecherche im DPMA-Register (dpma.de) — kostenfrei
2. Klassen-Auswahl:
   - **Klasse 42:** Software-as-a-Service, IT-Dienstleistungen
   - **Klasse 35:** Unternehmensberatung, Geschäftsführung
3. Anmeldung beim DPMA: ca. 300 € für 1 Klasse
4. Schutzumfang: Deutschland; EU-Marke (EUIPO) für europäischen Schutz empfohlen

**Wichtig:** Markenanmeldung erst nach Firmenname-Entscheidung! → Wartet auf Tomek.

### 7.3 Domain-Schutz

| Domain | Status | Priorität |
|--------|--------|-----------|
| appfabrik.de | Prüfen/registrieren | 🔴 Hoch |
| appfabrik.com | Prüfen/registrieren | 🔴 Hoch |
| appfabrik.io | Optional | 🟡 Mittel |
| feldwerk.de | Prüfen | 🟡 Mittel |

---

## 8. IP-Register

Ein zentrales IP-Register dokumentiert alle geistigen Eigentumsrechte:

### 8.1 Code-Assets

| Repository | Erstellt | Eigentümer | Lizenz | Beschreibung |
|-----------|---------|-----------|-------|-------------|
| appfabrik-base | 2026 | AppFabrik UG | Proprietär | Core-Plattform Template |
| appfabrik-app-base | 2026 | AppFabrik UG | Proprietär | Mobile App Template |
| ka-app | 2025-2026 | AppFabrik UG | Proprietär | Koch Aufforstung App |
| ka-forstmanager | 2025-2026 | AppFabrik UG | Proprietär | ForstManager Web-App |
| mission-control | 2026 | AppFabrik UG | Proprietär | Internes Projektmanagement |

### 8.2 Content-Assets

| Asset | Erstellt | Eigentümer | Status |
|-------|---------|-----------|--------|
| AppFabrik Logo (in Entwicklung) | 2026 | AppFabrik UG | In Bearbeitung (Sprint IG) |
| Brand Guidelines | 2026 | AppFabrik UG | In Bearbeitung |
| Case Study Koch Aufforstung | 2026 | AppFabrik UG | Fertig |
| Pitch Deck | 2026 | AppFabrik UG | Fertig |

---

## 9. License-Checker CI/CD Integration

### 9.1 Konfiguration (`.github/workflows/license-check.yml`)

```yaml
name: License Check
on: [push, pull_request]

jobs:
  license-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npx license-checker --production --failOn "GPL;AGPL;LGPL" --csv > license-report.csv
      - uses: actions/upload-artifact@v4
        with:
          name: license-report
          path: license-report.csv
```

### 9.2 Erlaubte Lizenzen (Whitelist)

```
MIT, ISC, BSD-2-Clause, BSD-3-Clause, Apache-2.0, CC0-1.0, Unlicense, Python-2.0
```

### 9.3 Verbotene Lizenzen (Faillist)

```
GPL-2.0, GPL-3.0, AGPL-3.0, LGPL-2.0, LGPL-2.1, LGPL-3.0
```

---

**Dokumentenhistorie:**
| Datum | Version | Änderung |
|-------|---------|----------|
| 29.03.2026 | 1.0 | Erstversion |
| 30.03.2026 | 1.1 | Marken-Strategie, IP-Register, License-Checker CI ergänzt (Sprint IK) |
