/**
 * LLM Cost Tracker — Feldhub
 * Sprint JD: Kostenkalkulation + Logging für alle Agenten-API-Calls
 */

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

export interface AIUsageLog {
  agent: string;
  model: string;
  task: string;
  inputTokens: number;
  outputTokens: number;
  cachedTokens?: number;
  costUsd: number;
  timestamp: string;
  sessionId?: string;
  tenantId?: string;
}

/**
 * Berechnet Kosten in USD für einen LLM-API-Call
 */
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

/**
 * Empfiehlt das günstigste ausreichende Modell für einen Task
 */
export function recommendModel(
  taskComplexity: 'simple' | 'medium' | 'complex',
  tokenBudget: number
): ModelId {
  if (taskComplexity === 'simple' || tokenBudget < 2000) {
    return 'claude-haiku-4-5';
  }
  if (taskComplexity === 'medium' || tokenBudget < 10000) {
    return 'claude-sonnet-4-6';
  }
  return 'claude-opus-4-5';
}

/**
 * Loggt einen LLM-API-Call zu Mission Control
 */
export async function logUsage(
  params: Omit<AIUsageLog, 'timestamp'>
): Promise<boolean> {
  const payload: AIUsageLog = {
    ...params,
    timestamp: new Date().toISOString(),
  };

  const mcUrl = process.env.MISSION_CONTROL_URL ?? 'https://mission-control-tawny-omega.vercel.app';
  const token = process.env.AMADEUS_TOKEN ?? '';

  try {
    const res = await fetch(`${mcUrl}/api/ai/usage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-amadeus-token': token,
      },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch {
    // Silent fail — cost logging should never break main functionality
    return false;
  }
}

/**
 * Budget-Alert: Prüft ob Tageslimit überschritten wurde
 */
export async function checkDailyBudget(
  costToday: number,
  limitUsd = 20
): Promise<{ exceeded: boolean; percentage: number }> {
  const percentage = Math.round((costToday / limitUsd) * 100);
  return {
    exceeded: costToday > limitUsd,
    percentage,
  };
}

/**
 * Berechnet Monats-Prognose aus bisherigen Tageskosten
 */
export function projectMonthlyCost(
  dailyAvgUsd: number
): { monthly: number; yearly: number } {
  return {
    monthly: Math.round(dailyAvgUsd * 30 * 100) / 100,
    yearly: Math.round(dailyAvgUsd * 365 * 100) / 100,
  };
}
