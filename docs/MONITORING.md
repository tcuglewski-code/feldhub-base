# Monitoring & Alerting — AppFabrik Multi-Tenant

> **Version:** 1.0.0  
> **Erstellt:** 2026-03-30  
> **Verantwortlich:** Amadeus (Orchestrator)

---

## 📋 Überblick

AppFabrik nutzt ein einfaches, kostenfreies Monitoring via GitHub Actions.
Jeder Tenant wird alle 30 Minuten auf Erreichbarkeit geprüft.
Alerts gehen direkt in Mission Control (High Priority Notification).

---

## 🔍 Was wird gemonitort?

| Check | Frequenz | Alert bei |
|-------|----------|-----------|
| Frontend erreichbar (HTTP 200) | 30 min | Timeout / falscher Status |
| API Health Endpoint | 30 min | HTTP != 200 |
| WordPress Website | 30 min | Timeout / HTTP 5xx |
| Mission Control selbst | 30 min | Nicht erreichbar |
| Antwortzeit | 30 min | > 3000ms (Warning) |

---

## 🏗️ Architektur

```
GitHub Actions Cron (alle 30 min)
        │
        ▼
┌─────────────────────────────────────┐
│  monitor-uptime.sh                  │
│  ├── check_url() → HTTP Status+Zeit │
│  ├── check_api() → JSON Validation  │
│  └── send_alert() → MC Notification │
└─────────────────────────────────────┘
        │
        ├── ✅ Alles OK → GitHub Actions grün
        ├── ⚠️  Langsam → MC Warning Notification
        └── ❌ Down    → MC High Priority Alert + Exit 1
```

---

## ⚙️ Konfiguration für neuen Tenant

### 1. GitHub Secrets setzen (optional)

```bash
# Tenant-spezifische URLs (falls nicht im Script als Default)
FRONTEND_URL_<TENANT-ID>    # z.B. https://muster-betrieb.vercel.app
API_URL_<TENANT-ID>         # z.B. https://muster-betrieb.vercel.app/api
HEALTH_URL_<TENANT-ID>      # z.B. https://muster-betrieb.vercel.app/api/health

# Immer nötig
MC_API_KEY                   # Mission Control API Key (einmal für alle)
```

### 2. Tenant zur GitHub Actions Matrix hinzufügen

```yaml
# .github/workflows/monitoring.yml → jobs.monitor.strategy.matrix.tenant:
matrix:
  tenant:
    - koch-aufforstung
    - muster-betrieb   # ← NEU
```

### 3. Health Endpoint im Next.js Projekt hinzufügen

```typescript
// app/api/health/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ 
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: 'connected'
    });
  } catch (error) {
    return NextResponse.json(
      { status: 'error', database: 'disconnected' },
      { status: 503 }
    );
  }
}
```

---

## 📱 Alert-Flow

```
Fehler erkannt
     │
     ▼
MC Notification (High Priority)
     │
     ▼
Tomek wird benachrichtigt (Telegram/Push)
     │
     ▼
Manuelle Diagnose:
  1. GitHub Actions Log prüfen
  2. Vercel Dashboard prüfen
  3. Neon DB Status prüfen
  4. Bei Bedarf: Rollback via Vercel
```

---

## 🚨 Alert-Typen

| Emoji | Typ | Priorität | Aktion |
|-------|-----|-----------|--------|
| 🔴 | System DOWN | High | Sofort prüfen |
| 🟡 | Langsam (>3s) | Medium | Binnen 4h prüfen |
| 📊 | Täglicher Report | Low | Zur Info |

---

## 🔧 Manuelles Monitoring

```bash
# Einen Tenant lokal prüfen
TENANT_ID=koch-aufforstung \
MC_API_KEY=xxx \
bash scripts/monitor-uptime.sh

# Ohne Alerts (nur Ausgabe)
TENANT_ID=koch-aufforstung \
bash scripts/monitor-uptime.sh
```

---

## 💰 Kosten

| Komponente | Kosten |
|-----------|--------|
| GitHub Actions (30 min Cron) | **Kostenlos** (public repo) |
| Mission Control Notifications | **Kostenlos** (selbst gehostet) |
| **Total** | **$0/Monat** |

---

## 🔮 Erweiterungen (geplant)

- [ ] **Error Tracking:** Sentry.io Integration (kostenlos bis 5k Events/Monat)
- [ ] **Log Aggregation:** Axiom.co oder Grafana Loki
- [ ] **Status Page:** öffentliche Status-Seite für Kunden
- [ ] **Incident Management:** automatische Ticket-Erstellung in MC bei Downtime
