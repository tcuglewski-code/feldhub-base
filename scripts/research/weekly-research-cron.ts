#!/usr/bin/env tsx
/**
 * Feldhub Weekly Research Cron
 * Nutzt Perplexity Sonar Pro für wöchentliche Branchennews
 *
 * Sprint JC | 30.03.2026
 *
 * Ausführung: tsx scripts/research/weekly-research-cron.ts
 * Oder via OpenClaw Cron (jeden Montag 07:00)
 */

import * as fs from 'fs';
import * as path from 'path';

// ─── Config ──────────────────────────────────────────────────────────────────

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY ?? '';
const PERPLEXITY_MODEL = 'sonar-pro';
const OUTPUT_DIR = path.join(process.cwd(), 'docs', 'research');
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

// ─── Research-Themen ─────────────────────────────────────────────────────────

const RESEARCH_TOPICS: ResearchTopic[] = [
  {
    id: 'forstbetriebe',
    title: 'Forstbetriebe & Aufforstung',
    query:
      'Aktuelle Nachrichten Forstbetriebe Digitalisierung Außendienst Software Deutschland 2026. ' +
      'Trends, neue Gesetze, Förderprogramme, Technologie-Adoption.',
    tags: ['Forst', 'Aufforstung', 'Koch Aufforstung'],
  },
  {
    id: 'aussendienst-software',
    title: 'Außendienst-Software Markt',
    query:
      'Field Service Management Software Markt Deutschland Österreich Schweiz 2026. ' +
      'Neue Anbieter, Marktveränderungen, Wettbewerber-News, Preisänderungen.',
    tags: ['FSM', 'Software', 'Markt'],
  },
  {
    id: 'kmu-digitalisierung',
    title: 'KMU Digitalisierung',
    query:
      'KMU Digitalisierung Deutschland 2026 aktuelle News. ' +
      'Förderprogramme, Herausforderungen, Best Practices, Statistiken.',
    tags: ['KMU', 'Digitalisierung', 'Förderung'],
  },
  {
    id: 'ki-agenten',
    title: 'KI-Agenten & Automatisierung',
    query:
      'KI Agenten Automatisierung Außendienst Handwerk Bau Agrar Deutschland 2026. ' +
      'Praxisbeispiele, neue Tools, Akzeptanz in Handwerksbetrieben.',
    tags: ['KI', 'Automatisierung', 'Agenten'],
  },
  {
    id: 'wettbewerber',
    title: 'Wettbewerber Updates',
    query:
      'Zutec Samsara FieldPulse ServiceM8 Comarch FSM neue Features Preisänderungen Deutschland 2026. ' +
      'Competitor news Field Service Management.',
    tags: ['Wettbewerber', 'Marktbeobachtung'],
  },
];

// ─── Types ───────────────────────────────────────────────────────────────────

interface ResearchTopic {
  id: string;
  title: string;
  query: string;
  tags: string[];
}

interface ResearchResult {
  topic: ResearchTopic;
  content: string;
  citations: string[];
  timestamp: string;
}

interface WeeklyReport {
  week: string; // ISO: YYYY-Www
  date: string;
  results: ResearchResult[];
  summary: string;
  actionItems: string[];
}

// ─── Perplexity API ──────────────────────────────────────────────────────────

