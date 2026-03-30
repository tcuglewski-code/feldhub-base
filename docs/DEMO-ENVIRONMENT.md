# Demo-Umgebung — AppFabrik Live-Demo

> **Zweck:** Interessenten und potenzielle Kunden können alle AppFabrik-Features live testen  
> **URL (geplant):** https://demo.appfabrik.de  
> **Demo-Daten-Reset:** Stündlich automatisch

---

## Übersicht

Die Demo-Umgebung ist eine vollständig funktionsfähige AppFabrik-Instanz mit:
- Realistischen Beispieldaten (fiktive Firma "DemoFirma GmbH")
- Alle Features freigeschaltet (Professional Plan)
- Stündlicher automatischer Daten-Reset
- 3 Demo-Zugänge (Admin, Manager, Mitarbeiter)

---

## Demo-Zugänge

| Rolle | Email | Passwort | Beschreibung |
|-------|-------|----------|--------------|
| Admin | admin@demo.appfabrik.de | Demo2026! | Voller Zugriff auf alle Funktionen |
| Manager | manager@demo.appfabrik.de | Demo2026! | Verwaltung ohne Admin-Einstellungen |
| Mitarbeiter | mitarbeiter@demo.appfabrik.de | Demo2026! | Außendienst-Perspektive |

---

## Deployment

### Vercel Setup

```bash
# 1. Clone Repo
git clone https://github.com/tcuglewski-code/appfabrik-base

# 2. Demo-Script ausführen
chmod +x scripts/setup-demo.sh
VERCEL_TOKEN=<token> ./scripts/setup-demo.sh

# 3. Custom Domain
vercel domains add demo.appfabrik.de
```

### Environment Variables (Vercel)

```
NEXT_PUBLIC_TENANT_ID=demo
NEXT_PUBLIC_DEMO_MODE=true
DATABASE_URL=<neon-demo-branch-url>
NEXTAUTH_SECRET=<secret>
NEXTAUTH_URL=https://demo.appfabrik.de
DEMO_RESET_TOKEN=<sicherer-token>
```

### Neon DB — Demo Branch

```bash
# Neon CLI: Demo-Branch erstellen
neon branches create --name demo --project-id <project-id>

# Demo-Daten einpflegen
npx ts-node prisma/seed-demo.ts
```

---

## Demo-Reset (Automatisch)

### Vercel Cron Job (vercel.json)

```json
{
  "crons": [
    {
      "path": "/api/demo/reset",
      "schedule": "0 * * * *"
    }
  ]
}
```

### API Endpoint

```typescript
// src/app/api/demo/reset/route.ts
// Setzt alle Demo-Daten auf Ausgangszustand zurück
// Gesichert mit DEMO_RESET_TOKEN
```

---

## Demo-Features (alle aktiviert)

| Feature | Status | Beschreibung |
|---------|--------|--------------|
| Auftrags-Verwaltung | ✅ | Erstellen, bearbeiten, zuweisen |
| Mitarbeiter-Verwaltung | ✅ | Profile, Rollen, Verfügbarkeit |
| Kunden-Portal | ✅ | Login, Auftragsstatus, Dokumente |
| Rechnungsstellung | ✅ | Erstellen, versenden, bezahlt markieren |
| Zeiterfassung | ✅ | Ein/Ausstempeln, Berichte |
| GPS-Tracking | ✅ | Live-Position, Routen |
| Foto-Dokumentation | ✅ | Upload, Geo-Tag, Galerie |
| Berichte | ✅ | Dashboard, Export |
| Offline-Mode | ✅ | Mobile App ohne Internet |
| Push-Notifications | ✅ | Auftrag-Updates |

---

## Sales-Einsatz

### Wann Demo-Link teilen?

- Bei Sales-Gesprächen (Link im Pitch Deck)
- In LinkedIn/Marketing Posts
- In der Email-Signatur AppFabrik
- Auf der AppFabrik Website (Hero CTA: "Jetzt Demo starten")

### Demo-Walkthrough Script (15 Min)

1. **Admin-Login** → Dashboard Overview (2 Min)
2. **Auftrag erstellen** → Kunde + Mitarbeiter zuweisen (3 Min)
3. **Mitarbeiter-Perspektive** → Mobile App simulieren (3 Min)
4. **Kunden-Portal** → Was der Endkunde sieht (2 Min)
5. **Berichte** → Zahlen, Statistiken (2 Min)
6. **White-Label** → Tenant-Konfiguration zeigen (3 Min)

---

## Nächste Schritte

- [ ] Vercel Deployment durchführen (braucht Neon Demo-Branch URL)
- [ ] Custom Domain `demo.appfabrik.de` einrichten (braucht AppFabrik Domain)
- [ ] Demo-Reset API Endpoint implementieren (`/api/demo/reset`)
- [ ] Demo-Seite auf AppFabrik Website verlinken
- [ ] Kalender-Integration für Demo-Buchungen (Calendly)

---

*Erstellt: 30.03.2026 — Sprint HU*
