# AppFabrik Website — Konzept & Sitemap

> **Domain (geplant):** https://appfabrik.de  
> **Technik:** Next.js 15 + Tailwind CSS v4 + Vercel  
> **Ziel:** Lead-Generierung, Vertrauen aufbauen, Demo-Buchungen  
> **Stand:** 30.03.2026 — Sprint HZ

---

## Ziele der Website

1. **Primär:** Demo-Buchungen generieren (CTA: "Kostenlose Demo anfragen")
2. **Sekundär:** Vertrauen aufbauen (Case Study, Referenzen, Team)
3. **Langfristig:** Organischer Traffic über SEO (Digitalisierung Außendienst, FSM Software)

---

## Zielgruppen

| Gruppe | Suchintention | Wichtigste Seite |
|--------|--------------|-----------------|
| Inhaber Forstbetrieb | "Software Forstbetrieb", "Auftragsmanagement Forst" | Branchenseite Forstwirtschaft |
| GaLaBau-Betriebsleiter | "Außendienst Software GaLaBau" | Branchenseite GaLaBau |
| Disponent Reinigungsfirma | "Reinigungsfirma Disposition App" | Branchenseite Reinigung |
| Startup-Evaluierer | "Field Service Management SaaS" | Homepage + Pricing |
| Empfehlung/Bekannt | Direktaufruf | Case Study Koch Aufforstung |

---

## Sitemap

```
appfabrik.de/
│
├── / (Homepage)
│   ├── Hero: "Ihr digitales Betriebssystem für den Außendienst"
│   ├── Problem/Solution Block
│   ├── Feature-Highlights (6 Icons)
│   ├── Branchen-Auswahl (5 Kacheln)
│   ├── Case Study Teaser (Koch Aufforstung)
│   ├── Pricing Preview
│   └── CTA: Demo anfragen
│
├── /features (Alle Features)
│   ├── Auftragsverwaltung
│   ├── Mobile App (Offline-First)
│   ├── Kunden-Portal
│   ├── Zeiterfassung & GPS
│   ├── Rechnungsstellung
│   └── White-Label & Branding
│
├── /branchen (Branchen-Übersicht)
│   ├── /branchen/forstwirtschaft
│   ├── /branchen/galabau
│   ├── /branchen/reinigung
│   ├── /branchen/tiefbau
│   └── /branchen/handwerk
│
├── /preise (Pricing)
│   ├── Basic (€49/Mo)
│   ├── Professional (€149/Mo) [Empfohlen]
│   ├── Enterprise (auf Anfrage)
│   └── FAQ zu Preisen
│
├── /referenzen (Case Studies)
│   ├── /referenzen/koch-aufforstung [VORHANDEN]
│   └── /referenzen/ (weitere folgen)
│
├── /demo (Demo anfragen)
│   ├── Calendly-Buchungsformular
│   ├── Sofort-Demo-Link: demo.appfabrik.de
│   └── Was Sie erwartet (3 Punkte)
│
├── /blog (Content Marketing)
│   ├── Digitalisierung im Außendienst
│   ├── KI-Agenten in der Softwareentwicklung
│   └── [weitere Posts geplant]
│
├── /ueber-uns (Team/Mission)
│   ├── Mission: "Digitale Betriebssysteme für den Mittelstand"
│   ├── Gründer: Tomek + Amadeus (AI)
│   └── Kontakt
│
├── /legal
│   ├── /legal/impressum
│   ├── /legal/datenschutz
│   ├── /legal/agb
│   └── /legal/sla
│
└── /api (Technisch)
    ├── /api/contact (Kontaktformular → CRM)
    ├── /api/demo-request (Demo-Buchung → MC)
    └── /api/newsletter (E-Mail Signup)
```

---

## Homepage — Wireframe-Beschreibung

