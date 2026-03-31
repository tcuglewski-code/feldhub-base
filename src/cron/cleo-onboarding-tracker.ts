/**
 * Feldhub — Cleo-Agent: Onboarding-Fortschritt Tracker
 * 
 * Täglich um 09:00 Uhr automatische Analyse des Onboarding-Fortschritts.
 * Meldet Meilensteine via Mission Control Notifications.
 * 
 * Cron: 0 9 * * * (täglich 09:00)
 * 
 * Mission Control API: POST /api/cleo/analyze
 */

import type { TenantConfig } from '../config/tenant';

// =============================================================================
// KONFIGURATION
// =============================================================================

const MC_API_BASE = process.env.MISSION_CONTROL_URL ?? 'https://mission-control-tawny-omega.vercel.app';
const MC_API_KEY = process.env.MC_API_KEY ?? '';

// =============================================================================
// TYPEN
// =============================================================================

interface CleoAnalyseErgebnis {
  erfolg: boolean;
  analyse: {
    erkannteSchritte: string[];
    anzahl: number;
    gesamt: number;
  };
  score: {
    score: number;
    maxScore: number;
    prozent: number;
  };
  meilensteine: string[];
  naechsteSchritte: Array<{ id: string; label: string; phase: number }>;
}

interface CleoStatus {
  prozent: number;
  aktuellePhase: number;
  offeneSchritte: Array<{ id: string; label: string; phase: number }>;
}

// =============================================================================
// CLEO TRACKER
// =============================================================================

export class CleoOnboardingTracker {
  private readonly tenantId: string;
  private readonly apiBase: string;
  private readonly apiKey: string;

  constructor(tenant: TenantConfig, apiBase = MC_API_BASE, apiKey = MC_API_KEY) {
    this.tenantId = tenant.id;
    this.apiBase = apiBase;
    this.apiKey = apiKey;
  }

  /**
   * Aktuellen Onboarding-Status abrufen
   */
  async getStatus(): Promise<CleoStatus | null> {
    try {
      const res = await fetch(`${this.apiBase}/api/cleo`, {
        headers: {
          'x-mc-api-key': this.apiKey,
          'x-tenant-id': this.tenantId,
        },
      });
      if (!res.ok) return null;
      return res.json();
    } catch {
      return null;
    }
  }

  /**
   * Automatische Analyse ausführen
   */
  async analyzeProgress(): Promise<CleoAnalyseErgebnis | null> {
    try {
      const res = await fetch(`${this.apiBase}/api/cleo/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-mc-api-key': this.apiKey,
          'x-tenant-id': this.tenantId,
        },
        body: JSON.stringify({ tenantId: this.tenantId }),
      });
      if (!res.ok) return null;
      return res.json();
    } catch {
      return null;
    }
  }

  /**
   * Einzelnen Schritt als erledigt markieren
   */
  async markStepComplete(stepId: string): Promise<boolean> {
    try {
      const res = await fetch(`${this.apiBase}/api/cleo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-mc-api-key': this.apiKey,
          'x-tenant-id': this.tenantId,
        },
        body: JSON.stringify({ stepId, erledigt: true }),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  /**
   * Cron-Job Haupt-Funktion
   */
  async run(): Promise<void> {
    console.log(`[Cleo] Starte Onboarding-Analyse für Tenant: ${this.tenantId}`);
    
    const ergebnis = await this.analyzeProgress();
    if (!ergebnis) {
      console.error('[Cleo] Analyse fehlgeschlagen');
      return;
    }

    const { score, meilensteine, naechsteSchritte } = ergebnis;
    
    console.log(`[Cleo] Fortschritt: ${score.prozent}% (${score.score}/${score.maxScore})`);
    console.log(`[Cleo] Erkannte Schritte: ${ergebnis.analyse.erkannteSchritte.join(', ')}`);

    if (meilensteine.length > 0) {
      console.log(`[Cleo] 🎯 Meilensteine: ${meilensteine.join(' | ')}`);
    }

    if (naechsteSchritte.length > 0) {
      console.log('[Cleo] ⏭️ Nächste Schritte:');
      naechsteSchritte.forEach(s => {
        console.log(`  - Phase ${s.phase}: ${s.label}`);
      });
    }

    if (score.prozent >= 100) {
      console.log('[Cleo] 🎉 Onboarding vollständig abgeschlossen!');
    }
  }
}

// =============================================================================
// CRON-ENTRY-POINT
// =============================================================================

/**
 * Wird von OpenClaw-Cron aufgerufen
 * Cron-Schedule: 0 9 * * * (täglich 09:00)
 */
export async function runCleoDaily(tenantConfig: TenantConfig): Promise<void> {
  const cleo = new CleoOnboardingTracker(tenantConfig);
  await cleo.run();
}

// =============================================================================
// CLEO-AGENT KONZEPT
// =============================================================================

/**
 * Cleo ist der "Onboarding-Assistent" von Feldhub.
 * 
 * ## Was Cleo macht:
 * 
 * 1. **Automatisch erkennen:** Analysiert täglich welche Schritte ein
 *    neuer Tenant abgeschlossen hat (Mitarbeiter angelegt? Aufträge erstellt?)
 * 
 * 2. **Fortschritt tracken:** Berechnet Onboarding-Score (0-100%)
 *    in 5 Phasen (Setup → Stammdaten → Erste Nutzung → Integration → Routine)
 * 
 * 3. **Meilensteine feiern:** Benachrichtigt bei 50%, 80%, 100% Abschluss
 * 
 * 4. **Empfehlungen geben:** Zeigt die nächsten 3 offenen Schritte
 * 
 * ## Integration in feldhub-base:
 * 
 * ```typescript
 * import { CleoOnboardingTracker } from '@/cron/cleo-onboarding-tracker';
 * import { currentTenant } from '@/config/tenant';
 * 
 * // In einem Server-Action oder API-Route:
 * const cleo = new CleoOnboardingTracker(currentTenant);
 * const status = await cleo.getStatus();
 * 
 * // Im Dashboard anzeigen:
 * if (status && status.prozent < 100) {
 *   return <OnboardingBanner prozent={status.prozent} />;
 * }
 * ```
 * 
 * ## Verwendung in Next.js Cron-Route:
 * 
 * ```typescript
 * // app/api/cron/cleo/route.ts
 * export async function POST(req: NextRequest) {
 *   const { searchParams } = new URL(req.url);
 *   if (searchParams.get('secret') !== process.env.CRON_SECRET) {
 *     return Response.json({ error: 'Unauthorized' }, { status: 401 });
 *   }
 *   
 *   const tenant = getTenantConfig();
 *   await runCleoDaily(tenant);
 *   
 *   return Response.json({ success: true });
 * }
 * ```
 */
