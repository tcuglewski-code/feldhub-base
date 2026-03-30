/**
 * Next.js Middleware
 * 
 * Läuft auf der Edge Runtime vor jedem Request.
 * Behandelt:
 * - Authentifizierung (via NextAuth)
 * - Demo Password Protection
 * - Tenant-Resolution (vorbereitet)
 */

import NextAuth from "next-auth"
import { authConfig } from "@/lib/auth.config"
import { NextResponse } from "next/server"

const { auth } = NextAuth(authConfig)

/**
 * Demo Password Protection (Basic Auth)
 * 
 * Aktiviert wenn DEMO_PASSWORD ENV-Variable gesetzt ist.
 * Schützt die gesamte App mit einem einfachen Passwort.
 * Nützlich für Staging/Preview-Environments.
 */
function checkDemoAuth(req: Request): NextResponse | null {
  const demoPassword = process.env.DEMO_PASSWORD
  if (!demoPassword) return null // Demo-Schutz deaktiviert

  const authHeader = req.headers.get("authorization")
  if (!authHeader?.startsWith("Basic ")) {
    return new NextResponse("Demo-Zugang erforderlich", {
      status: 401,
      headers: { "WWW-Authenticate": 'Basic realm="AppFabrik Demo"' },
    })
  }

  const base64Credentials = authHeader.slice(6)
  const credentials = Buffer.from(base64Credentials, "base64").toString("utf-8")
  const [, password] = credentials.split(":")

  if (password !== demoPassword) {
    return new NextResponse("Falsches Passwort", {
      status: 401,
      headers: { "WWW-Authenticate": 'Basic realm="AppFabrik Demo"' },
    })
  }

  return null // Auth OK
}

/**
 * Vercel Deployment Protection Bypass
 * 
 * Für automatisierte Requests (Webhooks, Cron) an Vercel Preview Deployments.
 * Erwartet Header: x-vercel-bypass-automation-protection: <token>
 */
function checkVercelBypass(req: Request): boolean {
  const bypassToken = process.env.VERCEL_BYPASS_TOKEN
  if (!bypassToken) return true // Kein Token = kein Bypass nötig
  
  const headerToken = req.headers.get("x-vercel-bypass-automation-protection")
  return headerToken === bypassToken
}

/**
 * Main Middleware
 */
export default auth((req) => {
  const { pathname } = req.nextUrl

  // 1. Static Assets immer durchlassen
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/static/') ||
    pathname === '/favicon.ico' ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.jpg') ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.ico')
  ) {
    return NextResponse.next()
  }

  // 2. Vercel Bypass für Automation
  const isApiRoute = pathname.startsWith('/api/')
  if (isApiRoute && checkVercelBypass(req)) {
    // API-Route mit gültigem Bypass-Token → durchlassen
  }

  // 3. Demo Password Protection (vor App-Auth)
  const demoAuthResponse = checkDemoAuth(req)
  if (demoAuthResponse) return demoAuthResponse

  // 4. Auth-Check (wird von NextAuth authConfig.callbacks.authorized gehandhabt)
  const isLoggedIn = !!req.auth
  const isLoginPage = pathname === "/login"
  const isPublicApi = pathname.startsWith('/api/auth') || 
                       pathname.startsWith('/api/webhooks') ||
                       pathname.startsWith('/api/health') ||
                       pathname.startsWith('/api/magic-link/request')

  // Login-Seite: eingeloggte User zum Dashboard redirecten
  if (isLoggedIn && isLoginPage) {
    // Rolle-basierter Redirect
    const userRole = (req.auth?.user as { role?: string })?.role
    const dashboardUrl = userRole === 'client' ? '/portal' : '/dashboard'
    return NextResponse.redirect(new URL(dashboardUrl, req.url))
  }

  // Geschützte Seiten: nicht eingeloggte User zur Login-Seite
  if (!isLoggedIn && !isLoginPage && !isPublicApi) {
    const loginUrl = new URL("/login", req.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // 5. Tenant-Header setzen (für API-Routen)
  const response = NextResponse.next()
  
  // Tenant-ID aus Session oder Environment
  const tenantId = (req.auth?.user as { tenantId?: string })?.tenantId 
                   ?? process.env.TENANT_ID 
                   ?? 'demo'
  
  response.headers.set('x-tenant-id', tenantId)
  
  return response
})

/**
 * Matcher Configuration
 * 
 * Definiert für welche Pfade die Middleware ausgeführt wird.
 * Exkludiert: _next/static, _next/image, favicon.ico
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}