async function queryPerplexity(query: string, retries = MAX_RETRIES): Promise<{ content: string; citations: string[] }> {
  if (!PERPLEXITY_API_KEY) {
    throw new Error('PERPLEXITY_API_KEY nicht gesetzt');
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: PERPLEXITY_MODEL,
          messages: [
            {
              role: 'system',
              content:
                'Du bist ein Research-Assistent für Feldhub, ein SaaS-Unternehmen für KMU-Digitalisierung im Außendienst. ' +
                'Antworte auf Deutsch. Fasse die wichtigsten Neuigkeiten präzise zusammen. ' +
                'Priorisiere: Aktuelle News > Trends > Analysen. ' +
                'Format: Bullet Points, max. 500 Wörter.',
            },
            {
              role: 'user',
              content: query,
            },
          ],
          max_tokens: 800,
          temperature: 0.2,
          return_citations: true,
          return_images: false,
          search_recency_filter: 'week',
        }),
      });

      if (response.status === 429) {
        console.warn(`[Research] Rate limit hit, warte ${RETRY_DELAY_MS * attempt}ms...`);
        await delay(RETRY_DELAY_MS * attempt);
        continue;
      }

      if (!response.ok) {
        throw new Error(`Perplexity API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content ?? '';
      const citations = data.citations ?? [];

      return { content, citations };
    } catch (err) {
      if (attempt === retries) throw err;
      console.warn(`[Research] Attempt ${attempt} failed, retry...`);
      await delay(RETRY_DELAY_MS);
    }
  }

  throw new Error('Max retries reached');
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getISOWeek(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

// ─── Report Generator ────────────────────────────────────────────────────────

function buildMarkdownReport(report: WeeklyReport): string {
  const lines: string[] = [
    `# Feldhub Weekly Research Report`,
    `## KW ${report.week} — ${report.date}`,
    ``,
    `> Automatisch generiert von weekly-research-cron.ts via Perplexity Sonar Pro`,
    `> Zweck: Branchennews, Wettbewerber-Monitoring, Content-Ideen für Marketing`,
    ``,
    `---`,
    ``,
    `## 📌 Zusammenfassung`,
    ``,
    report.summary,
    ``,
    `---`,
    ``,
    `## 🎯 Action Items`,
    ``,
    ...report.actionItems.map((item) => `- [ ] ${item}`),
    ``,
    `---`,
    ``,
  ];

  for (const result of report.results) {
    lines.push(`## 🔍 ${result.topic.title}`);
    lines.push(`Tags: ${result.topic.tags.map((t) => `\`${t}\``).join(' ')}`);
    lines.push(``);
    lines.push(result.content);
    lines.push(``);

    if (result.citations.length > 0) {
      lines.push(`**Quellen:**`);
      result.citations.slice(0, 5).forEach((url, i) => {
        lines.push(`${i + 1}. ${url}`);
      });
    }

    lines.push(``, `---`, ``);
  }

  return lines.join('\n');
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('[Research Cron] Start — Feldhub Weekly Research');

  const now = new Date();
  const week = getISOWeek(now);
  const dateStr = now.toISOString().split('T')[0];

  // Output-Datei
  const outputFile = path.join(OUTPUT_DIR, `${week}.md`);

  // Skip wenn bereits vorhanden
  if (fs.existsSync(outputFile)) {
    console.log(`[Research Cron] ${week}.md bereits vorhanden, skip.`);
    process.exit(0);
  }

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const results: ResearchResult[] = [];

  for (const topic of RESEARCH_TOPICS) {
    console.log(`[Research] Query: ${topic.title}...`);

    try {
      const { content, citations } = await queryPerplexity(topic.query);
      results.push({
        topic,
        content,
        citations,
        timestamp: new Date().toISOString(),
      });
      console.log(`[Research] ✓ ${topic.title} (${content.length} Zeichen)`);
    } catch (err) {
      console.error(`[Research] ✗ ${topic.title}: ${err}`);
      results.push({
        topic,
        content: `❌ Fehler bei der Abfrage: ${err instanceof Error ? err.message : String(err)}`,
        citations: [],
        timestamp: new Date().toISOString(),
      });
    }

    // Rate limiting zwischen Anfragen
    await delay(1500);
  }

  // Summary generieren (optional zweite Perplexity-Anfrage)
  const summary = `Wöchentlicher Überblick für KW ${week}. ${results.length} Themen recherchiert. Details in den Sektionen unten.`;

  const actionItems = [
    'LinkedIn-Posts für nächste Woche aus News ableiten',
    'Wettbewerber-Updates in WETTBEWERBER-ANALYSE.md pflegen',
    'Förderungen prüfen → Sylvia-Agent informieren',
    'Relevante News an Tomek weiterleiten',
  ];

  const report: WeeklyReport = {
    week,
    date: dateStr,
    results,
    summary,
    actionItems,
  };

  const markdown = buildMarkdownReport(report);
  fs.writeFileSync(outputFile, markdown, 'utf-8');

  console.log(`[Research Cron] ✅ Report gespeichert: ${outputFile}`);
  console.log(`[Research Cron] ${results.length}/${RESEARCH_TOPICS.length} Themen erfolgreich`);
}

main().catch((err) => {
  console.error('[Research Cron] Fatal:', err);
  process.exit(1);
});
