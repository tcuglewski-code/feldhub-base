# Differenzierungsanalyse — AppFabrik vs. Wettbewerber

> **Version:** 1.0.0  
> **Erstellt:** 2026-03-30 (Sprint HN)  
> **Research:** Perplexity sonar-pro  
> **Kontext:** DACH-Markt, B2B SaaS, KMU Außendienst

---

## 🎯 Positionierung

**AppFabrik** ist das erste vollständig white-label Field Service Management System, das speziell für KMU im DACH-Außendienst (Forst, Landschaftsbau, Handwerk, Agrar) entwickelt wurde. Es ermöglicht **Blitz-Setups in Tagen** mit **KI-gestützter Automatisierung**, Offline-First-Mobile-App und **DSGVO-konformer EU-Hosting**, bei einem **Setup-Fee + SaaS-Abo-Modell** inklusive kontinuierlicher Weiterentwicklung. So transformieren Dienstleister ihren Außendienst nahtlos in eine **branchenindividuelle Smart Factory** – ohne Vendor-Lock-in oder monatelange Implementierungen.

---

## 🏆 Top 5 Wettbewerber im DACH KMU-Markt

### 1. Fieldcode (ab ~29 €/Nutzer/Monat)
**Stärken:** Echtzeit-Disposition, Kartenfunktionen, DACH-Support  
**Schwächen:** Hohe Komplexität für kleine KMU; begrenzte Offline-Fähigkeiten für Forst/Agrar

### 2. Salesforce Field Service (ab ~50 €/Nutzer/Monat)
**Stärken:** CRM-Integration, automatisierte Planung  
**Schwächen:** Überfordernd teuer und komplex, US-zentriert, braucht IT-Team

### 3. SAP Field Service Management (ab ~40–80 €/Nutzer/Monat)
**Stärken:** End-to-End-Prozesse, Self-Service-Apps  
**Schwächen:** Stark SAP-abhängig, unflexibel für reine KMU ohne SAP-Ökosystem

### 4. mfr Field Service Management (ab ~30–60 €/Nutzer/Monat)
**Stärken:** KI-gestützte Planung, mobile App, Mittelstand-fokussiert  
**Schwächen:** Keine transparenten Preise, begrenzte Spezialisierung für Forst/Agrar

### 5. Jobber (ab 45 €/Monat pauschal)
**Stärken:** Einfache Bedienung, Rechnungsstellung vor Ort  
**Schwächen:** US-fokussiert, schwache DSGVO-Compliance, keine komplexen Forstprojekte

---

## 📊 USP-Matrix

| Kriterium | AppFabrik | Fieldcode | Salesforce | SAP | mfr | Jobber |
|-----------|-----------|-----------|------------|-----|-----|--------|
| **100% White-Label** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Setup-Zeit** | ✅ Tage | ⚠️ Wochen | ❌ Monate | ❌ Monate | ⚠️ Wochen | ⚠️ Wochen |
| **KI-Agenten integriert** | ✅ | ❌ | ⚠️ Add-on | ⚠️ Add-on | ❌ | ❌ |
| **Offline-First App** | ✅ | ✅ | ⚠️ | ⚠️ | ✅ | ✅ |
| **DSGVO / EU-Server** | ✅ Standard | ✅ | ❌ | ✅ möglich | ✅ | ❌ |
| **KMU-Preise transparent** | ✅ | ⚠️ | ❌ | ❌ | ❌ | ✅ |
| **Branche konfigurierbar** | ✅ individuell | ⚠️ allgemein | ❌ | ❌ | ✅ Handwerk | ⚠️ |
| **Zielgruppe KMU DACH** | ✅ | ⚠️ | ❌ | ❌ | ✅ | ❌ |
| **Kontinuierl. Updates im Abo** | ✅ | ⚠️ | ✅ | ✅ | ⚠️ | ✅ |

*✅ = Stärke · ⚠️ = Teilweise · ❌ = Schwach/Fehlt*

---

## 🚀 Top 5 Alleinstellungsmerkmale AppFabrik

### 1. 🏷️ 100% White-Label
Komplettes Branding inkl. App-Store-Optik — Kunden verkaufen unter eigenem Namen, ohne "Powered by"-Zwang. **Kein anderer Anbieter im KMU-Segment bietet das.**

### 2. ⚡ Setup in Tagen
Plug-and-Play-Konfiguration über `tenant.ts` statt monatelanger Implementierungsprojekte. Ein neues Unternehmen ist in 1-2 Wochen produktiv.

### 3. 🤖 KI-Agenten integriert
Automatisierung von Berichten, Förderantragsberatung, Routen-Optimierung, Dokumenten-Erstellung — out-of-the-box, nicht als teures Add-on.

### 4. 📵 Offline-First + EU DSGVO-nativ
Zuverlässig im Forst, auf dem Feld, ohne Mobilfunk. Alle Daten auf EU-Servern. Kein US-Anbieter kann das kombinieren.

### 5. 🔄 SaaS mit Lifetime-Weiterentwicklung
Kein Einmalverkauf, kein End-of-Life. Tomek/FELDWERK entwickelt kontinuierlich weiter — branchenspezifische Features inklusive. Der Kunde zahlt SaaS, bekommt Partner.

---

## 🗺️ Marktlücken die AppFabrik füllt

| Lücke | Warum niemand sie füllt | AppFabrik-Lösung |
|-------|------------------------|-----------------|
| White-Label FSM für KMU | Zu aufwändig für reine Product-Companies | `appfabrik-base` Template-System |
| Offline-Forst/Agrar Apps | Nischenmarkt, braucht Mobile-Expertise | Expo + WatermelonDB |
| KI im Außendienst (KMU) | Zu teuer / komplex für KMU-Budgets | Agenten-Architektur, bereits gebaut |
| DSGVO-nativ ohne Kompromiss | US-Anbieter strukturell benachteiligt | Neon EU + Vercel EU |
| Günstiger Einstieg <20 €/Nutzer | Enterprise-Anbieter uninteressiert | SaaS-Modell geplant |

---

## 💡 Strategische Empfehlungen

1. **Preisführerschaft durch Transparenz:** Klare Preisseite (im Gegensatz zu "auf Anfrage"-Wettbewerb)
2. **Nischenfokus als Moat:** Forst/Agrar-Features, die kein anderer baut → Lock-in durch Spezialisierung
3. **Case Study Koch Aufforstung als Beweis:** Referenz-Kunde als Social Proof
4. **White-Label als B2B2B-Kanal:** Agenturen, Verbände oder Großhändler können AppFabrik weiterverkaufen

---

*Research-Basis: Perplexity sonar-pro, März 2026. Preise sind Schätzungen/öffentliche Quellen.*
