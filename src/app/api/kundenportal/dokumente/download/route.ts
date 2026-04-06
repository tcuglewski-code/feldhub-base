// Sprint AL: Datei-Download-Proxy für Nextcloud
// Streamt Dateien aus der Nextcloud an den Browser weiter (mit Auth)

import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { downloadUrl, downloadHeaders } from "@/lib/nextcloud"

export async function GET(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })

  const url = new URL(req.url)
  const pfad = url.searchParams.get("pfad")

  if (!pfad) {
    return NextResponse.json({ error: "pfad fehlt" }, { status: 400 })
  }

  // Sicherheitscheck: Nur Kunden-Dateien erlaubt
  if (!pfad.startsWith("/Koch-Aufforstung/Kunden/")) {
    return NextResponse.json({ error: "Zugriff verweigert" }, { status: 403 })
  }

  // IDOR-Fix OIF: Prüfe dass Datei zum Tenant gehört
  // Extrahiere kundeId aus Pfad: /Koch-Aufforstung/Kunden/{kundeId}/...
  const pfadTeile = pfad.split("/")
  const kundeIdAusPfad = pfadTeile[3]
  if (kundeIdAusPfad) {
    const { prisma } = await import("@/lib/prisma")
    const tenantId = session.user.tenantId
    const kontakt = await prisma.kontakt.findFirst({ where: { id: kundeIdAusPfad, tenantId } })
    if (!kontakt) {
      return NextResponse.json({ error: "Nicht berechtigt" }, { status: 403 })
    }
  }

  try {
    const nextcloudUrl = downloadUrl(pfad)
    const headers = downloadHeaders()

    const res = await fetch(nextcloudUrl, { headers })

    if (!res.ok) {
      return NextResponse.json({ error: "Datei nicht gefunden" }, { status: 404 })
    }

    const dateiname = pfad.split("/").pop() ?? "download"
    const contentType = res.headers.get("Content-Type") ?? "application/octet-stream"

    return new NextResponse(res.body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${decodeURIComponent(dateiname)}"`,
      },
    })
  } catch (err) {
    console.error("[Download] Fehler:", err)
    return NextResponse.json({ error: "Download fehlgeschlagen" }, { status: 500 })
  }
}
