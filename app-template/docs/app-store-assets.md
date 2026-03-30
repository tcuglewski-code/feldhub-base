# App Store Assets Template — AppFabrik Mobile Apps

> Vorlage für alle neuen Tenants, die eine mobile App deployen.  
> Ersetze `{TENANT_NAME}` / `{APP_NAME}` mit den Tenant-spezifischen Werten.

---

## Apple App Store

### Pflicht-Assets

| Asset | Größe | Format | Hinweise |
|-------|-------|--------|---------|
| App Icon | 1024×1024 px | PNG (kein Alpha) | Keine Eckabrundung nötig, iOS macht das automatisch |
| iPhone 6.7" Screenshots | 1290×2796 px | PNG/JPG | Mindestens 3, max 10 |
| iPhone 6.5" Screenshots | 1242×2688 px | PNG/JPG | Für iPad-Compat-Anzeige |
| iPad 12.9" Screenshots | 2048×2732 px | PNG/JPG | Nur wenn iPad supported |
| Preview Video | 15–30 Sek | .mov, max 500MB | Optional, aber empfohlen |

### App Store Listing (Vorlage)

```
App Name: {APP_NAME} — {TAGLINE}
Kategorie: Business (Primary) / Productivity (Secondary)
Preis: Kostenlos (In-App Subscription oder Enterprise Login)

Untertitel (30 Zeichen):
{KURZZEICHEN} — Digital im Außendienst

Beschreibung (4000 Zeichen max):

{APP_NAME} ist die mobile Lösung für {BRANCHE} im Außendienst.

MIT DER APP KÖNNEN SIE:
• Aufträge in Echtzeit einsehen und bearbeiten
• Fotos direkt aus dem Feld hochladen
• GPS-Standort automatisch erfassen
• Tagesprotokolle digital ausfüllen
• Auch ohne Internet arbeiten (Offline-Modus)
• Stunden und Einsätze erfassen

FÜR WEN?
{APP_NAME} wurde speziell für {BRANCHE}-Unternehmen entwickelt — 
für Gruppenführer, Außendienstmitarbeiter und Teamleiter, 
die unterwegs immer den Überblick behalten müssen.

OFFLINE-FIRST:
Keine Internetverbindung? Kein Problem. Alle Änderungen werden 
lokal gespeichert und bei nächster Gelegenheit automatisch synchronisiert.

SICHER & DATENSCHUTZKONFORM:
Alle Daten werden in Deutschland gehostet, DSGVO-konform verarbeitet 
und mit Ende-zu-Ende-Verschlüsselung übertragen.

INTEGRATION:
Die App ist Teil des digitalen Betriebssystems von {FIRMENNAME} 
und synchronisiert sich mit der Web-Verwaltung in Echtzeit.

Support: support@{DOMAIN}
```

### Keywords (100 Zeichen)

```
Außendienst,Feldservice,Auftragsmanagement,Protokoll,GPS,Offline,{BRANCHE},Mitarbeiter
```

### Review Notizen (App-Review Guidelines beachten)

```
Diese App ist für interne Nutzung durch Mitarbeiter von {FIRMENNAME}.
Zum Testen: Demo-Account (demo@{DOMAIN} / Demo2026!)
Die App erfordert einen gültigen Unternehmens-Account.
```

---

## Google Play Store

### Pflicht-Assets

| Asset | Größe | Format | Hinweise |
|-------|-------|--------|---------|
| App Icon | 512×512 px | PNG (32-bit) | Mit Alpha-Kanal OK |
| Feature Graphic | 1024×500 px | PNG/JPG | Oben auf Listing-Seite angezeigt |
| Phone Screenshots | Min 1280×720 px | PNG/JPG | Mindestens 2, max 8 |
| 7" Tablet Screenshots | 1920×1200 px | PNG/JPG | Optional |
| 10" Tablet Screenshots | 1920×1200 px | PNG/JPG | Optional |
| Promo Video | YouTube URL | — | Optional |

### Play Store Listing (Vorlage)

```
App Name: {APP_NAME}
Entwickler: {FIRMENNAME} / Feldhub UG
Kategorie: Business
Inhaltsbewertung: Für alle (USK 0)
Datensicherheit: Daten werden verschlüsselt übertragen

Kurzbeschreibung (80 Zeichen):
Digitales Außendienst-Management für {BRANCHE}

Vollständige Beschreibung:
[Gleiche Texte wie App Store, ggf. leicht anpassen]
```

---

## Icon Design Guidelines

### Dos
- Klares, einfaches Symbol (erkennbar in 20×20 px)
- Unternehmensfarben verwenden (primaryColor aus tenant.ts)
- Ein dominantes Motiv (kein Text im Icon)

### Don'ts  
- Kein Screenshot-Inhalt im Icon
- Keine schwarzen oder weißen Hintergründe (schlecht sichtbar)
- Kein Komplexes Muster (unleserlich in klein)

### Farbpalette

```
primaryColor:     Aus tenant.ts übernehmen
backgroundColor:  Weiß oder Brandfarbe
accentColor:      Kontrast zu primary
```

---

## Screenshot Template (Figma Vorlage)

### Struktur jedes Screenshots:
1. **Headline** (oben, 2-3 Wörter, große Schrift, Brandfarbe)
2. **Phone Frame** (Mitte, echter Screenshot im Device-Mock)
3. **Subtext** (unten, kurze Erklärung)

### Screenshots-Plan (7 Screens):

| Nr | Headline | Screen | Fokus |
|----|----------|--------|-------|
| 1 | Immer den Überblick | Dashboard | Kernutzung |
| 2 | Aufträge in Echtzeit | Auftragsliste | Hauptfeature |
| 3 | Fotos im Feld | Foto-Upload | USP Offline |
| 4 | GPS automatisch | Einsatz-Detail | GPS |
| 5 | Protokolle digital | Protokoll-Form | Zeitersparnis |
| 6 | Auch ohne Internet | Offline-Badge | Offline-First |
| 7 | Einfache Übergabe | Tagesabschluss | Teamwork |

---

## EAS Submit — Automatisches Deployment

```bash
# Voraussetzungen
eas login
eas build --platform all --profile production

# App Store Connect (Apple)
eas submit --platform ios --latest

# Google Play (Android)
eas submit --platform android --latest
```

### Benötigte Credentials (pro Tenant)

**Apple:**
- Apple Developer Account (99 $/Jahr)
- App Store Connect API Key (in EAS secrets)
- Bundle ID: `com.{FIRMENNAME}.{APP_NAME}` (lowercase, no special chars)

**Google:**
- Google Play Developer Account (25 $ einmalig)
- Service Account JSON (in EAS secrets)
- Package Name: `com.{FIRMENNAME}.{APP_NAME}`

### EAS Secrets für neuen Tenant

```bash
eas secret:create --name APPLE_API_KEY --value "..."
eas secret:create --name GOOGLE_SERVICE_ACCOUNT --value "..."
```

---

## ASO Optimierung (App Store Optimization)

### Keyword Research-Prozess
1. Haupt-Keyword ermitteln (z.B. "Forst Management App")
2. 5-10 Long-Tail Keywords (z.B. "Außendienst App offline")
3. Wettbewerber-Keywords analysieren (AppFollow, AppFigures)
4. Keywords in Title + Subtitle + Keyword Field einbauen

### Bewertungen pushen
- Automatischer In-App Review-Prompt nach 3. erfolgreicher Nutzung
- Konfiguriert via `expo-store-review`
- Timing: Nach Auftrag abgeschlossen + positivem Ablauf

---

*Erstellt: 30.03.2026 | Sprint IR*
