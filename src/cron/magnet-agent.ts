/**
 * Feldhub — Magnet-Agent: Lead Generation Monitoring
 * 
 * Magnet überwacht automatisch Lead-Quellen und meldet neue Interessenten
 * an Mission Control. Analysiert Website-Traffic, Formular-Eingaben
 * und CRM-Aktivitäten.
 * 
 * Cron: 0 8 * * * (täglich 08:00)
 * 
 * Mission Control Integration: POST /api/deals (Sales Pipeline)
 */

// =============================================================================
// TYPEN
// =============================================================================

export interface LeadQuelle {
  id: string;
  name: string;
  typ: 'website_form' | 'linkedin' | 'referral' | 'branchenverband' | 'cold_outreach' | 'sonstiges';
  url?: string;
  aktiv: boolean;
}

export interface Lead {
  name: string;
  email?: string;
  telefon?: string;
  firma?: string;
  branche?: string;
  quelle: string;
  nachricht?: string;
  interessen?: string[];
  erfasstAm: Date;
  status: LeadStatus;
  score?: number; // 0-100
}

export type LeadStatus = 'neu' | 'kontaktiert' | 'qualifiziert' | 'angebot' | 'gewonnen' | 'verloren';

export interface MagnetReport {
  periode: { von: Date; bis: Date };
  neueLeads: number;
  qualifizierteLeads: number;
  konversionsrate: number;
  quellenBest: string;
  topBranche: string;
  gesamtPipeline: number;
}

// =============================================================================
// LEAD-SCORING
// =============================================================================

/**
 * Berechnet einen Lead-Score basierend auf verfügbaren Informationen.
 * 0 = kaum qualifiziert, 100 = sehr vielversprechend
 */
export function berechneLeadScore(lead: Omit<Lead, 'score'>): number {
  let score = 0;

  // Vollständigkeit der Daten
  if (lead.email) score += 20;
  if (lead.telefon) score += 10;
  if (lead.firma) score += 15;
  if (lead.branche) score += 10;
  if (lead.nachricht && lead.nachricht.length > 50) score += 10;

  // Branchen-Priorisierung (nach Feldhub Branchen-Matrix)
  const priorisierte_branchen = {
    'forstwirtschaft': 25,
    'aufforstung': 25,
    'landschaftsbau': 20,
    'tiefbau': 15,
    'agrar': 15,
    'reinigung': 10,
    'handwerk': 10,
  };

  if (lead.branche) {
    const brancheLower = lead.branche.toLowerCase();
    for (const [branche, punkte] of Object.entries(priorisierte_branchen)) {
      if (brancheLower.includes(branche)) {
        score += punkte;
        break;
      }
    }
  }

  // Interesse (Nachrichten-Keywords)
  const keywords_hoch = ['demo', 'preis', 'angebot', 'software', 'digitalisierung'];
  const keywords_mittel = ['information', 'frage', 'interesse'];
  
  if (lead.nachricht) {
    const nachrichtLower = lead.nachricht.toLowerCase();
    if (keywords_hoch.some(k => nachrichtLower.includes(k))) score += 15;
    else if (keywords_mittel.some(k => nachrichtLower.includes(k))) score += 5;
  }

  return Math.min(score, 100);
}

// =============================================================================
// LEAD-QUALIFIZIERUNGS-KRITERIEN
// =============================================================================

export function isLeadQualifiziert(lead: Lead): boolean {
  const score = lead.score ?? berechneLeadScore(lead);
  return score >= 40 && !!lead.email;
}

// =============================================================================
// QUELLEN-TRACKING
// =============================================================================

export const STANDARD_LEAD_QUELLEN: LeadQuelle[] = [
  {
    id: 'website_main',
    name: 'Feldhub Website (Kontaktformular)',
    typ: 'website_form',
    url: 'https://feldhub.de/kontakt',
    aktiv: true,
  },
  {
    id: 'website_roi',
    name: 'ROI-Rechner Landing Page',
    typ: 'website_form',
    url: 'https://feldhub.de/roi-rechner',
    aktiv: true,
  },
  {
    id: 'website_ka_case',
    name: 'Koch Aufforstung Case Study',
    typ: 'website_form',
    url: 'https://feldhub.de/case-study',
    aktiv: true,
  },
  {
    id: 'linkedin',
    name: 'LinkedIn Company Page',
    typ: 'linkedin',
    url: 'https://linkedin.com/company/feldhub',
    aktiv: false, // Noch in Aufbau
  },
  {
    id: 'referral_ka',
    name: 'Empfehlung Koch Aufforstung',
    typ: 'referral',
    aktiv: true,
  },
  {
    id: 'bwv',
    name: 'Bayerischer Waldbesitzerverband',
    typ: 'branchenverband',
    aktiv: false, // Geplant
  },
];

