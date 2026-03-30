# LLM Cost Dashboard — Feldhub Agenten-Kostenkontrolle

> Sprint JD | Stand: März 2026

## Überblick

Dieses Dokument beschreibt das System zur Erfassung, Visualisierung und Optimierung der LLM-API-Kosten aller Feldhub-Agenten. Kosten sind ein kritischer Faktor im SaaS-Modell — transparente Tracking-Systeme ermöglichen fundierte Entscheidungen über Modell-Wahl, Prompt-Optimierung und Budget-Allokation.

---

## 1. Kostenstruktur (März 2026)

### Preisübersicht der genutzten Modelle

| Modell | Input ($/M Tokens) | Output ($/M Tokens) | Cached Input |
|--------|-------------------|---------------------|--------------|
| claude-opus-4-5 | $15.00 | $75.00 | $1.50 |
| claude-sonnet-4-6 | $3.00 | $15.00 | $0.30 |
| claude-haiku-4-5 | $0.25 | $1.25 | $0.03 |
| perplexity/sonar-pro | $3.00 | $15.00 | — |
| perplexity/sonar-deep-research | $2.00 | $8.00 | — |

### Agenten-Modell-Matrix (Feldhub Team)

| Agent | Rolle | Modell | Ø Tokens/Tag | Ø Kosten/Tag |
|-------|-------|--------|--------------|--------------|
| Amadeus | Orchestrator | opus-4-5 | ~50k | ~$3.75 |
| Volt | Frontend Dev | sonnet-4-6 | ~80k | ~$0.96 |
| Bruno | WP/Backend Dev | sonnet-4-6 | ~60k | ~$0.72 |
| Nomad | App Dev | opus-4-5 | ~40k | ~$3.00 |
| Archie | DB Architekt | opus-4-5 | ~30k | ~$2.25 |
| Argus | QA/Security | opus-4-5 | ~20k | ~$1.50 |
| Quill | Copywriter | haiku-4-5 | ~100k | ~$0.13 |
| Pixel | Designer | haiku-4-5 | ~30k | ~$0.04 |
| Sylvia | Förder-Intel | sonnet-4-6 | ~50k | ~$0.60 |
| Perplexity Cron | Research | sonar-pro | ~20k | ~$0.18 |
| **Gesamt** | | | **~480k** | **~$13.13** |

**Monatlich:** ca. **$394/Monat** (30 Tage Basis)
**Jährlich:** ca. **$4.728/Jahr**

---

## 2. Mission Control Integration

### API Endpoint (bereits vorhanden)

```
POST https://mission-control-tawny-omega.vercel.app/api/ai/usage
Header: x-amadeus-token: AmadeusLoop2026!xK9mP
```

### Payload Schema

```typescript
interface AIUsageLog {
  agent: string;          // 'amadeus' | 'volt' | 'bruno' | ...
  model: string;          // 'claude-opus-4-5' | ...
  task: string;           // Sprint-Code oder Task-Beschreibung
  inputTokens: number;
  outputTokens: number;
  cachedTokens?: number;
  costUsd: number;        // Berechnet nach Preistabelle oben
  timestamp: string;      // ISO 8601
  sessionId?: string;
}
```

### Hilfsfunktion zur Kostenkalkulation

