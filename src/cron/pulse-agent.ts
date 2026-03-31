/**
 * Pulse-Agent — Social Media Scheduling
 * Sprint KA | 31.03.2026
 *
 * Automatisches Social Media Scheduling für Feldhub:
 * - LinkedIn Posts aus Content-Plan (LINKEDIN-CONTENT-PLAN.md)
 * - KI-generierte Varianten via Claude
 * - Scheduling Queue mit Status-Tracking in Mission Control
 * - Plausible-Events für Performance-Tracking
 *
 * Cron: täglich 08:00 → prüft Queue, postet fällige Beiträge
 */

import Anthropic from '@anthropic-ai/sdk';
import { MC_BASE_URL, MC_API_KEY, PLAUSIBLE_DOMAIN } from '@/config/env';

// ─── Types ──────────────────────────────────────────────────────────────────

export type Platform = 'linkedin' | 'twitter' | 'instagram';
export type PostStatus = 'scheduled' | 'posted' | 'failed' | 'draft';

export interface SocialPost {
  id: string;
  platform: Platform;
  content: string;
  scheduledAt: Date;
  status: PostStatus;
  tags: string[];
  campaignId?: string;
  postedAt?: Date;
  engagementScore?: number;
  errorMessage?: string;
}

export interface PulseQueue {
  posts: SocialPost[];
  lastRunAt: Date | null;
  totalPosted: number;
  totalFailed: number;
}

export interface ContentBrief {
  topic: string;
  targetAudience: string;
  tone: 'professional' | 'casual' | 'educational' | 'inspiring';
  platform: Platform;
  includeHashtags: boolean;
  maxLength?: number;
  cta?: string;
}

export interface PulseAgentResult {
  runAt: Date;
  postsChecked: number;
  postsScheduled: number;
  draftGenerated: number;
  errors: string[];
  mcTaskId?: string;
}

// ─── Content Templates ───────────────────────────────────────────────────────

/**
 * Basis-Content-Briefs für LinkedIn aus dem Content-Plan (Sprint IZ)
 * 3 Posts/Woche für Apr–Jun 2026
 */
export const CONTENT_CALENDAR: Omit<ContentBrief, 'scheduledAt'>[] = [
  {
    topic: 'Digitalisierung im Außendienst — Praxisbericht Koch Aufforstung',
    targetAudience: 'Forstbetriebe, Landwirte, KMU im Außendienst',
    tone: 'educational',
    platform: 'linkedin',
    includeHashtags: true,
    maxLength: 1300,
    cta: 'Case Study lesen: feldhub.de/case-study-koch-aufforstung',
  },
  {
    topic: 'KI-Agenten in der Softwareentwicklung — Amadeus-Erfahrungsbericht',
    targetAudience: 'Tech-Entscheider, CTOs, Startup-Gründer',
    tone: 'professional',
    platform: 'linkedin',
    includeHashtags: true,
    maxLength: 1300,
    cta: 'Mehr erfahren: feldhub.de/blog',
  },
  {
    topic: '5 Anzeichen, dass dein Außendienst-Betrieb digitalisierungsreif ist',
    targetAudience: 'Handwerksbetriebe, Servicetechniker, Landschaftsgärtner',
    tone: 'inspiring',
    platform: 'linkedin',
    includeHashtags: true,
    maxLength: 1300,
    cta: 'ROI berechnen: feldhub.de/roi',
  },
  {
    topic: 'White-Label SaaS für Außendienst — Feldhub erklärt',
    targetAudience: 'Software-Reseller, IT-Dienstleister, Branchenverbände',
    tone: 'professional',
    platform: 'linkedin',
    includeHashtags: true,
    maxLength: 1300,
    cta: 'Partner werden: feldhub.de/partner',
  },
];

const LINKEDIN_HASHTAGS: Record<string, string[]> = {
  digitalisierung: ['#Digitalisierung', '#KMU', '#Außendienst', '#FieldService'],
  ki: ['#KI', '#AIAgents', '#Feldhub', '#SaaS'],
  forstmanager: ['#Forstwirtschaft', '#Agrar', '#Feldhub', '#DigitalerWandel'],
  sales: ['#B2BSaaS', '#SaaS', '#Sales', '#Growth'],
};

// ─── AI Post Generator ───────────────────────────────────────────────────────

