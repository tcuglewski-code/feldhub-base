# 🛠️ AppFabrik Base — Developer Documentation

**Version:** 2.0.0  
**Stand:** März 2026

Vollständige Entwickler-Dokumentation für das AppFabrik Base Template — White-Label Field Service Management für KMU im Außendienst.

---

## 📚 Inhaltsverzeichnis

1. [Architektur-Übersicht](#-architektur-übersicht)
2. [Quick-Start](#-quick-start)
3. [Environment-Variablen](#️-environment-variablen)
4. [Tenant-Konfiguration](#-tenant-konfiguration)
5. [Verzeichnisstruktur](#-verzeichnisstruktur)
6. [Deployment](#-deployment)
7. [Testing](#-testing)
8. [API & Konventionen](#-api--konventionen)
9. [Mobile App](#-mobile-app)
10. [Troubleshooting](#-troubleshooting)

---

## 🏗️ Architektur-Übersicht

### Tech Stack

| Komponente | Technologie | Version |
|------------|-------------|---------|
| **Framework** | Next.js (App Router) | 15.x |
| **Sprache** | TypeScript | 5.x |
| **Styling** | Tailwind CSS | 3.x |
| **UI Components** | shadcn/ui | Latest |
| **Icons** | Lucide React | 0.450+ |
| **Datenbank** | PostgreSQL (Neon) | 16 |
| **ORM** | Prisma | 6.x |
| **Auth** | NextAuth.js | 5.x |
| **Validation** | Zod | 3.x |
| **State** | React Query (TanStack) | 5.x |
| **Forms** | React Hook Form | 7.x |
| **Testing** | Jest + Playwright | Latest |
| **Hosting** | Vercel | — |

### System-Architektur

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│  Next.js App Router + React Server Components               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  Dashboard  │  │   Modules   │  │   Portal    │         │
│  │   Layout    │  │  (Aufträge, │  │   (Kunden-  │         │
│  │             │  │   Lager,..) │  │   bereich)  │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└───────────────────────────┬─────────────────────────────────┘
                            │ API Routes
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                         BACKEND                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                    API Routes                        │   │
│  │  /api/auftraege  /api/mitarbeiter  /api/rechnungen  │   │
│  │  /api/lager      /api/fuhrpark     /api/protokolle  │   │
│  │  /api/auth       /api/cron         /api/foerderung  │   │
│  └─────────────────────────────────────────────────────┘   │
│                            │                                 │
│  ┌─────────────────────────┼─────────────────────────────┐ │
│  │                    PRISMA ORM                          │ │
│  │  Models: User, Auftrag, Mitarbeiter, Kontakt, etc.    │ │
│  └─────────────────────────┼─────────────────────────────┘ │
└────────────────────────────┼────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                    POSTGRESQL (Neon)                         │
│  Multi-Tenant via tenantId auf allen Models                 │
│  pgvector Extension für Embeddings (optional)               │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   EXTERNE SERVICES                           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │ Nextcloud│  │ WordPress│  │ Perplexity│  │   SMTP   │    │
│  │ (Dateien)│  │  (CMS)   │  │  (KI-RAG) │  │  (Email) │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### Multi-Tenant-Architektur

AppFabrik Base nutzt ein **Shared-Database Multi-Tenant** Modell:

- **Eine Datenbank** pro Deployment
- **tenantId** als Pflichtfeld auf allen Business-Models
- **Mandanten-Isolation** via Prisma Query-Middleware
- **Tenant-Konfiguration** in `src/config/tenants/[name].ts`

```typescript
// Jede DB-Query wird automatisch nach tenantId gefiltert
const auftraege = await prisma.auftrag.findMany({
  where: { tenantId: session.tenantId, status: 'offen' }
});
```

---

## 🚀 Quick-Start

### Voraussetzungen

- **Node.js** 20+ (LTS)
- **npm** 10+ oder **pnpm** 9+
- **PostgreSQL** Zugang (Neon empfohlen)
- **Git** 2.40+

### 1. Repository klonen

```bash
# Für neuen Kunden: Fork erstellen
git clone https://github.com/tcuglewski-code/appfabrik-base.git mein-kunde-app
cd mein-kunde-app
```

### 2. Dependencies installieren

```bash
npm install
# oder
pnpm install
```

### 3. Environment konfigurieren

```bash
cp .env.example .env
```

Mindestens diese Variablen setzen (Details siehe [Environment-Variablen](#️-environment-variablen)):

```env
DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"
NEXTAUTH_SECRET="min-32-zeichen-random-string"
NEXTAUTH_URL="http://localhost:3000"
TENANT_ID="demo"
```

### 4. Datenbank initialisieren

```bash
# Prisma Client generieren
npx prisma generate

# Schema in DB pushen (Development)
npx prisma db push

# ODER: Migration erstellen (Production)
npx prisma migrate dev --name init
```

### 5. Development Server starten

```bash
npm run dev
```

→ Öffne http://localhost:3000

### 6. Erster Login

Falls kein Admin-User existiert und `SETUP_ENABLED=true`:
- Navigiere zu `/setup`
- Folge dem Setup-Wizard

Alternativ via Seed:
```bash
npx prisma db seed
```

---

## ⚙️ Environment-Variablen

### Pflicht-Variablen

| Variable | Beschreibung | Beispiel |
|----------|--------------|----------|
| `DATABASE_URL` | PostgreSQL Connection String (Neon) | `postgresql://user:pass@ep-xxx.neon.tech/db?sslmode=require` |
| `NEXTAUTH_SECRET` | JWT Signing Secret (min. 32 Zeichen) | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Basis-URL der App | `https://app.kunde.de` |
| `TENANT_ID` | Aktiver Tenant (Slug aus `src/config/tenants/`) | `koch-aufforstung` |

### Optionale Variablen

| Variable | Beschreibung | Default |
|----------|--------------|---------|
| **Authentifizierung** | | |
| `APP_JWT_SECRET` | Zusätzliches JWT Secret für App-Sync | — |
| `SETUP_ENABLED` | Setup-Wizard aktivieren | `false` |
| `ADMIN_EMAIL` | E-Mail für Admin-Benachrichtigungen | — |
| **Email (SMTP)** | | |
| `SMTP_HOST` | SMTP Server Hostname | — |
| `SMTP_PORT` | SMTP Port | `587` |
| `SMTP_SECURE` | TLS verwenden | `true` |
| `SMTP_USER` | SMTP Username | — |
| `SMTP_PASS` | SMTP Passwort | — |
| `SMTP_FROM` | Absender-Adresse | `noreply@appfabrik.de` |
| **WordPress Integration** | | |
| `WP_USER` | WP Admin Username | — |
| `WP_PASSWORD` | WP Application Password | — |
| `WP_FM_SECRET` | Shared Secret für WP-FM API Sync | — |
| **Nextcloud (Dateispeicher)** | | |
| `NEXTCLOUD_URL` | WebDAV URL | — |
| `NEXTCLOUD_USER` | Nextcloud Username | — |
| `NEXTCLOUD_PASS` | Nextcloud App-Passwort | — |
| **KI & RAG** | | |
| `PERPLEXITY_API_KEY` | Perplexity API Key für KI-Recherche | — |
| `SECOND_BRAIN_URL` | Second Brain PostgreSQL für RAG | — |
| **Sicherheit** | | |
| `CRON_SECRET` | Bearer Token für Cron-Routes | — |
| `VERCEL_BYPASS_TOKEN` | Vercel Automation Bypass | — |
| **Demo-Modus** | | |
| `DEMO_PASSWORD` | Demo-Login Passwort (für Vorführungen) | — |

### Umgebungsspezifische Konfiguration

```bash
# Development
NODE_ENV=development
NEXTAUTH_URL=http://localhost:3000

# Production
NODE_ENV=production
NEXTAUTH_URL=https://app.kunde.de
```

---

## 🎨 Tenant-Konfiguration

Das Tenant-System ermöglicht vollständige White-Label-Anpassung ohne Code-Änderungen.

### Struktur

```
src/config/
├── tenant.ts           # Zod-Schemas & Type-Definitionen
├── tenants/
│   ├── demo.ts         # Demo-Tenant (Referenz)
│   ├── koch-aufforstung.ts
│   └── [neuer-kunde].ts
└── permissions.ts      # Permission-Definitionen
```

### Neuen Tenant anlegen

1. **Datei kopieren:**
```bash
cp src/config/tenants/demo.ts src/config/tenants/mein-kunde.ts
```

2. **Konfiguration anpassen:**
```typescript
// src/config/tenants/mein-kunde.ts
import { TenantConfig } from '../tenant';

export const tenantConfig: TenantConfig = {
  // === Basis-Info ===
  id: 'mein-kunde',
  name: 'Meine Firma GmbH',
  shortName: 'MeineFirma',
  tagline: 'Professioneller Service seit 2020',
  logo: '/logo/mein-kunde.svg',
  
  // === Branding Colors ===
  colors: {
    primary: '#1E40AF',      // Haupt-Markenfarbe
    primaryLight: '#3B82F6',
    primaryDark: '#1E3A8A',
    secondary: '#F59E0B',
    secondaryLight: '#FBBF24',
    secondaryDark: '#D97706',
    background: '#F8FAFC',
    backgroundAlt: '#F1F5F9',
    surface: '#FFFFFF',
    text: '#0F172A',
    textMuted: '#64748B',
    textOnPrimary: '#FFFFFF',
    textOnSecondary: '#000000',
    success: '#22C55E',
    successLight: '#86EFAC',
    warning: '#F59E0B',
    warningLight: '#FDE68A',
    error: '#EF4444',
    errorLight: '#FECACA',
    info: '#3B82F6',
    infoLight: '#BFDBFE',
    border: '#E2E8F0',
    divider: '#CBD5E1',
    sidebarBg: '#1E293B',
    sidebarText: '#E2E8F0',
    sidebarActive: '#3B82F6',
  },

  // === Module (Feature Flags) ===
  modules: {
    auftraege:       { enabled: true },
    mitarbeiter:     { enabled: true },
    lager:           { enabled: true },
    fuhrpark:        { enabled: true },
    rechnungen:      { enabled: true },
    protokolle:      { enabled: true },
    kontakte:        { enabled: true },
    dokumente:       { enabled: true },
    reports:         { enabled: true },
    lohn:            { enabled: true },
    // Optionale Module
    foerderung:      { enabled: false },
    abnahme:         { enabled: false },
    qualifikationen: { enabled: false },
    saatguternte:    { enabled: false },
  },

  // === Rollen & Berechtigungen ===
  roles: [
    {
      id: 'admin',
      name: 'Administrator',
      description: 'Vollzugriff auf alle Funktionen',
      permissions: ['*'],
    },
    {
      id: 'manager',
      name: 'Betriebsleiter',
      description: 'Verwaltung ohne Systemeinstellungen',
      permissions: ['auftraege.*', 'mitarbeiter.read', 'mitarbeiter.write', ...],
    },
    {
      id: 'worker',
      name: 'Mitarbeiter',
      description: 'Eigene Aufträge und Protokolle',
      permissions: ['auftraege.read', 'protokolle.write', ...],
      isDefault: true,
    },
  ],

  // === Branchen-Anpassung ===
  branche: {
    id: 'bau',
    name: 'Baugewerbe',
    auftragstypen: ['Neubau', 'Sanierung', 'Wartung', 'Reparatur'],
    leistungseinheiten: ['Stunden', 'Pauschale', 'm²', 'lfm'],
    protokollFelder: ['wetter', 'arbeitszeit', 'material'],
    lagerKategorien: ['Baumaterial', 'Werkzeuge', 'Verbrauchsmaterial'],
  },

  // === Labels (Übersetzungen) ===
  labels: {
    auftrag: 'Auftrag',
    auftraege: 'Aufträge',
    kunde: 'Kunde',
    kunden: 'Kunden',
    mitarbeiter: 'Mitarbeiter',
    gruppenfuehrer: 'Bauleiter',
    // ... weitere Labels
  },

  // === Rechtliche Infos ===
  legal: {
    companyName: 'Meine Firma GmbH',
    address: 'Musterstraße 1, 12345 Musterstadt',
    taxId: 'DE123456789',
    email: 'info@meinefirma.de',
    phone: '+49 123 456789',
    website: 'https://meinefirma.de',
  },
};
```

3. **TENANT_ID setzen:**
```env
TENANT_ID=mein-kunde
```

4. **Deploy**

### Theme-System

Farben werden automatisch zu CSS-Variablen:

```css
/* Automatisch generiert aus tenant.colors */
:root {
  --color-primary: #1E40AF;
  --color-primary-light: #3B82F6;
  --color-secondary: #F59E0B;
  /* ... */
}
```

Nutzung in Tailwind:
```html
<button class="bg-primary text-on-primary hover:bg-primary-dark">
  Speichern
</button>
```

---

## 📁 Verzeichnisstruktur

```
appfabrik-base/
├── .github/
│   └── workflows/
│       ├── ci.yml            # Tests bei PR
│       └── deploy.yml        # Auto-Deploy bei Push
│
├── app-template/             # Mobile App Template (Expo)
│   ├── src/
│   └── package.json
│
├── docs/                     # Dokumentation
│   ├── DEVELOPER.md          # ← Du bist hier
│   ├── API-CONVENTIONS.md
│   ├── SECURITY-CHECKLIST.md
│   ├── TENANT-SETUP-CHECKLIST.md
│   ├── openapi.yaml
│   └── ...
│
├── legal/                    # Rechtliche Dokumente
│   ├── AGB.md
│   ├── AVV.md
│   └── DATENSCHUTZ.md
│
├── prisma/
│   ├── schema.prisma         # Datenbank-Schema
│   └── seed.ts               # Seed-Daten
│
├── public/
│   ├── logo/                 # Tenant-Logos
│   └── icons/
│
├── scripts/
│   ├── backup.ts             # DB Backup Script
│   └── migrate-tenant.ts     # Tenant-Migration
│
├── src/
│   ├── app/                  # Next.js App Router
│   │   ├── (auth)/           # Auth-Routen (login, register)
│   │   ├── (dashboard)/      # Geschützte Dashboard-Routen
│   │   │   ├── auftraege/
│   │   │   ├── mitarbeiter/
│   │   │   ├── lager/
│   │   │   ├── fuhrpark/
│   │   │   ├── rechnungen/
│   │   │   ├── protokolle/
│   │   │   ├── kontakte/
│   │   │   ├── dokumente/
│   │   │   ├── reports/
│   │   │   ├── lohn/
│   │   │   ├── profil/
│   │   │   └── einstellungen/
│   │   ├── api/              # API Routes
│   │   │   ├── auth/
│   │   │   ├── auftraege/
│   │   │   ├── cron/
│   │   │   └── ...
│   │   ├── setup/            # Setup-Wizard
│   │   └── layout.tsx
│   │
│   ├── components/
│   │   ├── ui/               # shadcn/ui Komponenten
│   │   ├── layout/           # Layout-Komponenten
│   │   ├── auftraege/        # Modul-spezifische Komponenten
│   │   └── ...
│   │
│   ├── config/
│   │   ├── tenant.ts         # Tenant-Schema
│   │   ├── tenants/          # Tenant-Konfigurationen
│   │   └── permissions.ts
│   │
│   ├── lib/
│   │   ├── prisma.ts         # Prisma Client
│   │   ├── auth.ts           # NextAuth Config
│   │   ├── theme/            # Theme-Utilities
│   │   └── utils.ts
│   │
│   └── styles/
│       └── globals.css
│
├── __tests__/                # Jest Unit Tests
├── e2e/                      # Playwright E2E Tests
│
├── .env.example
├── next.config.ts
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── vercel.json
```

---

## 🚢 Deployment

### Vercel (Empfohlen)

1. **Vercel Projekt erstellen:**
```bash
npx vercel link
```

2. **Environment Variablen setzen:**
```bash
vercel env add DATABASE_URL
vercel env add NEXTAUTH_SECRET
vercel env add NEXTAUTH_URL
vercel env add TENANT_ID
# ... weitere
```

Oder im Vercel Dashboard unter Settings → Environment Variables.

3. **Deploy:**
```bash
# Preview (Feature Branch)
vercel

# Production
vercel --prod
```

### CI/CD Pipeline

GitHub Actions Workflow (`.github/workflows/deploy.yml`) deployed automatisch:

- **`main` Branch** → Production
- **Feature Branches** → Preview Deployments

### Prisma Migrations

**Development:**
```bash
npx prisma migrate dev --name beschreibung
```

**Production (via Vercel):**
- `postinstall` Script führt `prisma migrate deploy` automatisch aus
- Alternativ: Manual via Vercel CLI
```bash
npx vercel env pull
npx prisma migrate deploy
```

### Domain-Setup

1. Vercel Dashboard → Project → Settings → Domains
2. Custom Domain hinzufügen (z.B. `app.kunde.de`)
3. DNS-Records beim Kunden konfigurieren:
   - A Record: `76.76.21.21`
   - CNAME: `cname.vercel-dns.com`
4. SSL wird automatisch aktiviert

---

## 🧪 Testing

### Unit Tests (Jest)

```bash
# Alle Tests
npm test

# Mit Coverage
npm test -- --coverage

# Watch-Modus
npm test -- --watch

# Einzelne Datei
npm test -- src/lib/utils.test.ts
```

### E2E Tests (Playwright)

```bash
# Alle E2E Tests
npm run test:e2e

# UI-Modus (Debug)
npm run test:e2e -- --ui

# Einzelner Test
npm run test:e2e -- e2e/login.spec.ts
```

### Test-Struktur

```
__tests__/
├── lib/
│   ├── utils.test.ts
│   └── auth.test.ts
├── api/
│   └── auftraege.test.ts
└── components/
    └── Button.test.tsx

e2e/
├── login.spec.ts
├── dashboard.spec.ts
└── auftraege.spec.ts
```

### Mocking

Prisma Client wird in Tests automatisch gemockt:
```typescript
// jest.setup.ts
jest.mock('./src/lib/prisma', () => ({
  prisma: mockPrismaClient,
}));
```

---

## 📡 API & Konventionen

Siehe ausführliche Dokumentation: [API-CONVENTIONS.md](./API-CONVENTIONS.md)

### REST-Konventionen (Kurzfassung)

| Methode | Route | Beschreibung |
|---------|-------|--------------|
| GET | `/api/auftraege` | Alle Aufträge (gefiltert) |
| GET | `/api/auftraege/[id]` | Einzelner Auftrag |
| POST | `/api/auftraege` | Auftrag erstellen |
| PATCH | `/api/auftraege/[id]` | Auftrag aktualisieren |
| DELETE | `/api/auftraege/[id]` | Auftrag löschen |

### Error Response Format

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Titel ist erforderlich",
    "details": { "field": "titel" }
  }
}
```

### OpenAPI Spec

Vollständige API-Dokumentation: [openapi.yaml](./openapi.yaml)

Swagger UI (falls aktiviert): `/api/docs`

---

## 📱 Mobile App

Das Template enthält ein Expo/React Native App-Template in `app-template/`.

### Eigenes App-Repo erstellen

```bash
cp -r app-template/ ../mein-kunde-app
cd ../mein-kunde-app
npm install
```

### EAS Build

```bash
# EAS CLI installieren
npm install -g eas-cli

# Login
eas login

# Build konfigurieren
eas build:configure

# Android APK bauen
eas build --platform android --profile preview

# iOS bauen (erfordert Apple Developer Account)
eas build --platform ios --profile preview
```

### App-spezifische Dokumentation

Siehe `app-template/README.md` für:
- WatermelonDB Offline-Sync
- Push Notifications
- Deep Linking
- App Store Submission

---

## 🔧 Troubleshooting

### Prisma: "Can't reach database server"

```bash
# Connection String prüfen
echo $DATABASE_URL

# SSL-Mode prüfen (Neon braucht ?sslmode=require)
npx prisma db pull
```

### "TENANT_ID not found"

1. Prüfe ob `src/config/tenants/[TENANT_ID].ts` existiert
2. Prüfe `.env` auf korrekten Wert
3. Server neu starten

### Build-Fehler "Type Error"

```bash
# TypeScript neu kompilieren
rm -rf .next
npm run build
```

### Vercel: "Prisma Client not generated"

Das `postinstall` Script sollte `prisma generate` ausführen. Falls nicht:
```bash
# vercel.json
{
  "buildCommand": "prisma generate && next build"
}
```

### Tests schlagen fehl

```bash
# Jest Cache löschen
npm test -- --clearCache

# Dependencies neu installieren
rm -rf node_modules package-lock.json
npm install
```

---

## 📚 Weiterführende Dokumentation

| Dokument | Beschreibung |
|----------|--------------|
| [API-CONVENTIONS.md](./API-CONVENTIONS.md) | REST-API Standards |
| [SECURITY-CHECKLIST.md](./SECURITY-CHECKLIST.md) | Sicherheits-Checkliste |
| [TENANT-SETUP-CHECKLIST.md](./TENANT-SETUP-CHECKLIST.md) | Neukunden-Onboarding |
| [ONBOARDING-PLAYBOOK.md](./ONBOARDING-PLAYBOOK.md) | 4-Wochen-Plan |
| [openapi.yaml](./openapi.yaml) | OpenAPI 3.0 Spec |

---

## 🤝 Contributing

1. Feature Branch erstellen: `git checkout -b feature/mein-feature`
2. Commits: `git commit -m "feat: Beschreibung"`
3. Push: `git push origin feature/mein-feature`
4. Pull Request erstellen

### Commit-Konvention

```
feat: Neues Feature
fix: Bug-Fix
docs: Dokumentation
style: Formatierung
refactor: Code-Refactoring
test: Tests hinzufügen
chore: Maintenance
```

---

**Fragen?** Erstelle ein Issue oder kontaktiere das AppFabrik-Team.

*Letzte Aktualisierung: 30.03.2026*