```typescript
// src/lib/llm-cost-tracker.ts

export const MODEL_PRICING = {
  'claude-opus-4-5': {
    inputPerM: 15.00,
    outputPerM: 75.00,
    cachedPerM: 1.50,
  },
  'claude-sonnet-4-6': {
    inputPerM: 3.00,
    outputPerM: 15.00,
    cachedPerM: 0.30,
  },
  'claude-haiku-4-5': {
    inputPerM: 0.25,
    outputPerM: 1.25,
    cachedPerM: 0.03,
  },
  'perplexity/sonar-pro': {
    inputPerM: 3.00,
    outputPerM: 15.00,
    cachedPerM: 0,
  },
  'perplexity/sonar-deep-research': {
    inputPerM: 2.00,
    outputPerM: 8.00,
    cachedPerM: 0,
  },
} as const;

export type ModelId = keyof typeof MODEL_PRICING;

export function calculateCost(
  model: ModelId,
  inputTokens: number,
  outputTokens: number,
  cachedTokens = 0
): number {
  const pricing = MODEL_PRICING[model];
  if (!pricing) return 0;

  const inputCost = (inputTokens / 1_000_000) * pricing.inputPerM;
  const outputCost = (outputTokens / 1_000_000) * pricing.outputPerM;
  const cachedCost = (cachedTokens / 1_000_000) * pricing.cachedPerM;

  return Number((inputCost + outputCost + cachedCost).toFixed(6));
}

export async function logUsage(
  params: Omit<AIUsageLog, 'timestamp'>
): Promise<void> {
  const payload = {
    ...params,
    timestamp: new Date().toISOString(),
  };

  try {
    await fetch('https://mission-control-tawny-omega.vercel.app/api/ai/usage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-amadeus-token': process.env.AMADEUS_TOKEN ?? '',
      },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.error('[LLM Cost Tracker] Logging failed:', err);
  }
}
```

---

## 3. Dashboard Visualisierung

### Empfohlene Ansichten in Mission Control

```
/dashboard/llm-costs
├── Übersicht (30/7/1 Tage)
│   ├── Gesamtkosten (€ / $)
│   ├── Top-3 teuerste Agenten
│   └── Monatliche Prognose
├── Pro Agent
│   ├── Input vs. Output Token-Ratio
│   ├── Kosten-Timeline
│   └── Durchschnitt pro Task
└── Optimierungspotenzial
    ├── Tasks die Opus nutzen aber Sonnet reichen würden
    ├── Token-Reduktion durch Prompt-Optimierung
    └── Cache-Hit-Rate
```

### Schwellenwerte für Alerting

| Alert | Trigger | Aktion |
|-------|---------|--------|
| Daily Budget | > $20/Tag | Amadeus benachrichtigen |
| Agent Spike | +200% vs. 7-Tage-Avg | Prüfen ob Loop hängt |
| Monthly Budget | > $500/Monat | Review mit Tomek |
| Model Downgrade Kandidat | Opus-Task < 2k Tokens | Auf Sonnet wechseln |

---

## 4. Optimierungsstrategie

### Schnell-Wins (sofort umsetzbar)

1. **Haiku für einfache Texte**: Quill, Pixel → ✅ bereits Haiku
2. **Prompt Caching aktivieren**: Lange System-Prompts cachen → -90% Kosten für cached
3. **Sonnet vor Opus prüfen**: Bei <5k Token Tasks genügt meist Sonnet
4. **Heartbeat-Optimierung**: Kürzere Heartbeat-Prompts = weniger Input-Tokens

### Mittelfristig

5. **Context-Window-Trimming**: Alte Session-History nicht mit übergeben
6. **Batch-Processing**: Mehrere kleine Tasks in einem API-Call bündeln
7. **Local Distillation**: Häufig wiederholte einfache Tasks → Fine-Tuned kleineres Modell

### ROI-Betrachtung

```
Monatliche LLM-Kosten:     ~$394
Gespartes Entwickler-Zeit: ~40h × $80 = $3.200
ROI:                        811% pro Monat
Break-Even Aufwand:         ~5 Stunden Entwicklerzeit/Monat
```

---

## 5. Budget-Planung nach Kundenwachstum

| Kunden | Agenten-Aktivität | Geschätzte LLM-Kosten/Monat |
|--------|------------------|----------------------------|
| 1 (Jetzt) | Normal | ~$394 |
| 3 | +150% | ~$985 |
| 5 | +200% | ~$1.575 |
| 10 | +300% | ~$3.150 |

→ LLM-Kosten müssen in SaaS-Preis einkalkuliert werden: **+$50-150/Monat pro Tenant** je nach Aktivität.

---

## 6. Nächste Schritte

- [ ] MC Dashboard `/dashboard/llm-costs` implementieren (Volt-Task)
- [ ] `logUsage()` in alle Agenten-Sessions integrieren
- [ ] Wöchentlichen Cost-Report-Cron einrichten
- [ ] Stripe-Budget-Alerts konfigurieren (wenn Stripe live)
