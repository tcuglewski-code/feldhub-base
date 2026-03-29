# Tenant Setup Checkliste — AppFabrik

> Technische Checkliste für das Onboarding eines neuen Kunden/Tenant.  
> 15 Schritte von Repo bis Go-Live.

---

## Phase 1: Repository & Code (Punkte 1-3)

### ✅ 1. GitHub Repository forken/erstellen

- [ ] `appfabrik-base` Repository forken → `kunde-projektname`
- [ ] Repository auf **Private** setzen
- [ ] Collaborators hinzufügen: `tcuglewski-code`, `openclaw-robot`
- [ ] Branch Protection für `main` aktivieren (require PR reviews)
- [ ] `.github/workflows/` Dateien prüfen (CI/CD)

**Namenskonvention:** `[kunde]-[produkt]` z.B. `mueller-gartenbau-manager`

### ✅ 2. tenant.ts konfigurieren

- [ ] `src/config/tenant.ts` öffnen
- [ ] Firmenname, Slug, Domain eintragen
- [ ] Brand-Farben (primaryColor, secondaryColor) setzen
- [ ] Logo-URL eintragen (oder Platzhalter)
- [ ] Features aktivieren/deaktivieren (Zeiterfassung, Aufträge, Lager, etc.)
- [ ] Rollen-Permissions anpassen

```typescript
export const tenant = {
  name: "Müller Gartenbau",
  slug: "mueller-gartenbau",
  domain: "manager.mueller-gartenbau.de",
  branding: {
    primaryColor: "#2d5a27",
    logo: "/logo.svg",
  },
  features: {
    timeTracking: true,
    orders: true,
    inventory: true,
    invoicing: true,
    foerderberatung: false,
  },
};
```

### ✅ 3. Lokale Entwicklung testen

- [ ] `pnpm install` ausführen
- [ ] `.env.local` mit Test-Credentials anlegen
- [ ] `pnpm dev` — App läuft lokal?
- [ ] Login mit Test-User funktioniert?
- [ ] Alle aktivierten Features sichtbar?

---

## Phase 2: Datenbank (Punkte 4-6)

### ✅ 4. Neon Datenbank erstellen

