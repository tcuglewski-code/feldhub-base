/**
 * Cron: GET /api/cron/upselling-check
 * Sprint JP — Upselling-Trigger Automatisierung
 *
 * Läuft täglich um 09:00.
 * Prüft alle Trigger gegen aktuelle Tenant-Metriken.
 * Qualifizierte Trigger → Notification in Mission Control.
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { DEFAULT_UPSELL_TRIGGERS, evaluateTriggers } from "@/lib/upselling"
import { getTenantConfig } from "@/config/tenant"

export const dynamic = "force-dynamic"
export const maxDuration = 45

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET
  const apiKey = request.headers.get("x-api-key")
  const mcKey = process.env.MISSION_CONTROL_API_KEY || process.env.MC_API_KEY

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    if (!apiKey || apiKey !== mcKey) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  }

  const tenant = getTenantConfig()
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfYear = new Date(now.getFullYear(), 0, 1)

  // Collect metrics in parallel
  const [auftraegeMonth, auftraegeYear, activeUsers, totalFlaeche, exportsMonth] =
    await Promise.allSettled([
      prisma.auftrag.count({
        where: { createdAt: { gte: startOfMonth } },
      }),
      prisma.auftrag.aggregate({
        where: { createdAt: { gte: startOfYear } },
        _sum: { flaeche: true },
      }),
      prisma.user.count({
        where: { lastLogin: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
      }),
      prisma.auftrag.aggregate({
        _sum: { flaeche: true },
      }),
      prisma.auditLog
        .count({
          where: {
            action: { contains: "export" },
            createdAt: { gte: startOfMonth },
          },
        })
        .catch(() => 0),
    ])

  const metrics: Record<string, number | string> = {
    auftraege_count: auftraegeMonth.status === "fulfilled" ? auftraegeMonth.value : 0,
    total_flaeche_year:
      auftraegeYear.status === "fulfilled"
        ? Number(auftraegeYear.value._sum.flaeche) || 0
        : 0,
    active_users_count: activeUsers.status === "fulfilled" ? activeUsers.value : 0,
    total_flaeche_all:
      totalFlaeche.status === "fulfilled"
        ? Number(totalFlaeche.value._sum.flaeche) || 0
        : 0,
    exports_count: exportsMonth.status === "fulfilled" ? exportsMonth.value : 0,
    months_since_onboarding: 6, // TODO: get from tenant.createdAt
    current_month: String(now.getMonth() + 1),
  }

  // Evaluate triggers
  const evaluations = evaluateTriggers(DEFAULT_UPSELL_TRIGGERS, metrics)
  const qualified = evaluations.filter((e) => e.qualified)

  // Send qualified triggers to Mission Control
  const mcUrl = process.env.MISSION_CONTROL_URL || "https://mission-control-tawny-omega.vercel.app"
  const notificationsSent: string[] = []
  const notificationErrors: string[] = []

  if (mcKey && qualified.length > 0) {
    for (const trigger of qualified.filter((t) => t.priority === "high")) {
      try {
        const res = await fetch(`${mcUrl}/api/notifications`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": mcKey,
          },
          body: JSON.stringify({
            title: `💡 Upsell-Chance: ${trigger.triggerName}`,
            message: `${trigger.offer.title}\n\n${trigger.offer.description}\n\nAktion: ${trigger.offer.cta}${trigger.offer.discountPercent ? ` (${trigger.offer.discountPercent}% Rabatt)` : ""}`,
            type: "UPSELL",
            priority: trigger.priority.toUpperCase(),
            metadata: {
              triggerId: trigger.triggerId,
              currentValue: trigger.currentValue,
              threshold: trigger.threshold,
              package: trigger.offer.package,
              tenantId: tenant.id,
            },
          }),
        })
        if (res.ok) notificationsSent.push(trigger.triggerId)
        else notificationErrors.push(`${trigger.triggerId}: ${res.status}`)
      } catch (err) {
        notificationErrors.push(`${trigger.triggerId}: ${err}`)
      }
    }

    // Also create a task if high-priority upsell
    const highPriority = qualified.filter((t) => t.priority === "high")
    if (highPriority.length > 0) {
      try {
        await fetch(`${mcUrl}/api/tasks`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": mcKey,
          },
          body: JSON.stringify({
            title: `Upsell-Kontakt: ${tenant.name} — ${highPriority[0].triggerName}`,
            description: [
              `**Tenant:** ${tenant.name}`,
              `**Qualifizierter Trigger:** ${highPriority[0].triggerName}`,
              `**Angebot:** ${highPriority[0].offer.title}`,
              `**Aktueller Wert:** ${highPriority[0].currentValue} (Schwellwert: ${highPriority[0].threshold})`,
              "",
              `→ ${highPriority[0].offer.cta}`,
            ].join("\n"),
            priority: "HIGH",
            status: "TODO",
            labels: ["upsell", "sales"],
          }),
        })
      } catch (err) {
        console.error("Task creation failed:", err)
      }
    }
  }

  return NextResponse.json({
    success: true,
    metrics,
    evaluated: evaluations.length,
    qualified: qualified.length,
    qualifiedTriggers: qualified.map((t) => ({
      id: t.triggerId,
      name: t.triggerName,
      priority: t.priority,
      offer: t.offer.title,
    })),
    notificationsSent,
    notificationErrors,
  })
}