/**
 * Generiert einen LinkedIn-Post via Claude aus einem Content-Brief
 */
export async function generatePost(brief: ContentBrief): Promise<string> {
  const client = new Anthropic();

  const toneInstructions: Record<ContentBrief['tone'], string> = {
    professional: 'Professionell und sachlich, mit konkreten Zahlen und Fakten.',
    casual: 'Locker und persönlich, direkte Ansprache (du/Sie).',
    educational: 'Lehrreich mit klaren Takeaways, strukturiert mit 2-3 Punkten.',
    inspiring: 'Motivierend und zukunftsorientiert, weckt Neugierde.',
  };

  const prompt = `
Du schreibst einen LinkedIn-Post für Feldhub — ein SaaS-Unternehmen für digitale Betriebssysteme im Außendienst.

**Thema:** ${brief.topic}
**Zielgruppe:** ${brief.targetAudience}
**Ton:** ${toneInstructions[brief.tone]}
**Plattform:** ${brief.platform}
**Max. Länge:** ${brief.maxLength ?? 1300} Zeichen
**CTA:** ${brief.cta ?? 'Keine'}

Anforderungen:
- Beginne mit einem starken Hook (1 Satz, Frage oder provokante Aussage)
- 3-4 kurze Absätze
- Konkrete Beispiele oder Zahlen wenn möglich
- Authentisch, kein Werbejargon
${brief.includeHashtags ? '- 3-5 relevante Hashtags am Ende' : ''}
- Kein "Ich freue mich..." am Anfang

Schreibe nur den Post-Text, keine Erklärungen.
  `.trim();

  const response = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 600,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content[0];
  if (text.type !== 'text') throw new Error('Unexpected response type from Claude');
  return text.text.trim();
}

// ─── Queue Manager ───────────────────────────────────────────────────────────

/**
 * Lädt aktuelle Scheduling-Queue aus Mission Control
 */
export async function loadQueue(): Promise<PulseQueue> {
  try {
    const res = await fetch(`${MC_BASE_URL}/api/pulse/queue`, {
      headers: {
        'x-api-key': MC_API_KEY,
        'Content-Type': 'application/json',
      },
    });
    if (!res.ok) throw new Error(`MC API ${res.status}`);
    return await res.json();
  } catch {
    // Fallback: leere Queue
    return {
      posts: [],
      lastRunAt: null,
      totalPosted: 0,
      totalFailed: 0,
    };
  }
}

/**
 * Speichert Post-Status in Mission Control
 */
export async function updatePostStatus(
  postId: string,
  status: PostStatus,
  meta?: { postedAt?: Date; errorMessage?: string }
): Promise<void> {
  await fetch(`${MC_BASE_URL}/api/pulse/posts/${postId}`, {
    method: 'PATCH',
    headers: {
      'x-api-key': MC_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status, ...meta }),
  });
}

/**
 * Erstellt einen MC-Task für fehlgeschlagene Posts
 */
async function createFailureTask(post: SocialPost, error: string): Promise<void> {
  await fetch(`${MC_BASE_URL}/api/tasks`, {
    method: 'POST',
    headers: {
      'x-api-key': MC_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: `🔴 Pulse-Agent: Post fehlgeschlagen (${post.platform})`,
      description: `Post ID: ${post.id}\nFehler: ${error}\nContent: ${post.content.substring(0, 100)}...`,
      priority: 'high',
      source: 'pulse-agent',
      tags: ['social-media', 'fehler', post.platform],
    }),
  });
}

// ─── Scheduler ──────────────────────────────────────────────────────────────

/**
 * Simulierter LinkedIn-Post (echte API: LinkedIn API v2 / Buffer / Hootsuite)
 * In Produktion: Buffer API oder LinkedIn API v2 verwenden
 */
async function postToLinkedIn(content: string): Promise<{ success: boolean; postId?: string }> {
  // TODO: Echte LinkedIn API v2 Integration
  // POST https://api.linkedin.com/v2/ugcPosts
  // Authorization: Bearer {LINKEDIN_ACCESS_TOKEN}

  console.log('[Pulse-Agent] LinkedIn Post (simuliert):', content.substring(0, 80) + '...');

  // Simulation: immer erfolgreich in dev
  return {
    success: true,
    postId: `sim_${Date.now()}`,
  };
}

/**
 * Trackt Post-Performance via Plausible Custom Events
 */
