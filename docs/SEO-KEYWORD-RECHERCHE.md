# SEO Keyword-Recherche — AppFabrik

> **Ziel:** Organischen Traffic für https://appfabrik.de generieren  
> **Fokus:** Mittelstand, Außendienst, Field Service Management  
> **Stand:** 30.03.2026 — Sprint IA

---

## Keyword-Cluster

### Cluster 1: Haupt-Keywords (Homepage)

| Keyword | Suchvolumen/Mo | Schwierigkeit | Prio |
|---------|---------------|---------------|------|
| field service management software | 1.200 | hoch | 🔴 |
| außendienst software | 880 | mittel | 🔴 |
| digitalisierung mittelstand software | 720 | mittel | 🔴 |
| auftragsmanagement software kmu | 590 | niedrig | 🟢 |
| mobiles auftragsmanagement | 480 | niedrig | 🟢 |
| außendienst app mitarbeiter | 390 | niedrig | 🟢 |
| field service app deutsch | 320 | niedrig | 🟢 |

*Suchvolumen: Schätzungen aus Perplexity/branchenüblichen Daten, Deutschland*

---

### Cluster 2: Branche Forstwirtschaft

| Keyword | Volumen | Schwierigkeit | URL-Ziel |
|---------|---------|---------------|----------|
| forstbetrieb software | 210 | sehr niedrig | /branchen/forstwirtschaft |
| aufforstung management software | 90 | sehr niedrig | /branchen/forstwirtschaft |
| forst app außendienst | 70 | sehr niedrig | /branchen/forstwirtschaft |
| waldpflege protokoll digital | 50 | sehr niedrig | /branchen/forstwirtschaft |
| forstunternehmer digitalisierung | 40 | sehr niedrig | /branchen/forstwirtschaft |

**Quick Win:** Diese Keywords haben kaum Konkurrenz → sofort rankbar!

---

### Cluster 3: Branche GaLaBau

| Keyword | Volumen | Schwierigkeit | URL-Ziel |
|---------|---------|---------------|----------|
| galabau software auftragsmanagement | 380 | mittel | /branchen/galabau |
| landschaftsbau app mitarbeiter | 280 | niedrig | /branchen/galabau |
| galabau disposition software | 220 | niedrig | /branchen/galabau |
| galabau digitalisierung | 190 | niedrig | /branchen/galabau |
| pflanzplanung app | 110 | sehr niedrig | /branchen/galabau |

---

### Cluster 4: Branche Reinigung

| Keyword | Volumen | Schwierigkeit | URL-Ziel |
|---------|---------|---------------|----------|
| reinigungsfirma software | 540 | mittel | /branchen/reinigung |
| reinigungsdienst app | 310 | niedrig | /branchen/reinigung |
| gebäudereinigung disposition | 240 | niedrig | /branchen/reinigung |
| reinigung auftragsmanagement | 180 | niedrig | /branchen/reinigung |
| dienstplan reinigung digital | 150 | niedrig | /branchen/reinigung |

---

### Cluster 5: Branche Tiefbau/Bau

| Keyword | Volumen | Schwierigkeit | URL-Ziel |
|---------|---------|---------------|----------|
| tiefbau software baustellenverwaltung | 420 | mittel | /branchen/tiefbau |
| kabelbau app außendienst | 160 | niedrig | /branchen/tiefbau |
| bau protokoll app | 880 | hoch | /branchen/tiefbau |
| baustellenmanagement app | 540 | mittel | /branchen/tiefbau |
| tiefbau digitalisierung | 120 | niedrig | /branchen/tiefbau |

---

### Cluster 6: Long-Tail (Blog-Content)

| Keyword | Volumen | Intent | Blog-Thema |
|---------|---------|--------|-----------|
| außendienst digitalisieren wie | 210 | informational | Leitfaden: Außendienst digitalisieren |
| excel ersetzen außendienst | 140 | commercial | Excel vs. Software im Außendienst |
| whatsapp im betrieb probleme | 320 | informational | WhatsApp in der Firma: Risiken |
| mitarbeiter app ohne internet | 90 | informational | Offline-Apps: So funktioniert's |
| saas kosten kmu | 480 | commercial | Was kostet Software wirklich? |
| kundenverwaltung außendienst | 280 | commercial | CRM für den Außendienst |
| ki software handwerk | 380 | informational | KI im Handwerk 2026 |

---

## Keyword-Priorisierungsmatrix