- [ ] Login unter [console.neon.tech](https://console.neon.tech)
- [ ] Neues Projekt erstellen: `appfabrik-[kunde]`
- [ ] Region: `eu-central-1` (Frankfurt)
- [ ] Connection String kopieren

**Namenskonvention:** `appfabrik-mueller-gartenbau`

### ✅ 5. Prisma Schema migrieren

- [ ] Connection String in `.env.local` eintragen
- [ ] `npx prisma migrate dev --name init` ausführen
- [ ] `npx prisma db seed` für Basis-Daten (Admin-User, Rollen)
- [ ] Datenbank-Tabellen in Neon Console prüfen

### ✅ 6. Backup-Strategie konfigurieren

- [ ] Neon Point-in-Time Recovery aktiviert? (Standard: 7 Tage)
- [ ] Optional: Neon Branching für Staging-DB
- [ ] Connection String dokumentieren (verschlüsselt in TOOLS.md oder Vault)

---

## Phase 3: Deployment (Punkte 7-9)

### ✅ 7. Vercel Projekt erstellen

- [ ] [vercel.com](https://vercel.com) → New Project
- [ ] GitHub Repo verbinden
- [ ] Framework Preset: Next.js
- [ ] Root Directory: `/` (oder `/apps/web` bei Monorepo)
- [ ] Build Command: `pnpm build`
- [ ] Install Command: `pnpm install`

### ✅ 8. ENV-Variablen in Vercel setzen

**Pflicht-Variablen:**

| Variable | Beschreibung | Beispiel |
|----------|-------------|----------|
| `DATABASE_URL` | Neon Connection String | `postgresql://...` |
| `NEXTAUTH_SECRET` | Auth Secret (generieren!) | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Production URL | `https://manager.kunde.de` |
| `NEXT_PUBLIC_APP_URL` | Public URL | `https://manager.kunde.de` |

**Optionale Variablen:**

| Variable | Beschreibung |
|----------|-------------|
| `SMTP_HOST` | Email Server |
| `SMTP_PORT` | Email Port (587) |
| `SMTP_USER` | Email Username |
| `SMTP_PASS` | Email Passwort |
| `STRIPE_SECRET_KEY` | Stripe API Key (Invoicing) |
| `STRIPE_WEBHOOK_SECRET` | Stripe Webhook Secret |
| `WP_API_URL` | WordPress REST API (falls WP-Integration) |
| `WP_API_USER` | WP Application Password User |
| `WP_API_PASS` | WP Application Password |

- [ ] Alle Pflicht-Variablen gesetzt?
- [ ] In allen Environments (Production, Preview)?
- [ ] `NEXTAUTH_SECRET` neu generiert (nicht von anderem Projekt kopieren)?

### ✅ 9. Domain konfigurieren

- [ ] Vercel → Project Settings → Domains
- [ ] Custom Domain hinzufügen: `manager.kunde.de`
- [ ] DNS beim Kunden/Provider konfigurieren:
  - **A-Record:** `76.76.21.21` (Vercel)
  - **CNAME:** `cname.vercel-dns.com` (für Subdomains)
- [ ] SSL-Zertifikat automatisch (Let's Encrypt via Vercel)
- [ ] Redirect www → non-www (oder umgekehrt)

---

## Phase 4: Mobile App (Punkte 10-12)

### ✅ 10. EAS Build konfigurieren

- [ ] `appfabrik-app-base` Repository forken → `kunde-app`
- [ ] `app.json` anpassen:
  - `name`: "Müller Gartenbau"
  - `slug`: "mueller-gartenbau-app"
  - `ios.bundleIdentifier`: "de.mueller-gartenbau.app"
  - `android.package`: "de.mueller_gartenbau.app"
- [ ] `eas.json` prüfen (Build-Profile)
- [ ] EAS CLI: `eas build:configure`

### ✅ 11. App Icons & Splash Screen

- [ ] App Icon (1024x1024 PNG) in `/assets/icon.png`
- [ ] Adaptive Icon (1024x1024) in `/assets/adaptive-icon.png`
- [ ] Splash Screen (1284x2778) in `/assets/splash.png`
- [ ] Farben in `app.json` anpassen (`splash.backgroundColor`)

### ✅ 12. EAS Build starten

- [ ] `eas build --platform android --profile production`
- [ ] `eas build --platform ios --profile production` (Apple Developer Account nötig!)
- [ ] Build-Artefakte downloaden und testen
- [ ] Bei Erfolg: App Store / Play Store Submission vorbereiten

---

## Phase 5: Integration & Go-Live (Punkte 13-15)

### ✅ 13. Email-System konfigurieren

- [ ] SMTP-Zugangsdaten vom Kunden oder eigenen Mailserver
- [ ] ENV-Variablen in Vercel setzen (SMTP_*)
- [ ] Test-Email senden (Password Reset, Willkommensmail)
- [ ] Absender-Adresse konfigurieren: `noreply@kunde.de`

**Empfohlene Anbieter:**
- Kunden-Domain: Eigener SMTP
- AppFabrik: Postmark, SendGrid, Amazon SES

### ✅ 14. Admin-Account & Ersteinrichtung

- [ ] Admin-User in Datenbank anlegen (oder via Seed-Script)
- [ ] Erster Login testen
- [ ] Passwort ändern
- [ ] 2FA aktivieren (falls Feature aktiviert)
- [ ] Firmenlogo hochladen
- [ ] Erste Demo-Daten anlegen (Projekt, Aufgabe)

### ✅ 15. Go-Live Checklist

**Technisch:**
- [ ] SSL aktiv (grünes Schloss)?
- [ ] Alle Seiten erreichbar (keine 404)?
- [ ] Login/Logout funktioniert?
- [ ] Mobile App verbindet sich mit API?
- [ ] Emails werden versendet?

**Rechtlich:**
- [ ] Impressum vorhanden (oder Link zum Kunden-Impressum)?
- [ ] Datenschutzerklärung vorhanden?
- [ ] AVV mit Kunden unterschrieben?
- [ ] Cookie-Banner (falls Tracking aktiv)?

**Dokumentation:**
- [ ] Kunden-Zugangsdaten dokumentiert (verschlüsselt)
- [ ] Onboarding-Guide an Kunden gesendet
- [ ] Support-Kanal kommuniziert (Email/Telefon)

---

## Quick Reference: Wichtige URLs

| Service | URL |
|---------|-----|
| GitHub Repos | github.com/tcuglewski-code |
| Vercel Dashboard | vercel.com/dashboard |
| Neon Console | console.neon.tech |
| EAS Builds | expo.dev/accounts/baerenklee |
| Mission Control | mission-control-tawny-omega.vercel.app |

---

## Zeitaufwand-Schätzung

| Phase | Dauer |
|-------|-------|
| Phase 1: Repository & Code | 1-2h |
| Phase 2: Datenbank | 30min |
| Phase 3: Deployment | 1-2h |
| Phase 4: Mobile App | 2-4h (inkl. Build-Zeit) |
| Phase 5: Integration & Go-Live | 1-2h |
| **Gesamt** | **6-10h** |

---

## Notizen

- Bei Problemen: SECURITY-CHECKLIST.md und VERCEL-SETUP.md konsultieren
- Stripe-Integration nur aktivieren wenn Invoicing-Feature gebucht
- iOS App Store erfordert Apple Developer Account ($99/Jahr) — ggf. Kunde muss eigenen Account haben
- Bei White-Label für große Kunden: Separate Vercel-Organisation empfohlen

---

*Erstellt: 29.03.2026 | Version: 1.0 | Autor: Amadeus (AppFabrik)*