async function trackPostEvent(platform: Platform, status: 'posted' | 'failed'): Promise<void> {
  try {
    await fetch('https://plausible.io/api/event', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Feldhub-PulseAgent/1.0',
      },
      body: JSON.stringify({
        name: 'social_post',
        url: `https://feldhub.de/internal/pulse`,
        domain: PLAUSIBLE_DOMAIN ?? 'feldhub.de',
        props: { platform, status },
      }),
    });
  } catch {
    // Plausible-Fehler ignorieren
  }
}

// ─── Main Run ────────────────────────────────────────────────────────────────

/**
 * Haupt-Funktion: Wird täglich um 08:00 via Cron aufgerufen
 *
 * Ablauf:
 * 1. Queue laden (fällige Posts für heute)
 * 2. Für jeden fälligen Post: Plattform-spezifisch posten
 * 3. Status in MC aktualisieren
 * 4. Neue Drafts für die nächsten 7 Tage generieren (falls < 3 in Queue)
 * 5. Report-Summary zurückgeben
 */
export async function runPulseAgent(): Promise<PulseAgentResult> {
  const runAt = new Date();
  const result: PulseAgentResult = {
    runAt,
    postsChecked: 0,
    postsScheduled: 0,
    draftGenerated: 0,
    errors: [],
  };

  console.log(`[Pulse-Agent] Start: ${runAt.toISOString()}`);

  // 1. Queue laden
  const queue = await loadQueue();
  const now = new Date();

  // 2. Fällige Posts verarbeiten
  const duePosts = queue.posts.filter(
    (p) => p.status === 'scheduled' && new Date(p.scheduledAt) <= now
  );

  result.postsChecked = duePosts.length;

  for (const post of duePosts) {
    try {
      let success = false;

      if (post.platform === 'linkedin') {
        const res = await postToLinkedIn(post.content);
        success = res.success;
      }
      // TODO: Twitter/Instagram analog

      if (success) {
        await updatePostStatus(post.id, 'posted', { postedAt: new Date() });
        await trackPostEvent(post.platform, 'posted');
        result.postsScheduled++;
        console.log(`[Pulse-Agent] ✅ Posted: ${post.id} (${post.platform})`);
      } else {
        throw new Error('Post API returned failure');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unbekannter Fehler';
      await updatePostStatus(post.id, 'failed', { errorMessage: errorMsg });
      await trackPostEvent(post.platform, 'failed');
      await createFailureTask(post, errorMsg);
      result.errors.push(`Post ${post.id}: ${errorMsg}`);
      console.error(`[Pulse-Agent] ❌ Failed: ${post.id} — ${errorMsg}`);
    }
  }

  // 3. Neue Drafts generieren wenn Queue < 3 Posts für nächste 7 Tage
  const upcomingPosts = queue.posts.filter(
    (p) => p.status === 'scheduled' && new Date(p.scheduledAt) > now
  );

  if (upcomingPosts.length < 3) {
    const briefsToGenerate = CONTENT_CALENDAR.slice(0, 3 - upcomingPosts.length);

    for (const brief of briefsToGenerate) {
      try {
        const content = await generatePost(brief);

        // Draft in MC speichern
        await fetch(`${MC_BASE_URL}/api/pulse/posts`, {
          method: 'POST',
          headers: {
            'x-api-key': MC_API_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            platform: brief.platform,
            content,
            status: 'draft',
            tags: ['ki-generiert', brief.platform],
            scheduledAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // +3 Tage
          }),
        });

        result.draftGenerated++;
        console.log(`[Pulse-Agent] 📝 Draft generiert: ${brief.topic.substring(0, 50)}...`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Draft-Generierung fehlgeschlagen';
        result.errors.push(`Draft: ${msg}`);
      }
    }
  }

  console.log(`[Pulse-Agent] Fertig. Posted: ${result.postsScheduled}, Drafts: ${result.draftGenerated}, Fehler: ${result.errors.length}`);
  return result;
}

// ─── CLI Entry ───────────────────────────────────────────────────────────────

if (require.main === module) {
  runPulseAgent()
    .then((r) => {
      console.log('\n[Pulse-Agent] Summary:');
      console.log(JSON.stringify(r, null, 2));
      process.exit(0);
    })
    .catch((e) => {
      console.error('[Pulse-Agent] Fatal:', e);
      process.exit(1);
    });
}
