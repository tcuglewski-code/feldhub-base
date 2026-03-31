# Pulse-Agent — Social Media Scheduling
## Sprint KA | 31.03.2026

---

## Was macht der Pulse-Agent?

Automatisches Social Media Scheduling für Feldhubs Marketing:

1. **Lädt Scheduling-Queue** aus Mission Control
2. **Postet fällige Beiträge** auf LinkedIn (und später Twitter/Instagram)
3. **Generiert neue Drafts** via Claude (claude-haiku — kostengünstig)
4. **Trackt Performance** via Plausible Custom Events
5. **Erstellt MC-Tasks** bei Fehlern

---

## Architektur

```
Cron: täglich 08:00
     ↓
  loadQueue()          ← Mission Control API
     ↓
  duePosts.forEach()
     ↓
  postToLinkedIn()     ← LinkedIn API v2 (TODO: echte Integration)
     ↓
  updatePostStatus()   ← MC PATCH /api/pulse/posts/:id
     ↓
  trackPostEvent()     ← Plausible Custom Event
     ↓
  (Queue < 3 Posts?)
     ↓ ja
  generatePost()       ← Claude Haiku
     ↓
  POST /api/pulse/posts (Draft)
```

---

## Datei

`src/cron/pulse-agent.ts`

---

## Content-Plan Integration

4 Content-Briefs vordefiniert in `CONTENT_CALENDAR[]`:
- Digitalisierung im Außendienst (Koch Aufforstung Case Study)
- KI-Agenten in der Softwareentwicklung
- 5 Anzeichen für Digitalisierungsreife
- White-Label SaaS für Außendienst

---

## Cron-Setup (OpenClaw)

```
Schedule: täglich 08:00 Europe/Berlin
Payload: systemEvent oder agentTurn
Hinweis: LinkedIn API Token via env LINKEDIN_ACCESS_TOKEN
```

---

## MC API Endpoints (zu implementieren)

| Methode | Route | Beschreibung |
|---------|-------|-------------|
| GET | /api/pulse/queue | Alle geplanten Posts |
| POST | /api/pulse/posts | Neuen Post/Draft anlegen |
| PATCH | /api/pulse/posts/:id | Status updaten |
| GET | /api/pulse/stats | Performance-Übersicht |

---

## LinkedIn API Integration (TODO für Tomek)

Echte LinkedIn-Posts benötigen:
1. LinkedIn App im Developer Portal anlegen
2. `w_member_social` Scope anfordern
3. OAuth2 Flow für Tomeks Account
4. `LINKEDIN_ACCESS_TOKEN` als env Variable

**Alternativen:** Buffer API, Hootsuite API (kostenpflichtig aber einfacher)

---

## Nächste Schritte

- [ ] LinkedIn API v2 echte Integration
- [ ] MC API Routes `/api/pulse/` implementieren (Archie)
- [ ] LINKEDIN_ACCESS_TOKEN in env konfigurieren
- [ ] Cron-Job in OpenClaw anlegen (08:00 täglich)
- [ ] Instagram Graph API (für Koch Aufforstung Zielgruppe)
