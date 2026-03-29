# Security Standard-Prozess

> **Gültig für:** Alle AppFabrik-Projekte (Web + App)
> **Zuletzt aktualisiert:** 2026-03-29
> **Verantwortlich:** Argus (QA & Security Agent)

Diese Checkliste muss bei **jedem neuen Projekt** und vor **jedem größeren Release** durchgearbeitet werden.

---

## 📋 Übersicht

| Kategorie | Kritikalität | Automatisiert |
|-----------|--------------|---------------|
| HTTPS & TLS | 🔴 Kritisch | ✅ Vercel |
| Security Headers | 🔴 Kritisch | ⚙️ next.config |
| Authentication | 🔴 Kritisch | ⚙️ NextAuth |
| SQL Injection | 🔴 Kritisch | ✅ Prisma ORM |
| XSS | 🔴 Kritisch | ⚙️ React + CSP |
| CSRF | 🟡 Hoch | ⚙️ NextAuth |
| Rate Limiting | 🟡 Hoch | ⚙️ Middleware |
| DSGVO | 🔴 Kritisch | 📋 Manuell |

---

## 🔒 1. HTTPS & TLS

### Anforderungen

- [ ] **HTTPS erzwungen** — Keine HTTP-Verbindungen erlaubt
- [ ] **TLS 1.2+** — Keine veralteten Protokolle
- [ ] **HSTS aktiviert** — `Strict-Transport-Security` Header
- [ ] **Gültiges SSL-Zertifikat** — Let's Encrypt oder Anbieter-Zertifikat

### Vercel Setup (automatisch)

Vercel erzwingt HTTPS automatisch. Prüfen via:

```bash
curl -I https://[projekt].vercel.app
# Erwartung: HTTP/2 200, HSTS-Header vorhanden
```

### Checkliste Produktion

- [ ] Custom Domain mit SSL konfiguriert
- [ ] HTTP→HTTPS Redirect aktiv
- [ ] SSL Labs Test: mindestens Note "A"
  - Test: https://www.ssllabs.com/ssltest/

---

## 🛡️ 2. Security Headers

### Erforderliche Headers

Konfiguration in `next.config.ts`:

```typescript
const securityHeaders = [
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin'
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(self), interest-cohort=()'
  },
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:;"
  }
];

// In next.config.ts
async headers() {
  return [
    {
      source: '/:path*',
      headers: securityHeaders,
    },
  ];
}
```

### Checkliste

- [ ] `Strict-Transport-Security` konfiguriert
- [ ] `X-Content-Type-Options: nosniff` aktiv
- [ ] `X-Frame-Options: DENY` aktiv (Clickjacking-Schutz)
- [ ] `Content-Security-Policy` definiert
- [ ] `Permissions-Policy` definiert
- [ ] Headers-Test bestanden: https://securityheaders.com

---

## 🔐 3. Authentication & Authorization

### NextAuth Setup

- [ ] `NEXTAUTH_SECRET` gesetzt (min. 32 Zeichen, zufällig generiert)
- [ ] `NEXTAUTH_URL` korrekt auf Produktions-Domain
- [ ] Session-Cookie `Secure` und `HttpOnly`
- [ ] JWT-Token-Expiry sinnvoll (max. 7 Tage)

### Passwort-Sicherheit

- [ ] Passwörter mit bcrypt gehasht (min. 12 Rounds)
- [ ] Mindestlänge: 8 Zeichen
- [ ] Keine Plaintext-Speicherung (niemals!)
- [ ] Rate Limiting bei Login (max. 5 Versuche/Minute)

### Session-Management

- [ ] Sessions invalidieren bei Passwort-Änderung
- [ ] Logout löscht Session serverseitig
- [ ] Session-Timeout nach Inaktivität (z.B. 24h)

### 2FA (für Admin-Accounts)

- [ ] TOTP-2FA aktiviert (otpauth + qrcode)
- [ ] Backup-Codes generiert und sicher gespeichert
- [ ] 2FA-Bypass nur mit Admin-Genehmigung

### Checkliste

```bash
# ENV-Variablen prüfen
echo $NEXTAUTH_SECRET | wc -c  # >= 32
echo $NEXTAUTH_URL             # https://...
```

---

## 💉 4. SQL Injection Prevention

### Prisma ORM (Automatischer Schutz)

Prisma verwendet parametrisierte Queries — SQL Injection ist damit **standardmäßig verhindert**.

### ⚠️ Risiko-Bereiche

**NIEMALS RAW SQL mit User-Input:**