```
Hohe Priorität → niedrige Schwierigkeit + relevanter Intent:

1. auftragsmanagement software kmu          → Homepage + /features
2. forstbetrieb software                    → /branchen/forstwirtschaft [QUICK WIN]
3. galabau disposition software             → /branchen/galabau
4. reinigungsfirma software                 → /branchen/reinigung
5. außendienst app mitarbeiter              → Homepage
6. außendienst digitalisieren wie           → Blog (informational → Conversion)
7. excel ersetzen außendienst               → Blog (hohe Conversion-Wahrscheinlichkeit)
```

---

## Content-Plan Q2 2026

| Woche | Content | Keywords | Ziel |
|-------|---------|---------|------|
| KW 15 | Website live (MVP) | Haupt-Keywords | Index |
| KW 16 | Blog: Excel vs. Software | excel ersetzen außendienst | Traffic |
| KW 17 | Branchen: Forstwirtschaft | forstbetrieb software | Quick Win |
| KW 18 | Blog: Digitalisierung Leitfaden | außendienst digitalisieren | Traffic |
| KW 19 | Branchen: GaLaBau | galabau software | Traffic |
| KW 20 | Case Study: Koch Aufforstung | aufforstung management | Trust |
| KW 21 | Branchen: Reinigung | reinigungsfirma software | Traffic |
| KW 22 | Blog: WhatsApp in der Firma | whatsapp betrieb probleme | Traffic |
| KW 23 | Branchen: Tiefbau | tiefbau software | Traffic |
| KW 24 | Blog: KI im Handwerk 2026 | ki software handwerk | Trust |

---

## Technische SEO-Grundstruktur

### Meta-Tags (Template)

```html
<!-- Homepage -->
<title>AppFabrik | Digitales Betriebssystem für den Außendienst</title>
<meta name="description" content="Auftragsmanagement, Mobile App und Kundenverwaltung für KMU im Außendienst. Maßgeschneidert für Ihre Branche. In 2 Wochen live." />

<!-- Branchen-Seite (Beispiel Forst) -->
<title>Software für Forstbetriebe | AppFabrik</title>
<meta name="description" content="Digitale Auftragsverwaltung, Protokolle und Mitarbeiter-App für Forstbetriebe und Aufforstungsunternehmen. Offline-fähig, DSGVO-konform." />
```

### URL-Struktur

```
appfabrik.de/                           → Homepage
appfabrik.de/features/                  → Features
appfabrik.de/branchen/                  → Branchen-Übersicht
appfabrik.de/branchen/forstwirtschaft/  → Branchenseite
appfabrik.de/preise/                    → Pricing
appfabrik.de/referenzen/               → Case Studies
appfabrik.de/demo/                      → Demo-Buchung
appfabrik.de/blog/                      → Blog
appfabrik.de/blog/[slug]/               → Blog-Artikel
```

### Strukturierte Daten (Schema.org)

```json
{
  "@type": "SoftwareApplication",
  "name": "AppFabrik",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web, iOS, Android",
  "offers": {
    "@type": "Offer",
    "price": "49",
    "priceCurrency": "EUR"
  }
}
```

---

## Backlink-Strategie

### Schnelle Wins (1–3 Monate)
1. **Branchenverzeichnisse:** Einträgein Capterra, GetApp, Software Advice
2. **DFWR** (Deutscher Forstwirtschaftsrat) — Mention + Link als Tech-Partner
3. **Bundesverband GaLaBau** — Newsletter-Artikel
4. **Koch Aufforstung Website** → Link zurück zu AppFabrik
5. **PR Newswire DE** — Pressemitteilung: "FELDWERK AppFabrik launcht"

### Mittelfristig (3–6 Monate)
1. Guest Posts in Branchenzeitschriften (ForstPraxis, GaLaBau News)
2. Podcast-Auftritte: Digitalisierung Mittelstand
3. Partnership: Steuerberater/IT-Dienstleister für Handwerk

---

## KPIs Tracking

| Metrik | Ist Q1 2026 | Ziel Q2 2026 | Ziel Q4 2026 |
|--------|------------|-------------|-------------|
| Organische Sessions/Mo | 0 | 500 | 3.000 |
| Indexierte Seiten | 0 | 20 | 50 |
| Ranking-Keywords (Top 20) | 0 | 15 | 60 |
| Demo-Buchungen via SEO/Mo | 0 | 2 | 10 |
| Backlinks (DoFollow) | 0 | 5 | 20 |

---

*Erstellt: 30.03.2026 — Sprint IA*