### Section 1: Hero (Above the Fold)
```
[LOGO AppFabrik]                           [Features] [Preise] [Branchen] [Demo anfragen →]

────────────────────────────────────────────────────────────
 Headline: "Das digitale Betriebssystem für Ihren Außendienst"
 Subline:  "Aufträge, Mitarbeiter, Kunden — alles in einer Plattform.
            Maßgeschneidert für Ihre Branche. In 2 Wochen live."

                [🎥 Kostenlose Demo anfragen]    [▶ Demo ansehen (2 Min)]

 [Screenshot/Video der App — Mobile + Desktop]
────────────────────────────────────────────────────────────
```

### Section 2: Social Proof
```
"Bereits genutzt von:"
[Koch Aufforstung Logo]  [weitere Kunden...]
★★★★★ "In 3 Wochen live. Spart uns 10h/Woche." — Georg Koch, Koch Aufforstung GmbH
```

### Section 3: Problem/Solution
```
❌ VORHER                     ✅ NACHHER
Excel + WhatsApp Chaos   →   Zentrale Auftragsverwaltung
Papier-Protokolle        →   Digital, Offline-fähig
Kein Kunden-Überblick    →   Echtzeit-Tracking für alle
```

### Section 4: Features (6 Kacheln)
```
📋 Aufträge    📱 Mobile App    👥 Mitarbeiter
🧾 Rechnungen  📍 GPS-Tracking  🎨 White-Label
```

### Section 5: Branchen
```
🌲 Forstwirtschaft  🌿 GaLaBau  🧹 Reinigung  🏗️ Tiefbau  🔧 Handwerk
```

### Section 6: Case Study Teaser
```
📊 Koch Aufforstung: "10h/Woche eingespart in 3 Wochen"
[Jetzt Case Study lesen →]
```

### Section 7: Pricing Preview
```
Basic €49/Mo  |  Professional €149/Mo ⭐  |  Enterprise auf Anfrage
[Alle Preise →]
```

### Section 8: CTA
```
"Bereit für Ihr digitales Betriebssystem?"
[Kostenlose Demo anfragen →]
```

---

## Branchen-Seiten (Template)

Jede Branchenseite folgt diesem Template:
1. **Hero:** "AppFabrik für [Branche]" + branchenspezifischer Screenshot
2. **Pain Points:** 3 typische Probleme der Branche
3. **Solution:** Wie AppFabrik hilft
4. **Features:** Branchenspezifische Module hervorheben
5. **Case Study:** Wenn vorhanden
6. **CTA:** Demo anfragen

---

## SEO-Strategie

### Haupt-Keywords (Homepage)
- "Field Service Management Software Deutschland"
- "Außendienst Software KMU"
- "Digitalisierung Handwerksbetrieb"

### Long-Tail-Keywords (Branchen-Seiten)
- "Software Forstbetrieb Auftragsmanagement"
- "GaLaBau Disposition App"
- "Reinigungsfirma Software Mitarbeiter"

### Content-Plan
- 1 Blog-Post / 2 Wochen
- Fokus: Digitalisierung, Praxistipps, Branchenthemen
- Guest Posts in Branchenverbands-Newslettern

---

## Tech-Stack Website

```
Framework:    Next.js 15 (App Router)
Styling:      Tailwind CSS v4 + shadcn/ui
CMS:          MDX für Blog (einfach, kein CMS nötig)
Hosting:      Vercel (Auto-Deploy via GitHub)
Analytics:    Plausible Analytics (DSGVO-konform)
Kontakt:      Formspree oder eigene API Route
Calendly:     Demo-Buchungen
```

---

## Roadmap Website

| Phase | Timeline | Tasks |
|-------|----------|-------|
| Phase 1: MVP | April 2026 | Homepage, Features, Preise, Demo-Seite |
| Phase 2: Content | Mai 2026 | 5 Branchen-Seiten, Case Study Koch Aufforstung |
| Phase 3: SEO | Juni 2026 | Blog, Keyword-Optimierung, Backlinks |
| Phase 4: Conversion | Q3 2026 | A/B Tests, Lead-Capture, Chatbot |

---

*Erstellt: 30.03.2026 — Sprint HZ*