```typescript
// ❌ GEFÄHRLICH
const result = await prisma.$queryRawUnsafe(
  `SELECT * FROM users WHERE email = '${userInput}'`
);

// ✅ SICHER
const result = await prisma.$queryRaw`
  SELECT * FROM users WHERE email = ${userInput}
`;
```

### Checkliste

- [ ] Kein `$queryRawUnsafe` mit User-Input
- [ ] Alle Datenbankabfragen über Prisma Client
- [ ] Keine String-Interpolation in SQL-Queries
- [ ] Input-Validierung vor Datenbank-Operationen (Zod)

---

## 🕸️ 5. Cross-Site Scripting (XSS) Prevention

### React (Automatischer Schutz)

React escaped JSX-Output automatisch. Risiko besteht bei:

### ⚠️ Risiko-Bereiche

```typescript
// ❌ GEFÄHRLICH
<div dangerouslySetInnerHTML={{ __html: userInput }} />

// ❌ GEFÄHRLICH
element.innerHTML = userInput;

// ✅ SICHER
<div>{userInput}</div>
```

### Content Security Policy

```typescript
// Strenge CSP in next.config.ts
"Content-Security-Policy": "default-src 'self'; script-src 'self';"
```

### Checkliste

- [ ] Kein `dangerouslySetInnerHTML` mit User-Input
- [ ] Kein `innerHTML` mit User-Input
- [ ] CSP-Header konfiguriert
- [ ] Markdown-Rendering sanitized (DOMPurify bei react-markdown)
- [ ] URL-Validierung bei Links (keine `javascript:` URLs)

### Sanitization

```typescript
import DOMPurify from 'dompurify';

// Wenn HTML-Rendering unvermeidbar:
const cleanHTML = DOMPurify.sanitize(userInput);
```

---

## 🔄 6. Cross-Site Request Forgery (CSRF)

### NextAuth (Automatischer Schutz)

NextAuth verwendet CSRF-Tokens automatisch für Auth-Endpoints.

### API-Routes

Für eigene API-Routes:

```typescript
// Middleware: Origin-Check
export function middleware(request: NextRequest) {
  const origin = request.headers.get('origin');
  const allowedOrigins = [process.env.NEXTAUTH_URL];
  
  if (request.method !== 'GET' && !allowedOrigins.includes(origin)) {
    return new Response('Forbidden', { status: 403 });
  }
}
```

### Checkliste

- [ ] NextAuth CSRF-Token aktiv
- [ ] `SameSite=Lax` oder `SameSite=Strict` für Cookies
- [ ] Origin-Header-Validierung für state-changing Requests
- [ ] Keine GET-Requests für Datenänderungen

---

## ⏱️ 7. Rate Limiting

### Implementation

```typescript
// src/middleware.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'),
  analytics: true,
});

// Oder einfache In-Memory-Lösung
const rateLimitMap = new Map<string, { count: number; timestamp: number }>();

export function rateLimit(ip: string, limit: number = 100, windowMs: number = 60000): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  
  if (!record || now - record.timestamp > windowMs) {
    rateLimitMap.set(ip, { count: 1, timestamp: now });
    return true;
  }
  
  if (record.count >= limit) {
    return false; // Rate limit exceeded
  }
  
  record.count++;
  return true;
}
```

### Empfohlene Limits

| Endpoint-Typ | Limit | Fenster |
|--------------|-------|---------|
| Login | 5 Requests | 1 Minute |
| API allgemein | 100 Requests | 1 Minute |
| File Upload | 10 Requests | 1 Minute |
| Passwort Reset | 3 Requests | 15 Minuten |

### Checkliste

- [ ] Login-Endpoint: Rate Limiting aktiv
- [ ] API-Endpoints: Rate Limiting aktiv
- [ ] 429 Response mit `Retry-After` Header
- [ ] IP-basiertes + User-basiertes Limiting

---

## 📝 8. Input Validation

### Zod Schema Validation

```typescript
import { z } from 'zod';

const UserInputSchema = z.object({
  email: z.string().email().max(255),
  name: z.string().min(1).max(100).trim(),
  phone: z.string().regex(/^\+?[0-9\s-]{6,20}$/).optional(),
});

// In API-Route
export async function POST(request: Request) {
  const body = await request.json();
  const result = UserInputSchema.safeParse(body);
  
  if (!result.success) {
    return Response.json({ error: result.error }, { status: 400 });
  }
  
  // result.data ist jetzt typsicher
}
```

### Checkliste

