# Feldhub Research Archive

> Automatisch generierte Wochenberichte via Perplexity Sonar Pro

## Übersicht

Jede Woche (Montag 07:00) läuft `scripts/research/weekly-research-cron.ts` und erstellt eine neue Datei `YYYY-Www.md` in diesem Ordner.

## Themen (wöchentlich recherchiert)

1. **Forstbetriebe & Aufforstung** — News, Gesetze, Förderprogramme
2. **Außendienst-Software Markt** — Wettbewerber, Preisänderungen, neue Anbieter
3. **KMU Digitalisierung** — Trends, Statistiken, Best Practices DE/AT/CH
4. **KI-Agenten & Automatisierung** — Praxisbeispiele im Handwerk/Bau/Agrar
5. **Wettbewerber Updates** — Zutec, Samsara, FieldPulse, ServiceM8, Comarch

## Setup (OpenClaw Cron)

```
Cron-Schedule: Jeden Montag 07:00 Europe/Berlin
Payload: systemEvent → Amadeus Research-Cron starten
Script: tsx scripts/research/weekly-research-cron.ts
Env: PERPLEXITY_API_KEY (in TOOLS.md)
```

## Verwendung der Reports

- **Marketing:** Basis für LinkedIn-Posts + Blog-Artikel
- **Sales:** Wettbewerber-Argumente aktuell halten
- **Produkt:** Markt-Signale für Feature-Priorisierung
- **Sylvia-Agent:** Förderungs-Updates weitergeben

## Dateien

- `README.md` — Diese Datei
- `YYYY-Www.md` — Wochenbericht (auto-generiert)
