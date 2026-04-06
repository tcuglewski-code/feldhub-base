/**
 * API: GET /api/upselling
 * Sprint JP — Upselling Trigger Status (Admin-Endpunkt)
 *
 * Gibt aktuellen Status aller Upselling-Trigger zurück.
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { DEFAULT_UPSELL_TRIGGERS } from "@/lib/upselling"

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  return NextResponse.json({
    triggers: DEFAULT_UPSELL_TRIGGERS.map((t) => ({
      id: t.id,
      name: t.name,
      type: t.type,
      description: t.description,
      condition: t.condition,
      offer: t.offer,
      cooldownDays: t.cooldownDays,
      priority: t.priority,
    })),
    cronSchedule: "0 9 * * *",
    lastCheck: null, // TODO: Store in DB
  })
}
