# Hunter-Agent: Lead Research Automatisierung
**Sprint JL | Stand: 31.03.2026**

---

## Überblick

Der Hunter-Agent automatisiert die Erstrecherche von Leads für Feldhub.
Er nutzt Perplexity Sonar Pro, um strukturierte Unternehmensdaten zu sammeln,
und speichert die Ergebnisse in JSON/CSV und Mission Control.

---

## Architektur

```
Hunter-Agent (Python)
        │
        ├── Perplexity API (sonar-large-128k-online)
        │   └── Branchen-spezifische Queries mit Regionen
        │
        ├── Lead-Parser
        │   └── Strukturiert Freitext → Lead-Objekte
        │
        ├── Datei-Output
        │   └── docs/research/leads-YYYYMMDD-HHmm.json + .csv
        │
        └── Mission Control API
            └── POST /api/tasks (Lead als Backlog-Task)
```

---

## Zielbranchen

| ID | Branche | Regionen | Prio |
|----|---------|---------|------|
| `forst` | Forstbetriebe | Bayern, BW, Hessen, NRW, Niedersachsen | 🔴 HIGH |
| `galabau` | GaLaBau | Bayern, NRW, BW, Hessen | 🔴 HIGH |
| `tiefbau` | Tiefbau | Bayern, NRW, BW | 🟡 MEDIUM |
| `agrar` | Agrar-Lohnunternehmen | Bayern, Niedersachsen, Sachsen-Anhalt | 🟡 MEDIUM |

---

## Verwendung

### Installation
```bash
cd /data/.openclaw/workspace/feldhub-base
pip install httpx asyncio
```

### Ausführen
```bash
# Standard: 2 Profile, 2 Regionen → ~20 Leads
python scripts/hunter-agent.py

# Erweitert: alle Profile, mehr Regionen
python scripts/hunter-agent.py --profiles 4 --regions 3

# Dry-Run (nur ausgeben)
python scripts/hunter-agent.py --dry-run
```

### Umgebungsvariablen
```bash
export PERPLEXITY_API_KEY="pplx-..."
export MC_API_KEY="mc_live_..."
```

---

## Lead-Datenstruktur

```json
{
  "id": "forst_Bayern_1",
  "profile": "forst",
  "region": "Bayern",
  "name": "Muster Forstbetrieb GmbH",
  "location": "Rosenheim, Bayern",
  "website": "https://example.de",
  "services": "Aufforstung, Holzeinschlag, Pflegemaßnahmen",
  "size": "15-30 Mitarbeiter",
  "status": "new",
  "discovered_at": "2026-03-31T10:00:00",
  "source": "perplexity_hunter"
}
```

---

## Output-Dateien

```
docs/research/
├── leads-20260331-1000.json   ← Alle Leads als JSON
└── leads-20260331-1000.csv    ← Alle Leads als CSV (für Excel/Sheets)
```

---

## Cron-Setup (wöchentlich)

```python
# Jeden Montag 08:00 Uhr neuen Hunter-Run starten
# → Cron in OpenClaw einrichten:
# payload.kind: "agentTurn"
# message: "Starte Hunter-Agent: python scripts/hunter-agent.py --profiles 2 --regions 2"
# schedule: { kind: "cron", expr: "0 8 * * 1", tz: "Europe/Berlin" }
```

---

## Qualitätsprüfung der Leads

Vor Kontaktaufnahme manuell prüfen:
- [ ] Existiert das Unternehmen tatsächlich?
- [ ] Stimmt die Mitarbeiterzahl?
- [ ] Website vorhanden und aktuell?
- [ ] Digitalisierungsgrad erkennbar? (kein "Wir haben bereits eine App")
- [ ] Richtige Ansprechperson identifiziert (GF/Betriebsleiter)

→ Qualifizierte Leads: Status auf `qualified` setzen in MC

---

## Erweiterungs-Ideen

| Feature | Aufwand | Prio |
|---------|--------|------|
| LinkedIn-Profile ergänzen | M | 🟡 |
| E-Mail-Adresse finden (Hunter.io API) | M | 🟡 |
| Automatische Duplikat-Erkennung | S | 🟡 |
| Scoring-Algorithmus (Fit-Score) | L | 🟢 |
| Website-Crawl auf Digitalisierungsgrad | L | 🟢 |

---

*Dokument erstellt im Sprint JL — Feldhub Sprint Loop*