- [ ] Alle API-Inputs mit Zod validiert
- [ ] Max-Length für alle String-Felder
- [ ] Regex-Patterns für spezielle Formate (Email, Telefon, etc.)
- [ ] Enum-Validierung für feste Werte
- [ ] File-Upload: Typ + Größe validiert

---

## 🔑 9. Secrets Management

### ENV-Variablen

```bash
# Pflicht-Variablen für jedes Projekt
NEXTAUTH_SECRET=           # Min. 32 Zeichen
NEXTAUTH_URL=              # Produktions-URL
DATABASE_URL=              # Neon Connection String
```

### Checkliste

- [ ] Keine Secrets im Code (hardcoded)
- [ ] Keine Secrets in Git-History
- [ ] `.env` in `.gitignore`
- [ ] Vercel ENV-Variablen für Produktion
- [ ] Secrets rotieren bei Kompromittierung

### Secret Generation

```bash
# Sicheres NEXTAUTH_SECRET generieren
openssl rand -base64 32
```

---

## 📊 10. Logging & Monitoring

### Security Events loggen

- [ ] Fehlgeschlagene Login-Versuche
- [ ] Passwort-Änderungen
- [ ] Admin-Aktionen
- [ ] Rate-Limit-Überschreitungen
- [ ] 4xx/5xx Errors

### Monitoring

- [ ] Uptime-Monitoring aktiv (Mission Control)
- [ ] Error-Tracking (Sentry optional)
- [ ] Alerting bei Anomalien

---

## 🇪🇺 11. DSGVO Compliance

### Pflicht-Dokumente

- [ ] Impressum vollständig
- [ ] Datenschutzerklärung aktuell
- [ ] Cookie-Banner (wenn Cookies verwendet)
- [ ] AVV (Auftragsverarbeitungsvertrag) mit Kunden

### Technische Maßnahmen

- [ ] Daten-Export-Funktion (Art. 20 DSGVO)
- [ ] Account-Löschung möglich (Art. 17 DSGVO)
- [ ] Verschlüsselung at-rest und in-transit
- [ ] Logging nur mit Zweckbindung

### Unterauftragnehmer dokumentiert

- [ ] Vercel (Hosting) — USA, EU-Standard-Vertragsklauseln
- [ ] Neon (Datenbank) — EU Region verfügbar
- [ ] Expo (App Distribution) — USA

---

## 🚀 12. Deployment Checklist

### Vor jedem Release

```bash
# 1. Dependencies prüfen
npm audit

# 2. Security Headers testen
curl -I https://[projekt].vercel.app

# 3. SSL-Test
# https://www.ssllabs.com/ssltest/

# 4. Security Headers Test  
# https://securityheaders.com
```

### Automatisierte Checks (GitHub Actions)

```yaml
# .github/workflows/security.yml
name: Security Checks
on: [push, pull_request]
jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm audit --audit-level=high
```

---

## 🆘 Incident Response

### Bei Sicherheitsvorfall

1. **Sofort:** Betroffenes System isolieren (falls möglich)
2. **Informieren:** Tomek + Argus (Security Agent)
3. **Dokumentieren:** Was ist passiert? Wann? Wie entdeckt?
4. **Beheben:** Patch deployen, Secrets rotieren
5. **Nachbereiten:** Postmortem, Checkliste aktualisieren

### Kontakt

- **Security-Fragen:** Argus-Agent aktivieren
- **Dringende Vorfälle:** Tomek direkt kontaktieren

---

## 📅 Regelmäßige Reviews

| Prüfung | Intervall | Verantwortlich |
|---------|-----------|----------------|
| Dependency Audit | Wöchentlich | Argus (Cron) |
| Security Headers | Monatlich | Argus |
| SSL-Zertifikate | Monatlich | Argus |
| DSGVO-Compliance | Quartalsweise | Manuell |
| Full Security Audit | Jährlich | Extern / Manuell |

---

## 📚 Ressourcen

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
- [Next.js Security](https://nextjs.org/docs/app/building-your-application/configuring/content-security-policy)
- [Prisma Security](https://www.prisma.io/docs/concepts/components/prisma-client/raw-database-access#sql-injection)
- [BSI IT-Grundschutz](https://www.bsi.bund.de/DE/Themen/Unternehmen-und-Organisationen/Standards-und-Zertifizierung/IT-Grundschutz/it-grundschutz_node.html)

---

*Letzte Überprüfung: 2026-03-29 | Nächste Überprüfung: 2026-06-29*