// =============================================================================
// MAGNET-AGENT KLASSE
// =============================================================================

export class MagnetAgent {
  private readonly mcApiBase: string;
  private readonly mcApiKey: string;

  constructor(
    mcApiBase = process.env.MISSION_CONTROL_URL ?? 'https://mission-control-tawny-omega.vercel.app',
    mcApiKey = process.env.MC_API_KEY ?? ''
  ) {
    this.mcApiBase = mcApiBase;
    this.mcApiKey = mcApiKey;
  }

  /**
   * Neuen Lead erfassen + in Mission Control speichern
   */
  async erfasseLead(lead: Omit<Lead, 'score'>): Promise<{ erfolg: boolean; leadId?: string }> {
    const score = berechneLeadScore(lead);
    const vollständigerLead = { ...lead, score };

    // In Mission Control als Deal anlegen
    try {
      const res = await fetch(`${this.mcApiBase}/api/deals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-mc-api-key': this.mcApiKey,
        },
        body: JSON.stringify({
          title: lead.firma ? `${lead.name} (${lead.firma})` : lead.name,
          description: lead.nachricht,
          stage: isLeadQualifiziert(vollständigerLead) ? 'qualified' : 'lead',
          contactName: lead.name,
          contactEmail: lead.email,
          contactPhone: lead.telefon,
          company: lead.firma,
          source: lead.quelle,
          value: this.schaetzeAuftragswert(lead.branche),
          customFields: {
            branche: lead.branche,
            leadScore: score,
            interessen: lead.interessen?.join(', '),
          },
        }),
      });

      if (!res.ok) {
        console.error('[Magnet] Deal-Erstellung fehlgeschlagen:', res.status);
        return { erfolg: false };
      }

      const deal = await res.json();
      console.log(`[Magnet] ✅ Lead erfasst: ${lead.name} (Score: ${score})`);
      return { erfolg: true, leadId: deal.id };
    } catch (error) {
      console.error('[Magnet] Fehler:', error);
      return { erfolg: false };
    }
  }

  /**
   * Schätzt Auftragswert basierend auf Branche
   */
  private schaetzeAuftragswert(branche?: string): number {
    if (!branche) return 5000;
    
    const werte: Record<string, number> = {
      forstwirtschaft: 15000,
      aufforstung: 12000,
      landschaftsbau: 10000,
      tiefbau: 20000,
      agrar: 8000,
      reinigung: 5000,
      handwerk: 6000,
    };

    const brancheLower = branche.toLowerCase();
    for (const [b, wert] of Object.entries(werte)) {
      if (brancheLower.includes(b)) return wert;
    }
    return 5000;
  }

  /**
   * Tages-Report: Neue Leads der letzten 24h
   */
  async getDailyReport(): Promise<MagnetReport | null> {
    try {
      const gestern = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      const res = await fetch(
        `${this.mcApiBase}/api/deals?since=${gestern.toISOString()}&source=magnet`,
        {
          headers: { 'x-mc-api-key': this.mcApiKey },
        }
      );

      if (!res.ok) return null;
      const deals = await res.json();

      const neueLeads = deals.filter((d: any) => d.stage === 'lead').length;
      const qualifiziert = deals.filter((d: any) => d.stage === 'qualified').length;

      return {
        periode: { von: gestern, bis: new Date() },
        neueLeads,
        qualifizierteLeads: qualifiziert,
        konversionsrate: neueLeads > 0 ? Math.round((qualifiziert / neueLeads) * 100) : 0,
        quellenBest: 'website_main', // TODO: aus Deals berechnen
        topBranche: 'forstwirtschaft',
        gesamtPipeline: deals.reduce((sum: number, d: any) => sum + (d.value ?? 0), 0),
      };
    } catch {
      return null;
    }
  }

  /**
   * Täglicher Cron-Job
   */
  async runDaily(): Promise<void> {
    console.log('[Magnet] 🧲 Starte Lead-Monitoring...');
    
    const report = await this.getDailyReport();
    
    if (report) {
      console.log(`[Magnet] 📊 Tages-Report:`);
      console.log(`  Neue Leads: ${report.neueLeads}`);
      console.log(`  Qualifiziert: ${report.qualifizierteLeads}`);
      console.log(`  Konversionsrate: ${report.konversionsrate}%`);
      console.log(`  Pipeline: ${report.gesamtPipeline.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}`);
    } else {
      console.log('[Magnet] Kein Report verfügbar (MC nicht erreichbar?)');
    }
  }
}

// =============================================================================
// CRON-ENTRY-POINT
// =============================================================================

export async function runMagnetDaily(): Promise<void> {
  const magnet = new MagnetAgent();
  await magnet.runDaily();
}
