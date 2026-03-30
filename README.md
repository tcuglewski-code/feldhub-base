# 🚀 AppFabrik Base

**White-Label Field Service Management Template**

Ein modernes, vollständig konfigurierbares Template für Außendienst-Unternehmen — Handwerk, Bau, Reinigung, Agrar, Facility Management und mehr.

---

## ✨ Features

### Kern-Module (immer aktiv)
- **📋 Auftrags-Management** — Aufträge, Angebote, Status-Tracking
- **👥 Mitarbeiter-Verwaltung** — Teams, Rollen, Gruppen
- **📦 Lager-Verwaltung** — Artikel, Bestand, Bewegungen
- **🚗 Fuhrpark** — Fahrzeuge, Geräte, Wartungen
- **💰 Lohn & Finanzen** — Stunden, Vorschüsse, Abrechnungen
- **🧾 Rechnungen** — Automatische Rechnungserstellung, PDF-Export
- **📝 Protokolle** — Tagesprotokolle mit GPS, Fotos, Unterschrift
- **📊 Reports** — Jahresübersicht, Statistiken

### Optionale Module (aktivierbar)
- **🌱 Förderung** — Fördermittel-Beratung (Agrar/Forst)
- **✅ Abnahmen** — Qualitätskontrolle mit Mängelliste
- **🎓 Qualifikationen** — Zertifikate, Schulungsnachweise

---

## 🏁 Quickstart

### 1. Repository klonen

```bash
git clone https://github.com/your-org/appfabrik-base.git my-company-app
cd my-company-app
```

### 2. Tenant konfigurieren

Passe `src/config/tenant.ts` an:

```typescript
export const tenantConfig = {
  name: "Meine Firma GmbH",
  shortName: "MeineFirma",
  tagline: "Professioneller Service",
  
  colors: {
    primary: "#1E40AF",    // Deine Hauptfarbe
    secondary: "#F59E0B",
    background: "#F8FAFC",
  },

  modules: {
    auftraege: true,
    mitarbeiter: true,
    lager: true,
    fuhrpark: true,
    rechnungen: true,
    protokolle: true,
    kontakte: true,
    dokumente: true,
    reports: true,
    lohn: true,
    // Optionale Module
    foerderung: false,
    abnahme: false,
    qualifikationen: false,
  },

  labels: {
    auftrag: "Auftrag",
    auftraege: "Aufträge",
    // ... anpassen für deine Branche
  },

  legal: {
    companyName: "Meine Firma GmbH",
    // ...
  },
}
```

### 3. Environment konfigurieren

```bash
cp .env.example .env
# Passe DATABASE_URL, NEXTAUTH_SECRET etc. an
```

### 4. Datenbank initialisieren

```bash
npm install
npx prisma generate
npx prisma db push
```

### 5. Starten oder deployen

```bash
# Lokal entwickeln
npm run dev

# Oder: Vercel Deploy
vercel --prod
```

---

## 📐 Tech Stack

| Technologie | Version | Zweck |
|-------------|---------|-------|
| **Next.js** | 16.x | React Framework (App Router) |
| **React** | 19.x | UI Library |
| **TypeScript** | 5.x | Type Safety |
| **Prisma** | 7.x | ORM + PostgreSQL |
| **NextAuth** | 5.x | Authentication |
| **Tailwind CSS** | 4.x | Styling |
| **Lucide** | — | Icons |

---

## 🗂️ Projekt-Struktur

```
appfabrik-base/
├── src/
│   ├── app/           # Next.js App Router
│   │   ├── (dashboard)/  # Dashboard-Seiten
│   │   └── api/          # API Routes
│   ├── components/    # UI Komponenten
│   ├── config/
│   │   └── tenant.ts  # 👈 Tenant-Konfiguration
│   └── lib/           # Utilities, DB
├── prisma/
│   └── schema.prisma  # Datenbank-Schema
├── public/            # Logo, Favicon etc.
└── .env.example       # Environment Template
```

---

## 🔧 Anpassung für neue Kunden

1. **Fork** dieses Repository
2. **tenant.ts** anpassen (Name, Farben, Module)
3. **Logo** in `/public/logo.png` ersetzen
4. **Datenbank** deployen (Vercel Postgres, Neon, Supabase)
5. **Vercel** deployen

---

## 🔄 CI/CD Pipeline

Das Repository enthält GitHub Actions für automatisierte Deployments.

### Workflows

| Workflow | Trigger | Beschreibung |
|----------|---------|--------------|
| **Deploy** | Push auf `main` | Vercel Production Deployment |
| **CI** | Push/PR auf `main`, `develop` | TypeScript + Lint + Build Check |
| **DB Migration** | Manuell | Prisma Migrationen auf Neon |

### GitHub Secrets (erforderlich)

Gehe zu **Repository Settings → Secrets → Actions** und füge hinzu:

| Secret | Beschreibung | Wo finden? |
|--------|--------------|------------|
| `VERCEL_TOKEN` | Vercel API Token | [vercel.com/account/tokens](https://vercel.com/account/tokens) |
| `VERCEL_ORG_ID` | Organisation/Account ID | `.vercel/project.json` nach `vercel link` |
| `VERCEL_PROJECT_ID` | Projekt ID | `.vercel/project.json` nach `vercel link` |
| `DATABASE_URL` | Neon PostgreSQL Connection | Neon Dashboard → Connection Details |

### Setup

```bash
# 1. Vercel CLI installieren & verlinken
npm i -g vercel
vercel login
vercel link

# 2. IDs aus .vercel/project.json kopieren
cat .vercel/project.json

# 3. Vercel Token generieren
# → vercel.com/account/tokens → Create Token

# 4. Secrets in GitHub hinzufügen
# → Repository Settings → Secrets → Actions → New repository secret
```

### Manuelles DB-Migration

1. GitHub Actions → **Database Migration** → **Run workflow**
2. Wähle Migration-Modus:
   - `push` — Für Development (prisma db push)
   - `deploy` — Für Production (prisma migrate deploy)
   - `reset` — Datenbank zurücksetzen (⚠️ GEFÄHRLICH!)

---

## 📄 Lizenz

Proprietär — © 2026 AppFabrik

---

<div align="center">
  <br>
  <strong>Powered by AppFabrik 🏭</strong>
  <br>
  <sub>White-Label Field Service Management</sub>
</div>
