/**
 * upselling.ts — Upselling-Trigger Definition & Automatisierung
 * Sprint JP | Feldhub Base
 *
 * Definiert Kriterien wann ein Kunde für Upsell-Angebote qualifiziert ist.
 * Checks laufen täglich via Cron.
 * Qualifizierte Kunden → Notification in Mission Control.
 */

export type UpsellTriggerType =
  | "volume_threshold"     // Fläche > X ha bearbeitet
  | "order_frequency"      // Aufträge pro Monat > X
  | "feature_usage"        // Nutzt Basis-Feature intensiv → Premium anbieten
  | "time_in_system"       // > X Monate Kunde → Loyalty Upgrade
  | "team_growth"          // Mehr als X Mitarbeiter aktiv
  | "storage_limit"        // > 80% Speicher verwendet
  | "export_frequency"     // Viele CSV-Exporte → API/Integration anbieten
  | "seasonal_peak"        // Herbst/Frühling → Saisonpaket

export interface UpsellTrigger {
  id: string
  type: UpsellTriggerType
  name: string
  description: string
  condition: {
    metric: string
    operator: "gt" | "gte" | "lt" | "lte" | "eq"
    threshold: number | string
    period?: "day" | "week" | "month" | "quarter" | "all_time"
  }
  offer: {
    title: string
    description: string
    cta: string
    package?: string
    discountPercent?: number
  }
  cooldownDays: number // Don't re-trigger within X days
  priority: "high" | "medium" | "low"
}

export interface UpsellEvaluation {
  triggerId: string
  triggerName: string
  qualified: boolean
  currentValue: number | string
  threshold: number | string
  offer: UpsellTrigger["offer"]
  priority: "high" | "medium" | "low"
}

// Standard-Trigger für Feldhub (konfigurierbar per Tenant)
export const DEFAULT_UPSELL_TRIGGERS: UpsellTrigger[] = [
  {
    id: "volume_50ha",
    type: "volume_threshold",
    name: "50+ Hektar bearbeitet",
    description: "Kunde hat in diesem Jahr über 50 ha bearbeitet → Premium-Paket anbieten",
    condition: {
      metric: "total_flaeche_year",
      operator: "gte",
      threshold: 50,
      period: "month",
    },
    offer: {
      title: "Sie wachsen! Zeit für Professional",
      description:
        "Mit über 50 ha Jahresfläche profitieren Sie von unserem Professional-Paket: unbegrenzte Aufträge, GIS-Integration, Priority-Support.",
      cta: "Professional kennenlernen",
      package: "professional",
      discountPercent: 20,
    },
    cooldownDays: 90,
    priority: "high",
  },
  {
    id: "order_frequency_10",
    type: "order_frequency",
    name: "10+ Aufträge/Monat",
    description: "Hohe Auftragsfrequenz → Automatisierungs-Features anbieten",
    condition: {
      metric: "auftraege_count",
      operator: "gte",
      threshold: 10,
      period: "month",
    },
    offer: {
      title: "Automatisierung für Ihr Team",
      description:
        "Bei 10+ Aufträgen/Monat sparen Sie mit unserem Automatisierungs-Paket: Auto-Zuweisung, Workflow-Templates, Batch-Import.",
      cta: "Jetzt upgraden",
      package: "professional",
    },
    cooldownDays: 60,
    priority: "high",
  },
  {
    id: "team_growth_5",
    type: "team_growth",
    name: "5+ aktive Mitarbeiter",
    description: "Team wächst → Team-Funktionen hervorheben",
    condition: {
      metric: "active_users_count",
      operator: "gte",
      threshold: 5,
    },
    offer: {
      title: "Ihr Team wächst — wir auch",
      description:
        "Ab 5 Mitarbeitern zahlt sich das Team-Paket aus: Rollen & Berechtigungen, Gruppenplanung, Stundenabrechnungen.",
      cta: "Team-Paket ansehen",
      package: "team",
      discountPercent: 15,
    },
    cooldownDays: 120,
    priority: "medium",
  },
  {
    id: "time_in_system_6months",
    type: "time_in_system",
    name: "6 Monate Loyalität",
    description: "Kunde nutzt System seit 6+ Monaten → Loyalty-Angebot",
    condition: {
      metric: "months_since_onboarding",
      operator: "gte",
      threshold: 6,
    },
    offer: {
      title: "Danke für Ihre Treue! 🎉",
      description:
        "Als Stammkunde erhalten Sie 25% Rabatt auf das Professional-Upgrade — dauerhaft gültig.",
      cta: "Loyalty-Angebot nutzen",
      package: "professional",
      discountPercent: 25,
    },
    cooldownDays: 180,
    priority: "medium",
  },
  {
    id: "export_frequency_monthly",
    type: "export_frequency",
    name: "Häufige CSV-Exporte",
    description: "Viele Exporte → API-Integration anbieten",
    condition: {
      metric: "exports_count",
      operator: "gte",
      threshold: 10,
      period: "month",
    },
    offer: {
      title: "API statt manueller Export",
      description:
        "Sie exportieren regelmäßig Daten? Mit unserer API verbinden Sie Feldhub direkt mit Excel, DATEV oder Ihrem ERP-System.",
      cta: "API-Zugang aktivieren",
      package: "professional",
    },
    cooldownDays: 60,
    priority: "low",
  },
  {
    id: "seasonal_spring",
    type: "seasonal_peak",
    name: "Frühjahrssaison",
    description: "März/April → Saisonpaket anbieten",
    condition: {
      metric: "current_month",
      operator: "eq",
      threshold: "3",
    },
    offer: {
      title: "Vorbereitung Pflanzsaison 🌱",
      description:
        "Starten Sie optimal in die Frühjahrssaison: Saatgut-Tracking, Pflanzpläne, Wetter-Integration — 1 Monat kostenlos testen.",
      cta: "Saisonstarter aktivieren",
      package: "seasonal",
      discountPercent: 100, // 1 free month
    },
    cooldownDays: 365,
    priority: "high",
  },
]

/**
 * Evaluate triggers against tenant metrics
 */
export function evaluateTriggers(
  triggers: UpsellTrigger[],
  metrics: Record<string, number | string>
): UpsellEvaluation[] {
  return triggers.map((trigger) => {
    const { metric, operator, threshold } = trigger.condition
    const currentValue = metrics[metric]

    let qualified = false

    if (currentValue !== undefined) {
      const numValue = Number(currentValue)
      const numThreshold = Number(threshold)

      switch (operator) {
        case "gt":
          qualified = numValue > numThreshold
          break
        case "gte":
          qualified = numValue >= numThreshold
          break
        case "lt":
          qualified = numValue < numThreshold
          break
        case "lte":
          qualified = numValue <= numThreshold
          break
        case "eq":
          qualified = String(currentValue) === String(threshold)
          break
      }
    }

    return {
      triggerId: trigger.id,
      triggerName: trigger.name,
      qualified,
      currentValue: currentValue ?? 0,
      threshold,
      offer: trigger.offer,
      priority: trigger.priority,
    }
  })
}
