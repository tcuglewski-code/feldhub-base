/**
 * NextAuth.js Main Configuration
 * 
 * Multi-Tenant Auth System für AppFabrik
 * 
 * Features:
 * - Credentials-basierte Authentifizierung (Email + Passwort)
 * - Magic-Link Login (passwortlos für Kunden)
 * - Multi-Tenant Support (User gehört zu genau einem Tenant)
 * - Role-based Access Control (RBAC)
 * - Feingranulare Permissions
 * - 2FA Support (TOTP)
 * 
 * Login-Flow Credentials:
 * 1. User gibt Email + Passwort ein
 * 2. System ermittelt Tenant anhand der Domain oder TENANT_ID env
 * 3. User wird in diesem Tenant gesucht
 * 4. Bei 2FA: Redirect zur 2FA-Eingabe
 * 5. Bei Erfolg: JWT mit tenantId, role, permissions
 * 
 * Login-Flow Magic-Link:
 * 1. User gibt Email ein
 * 2. System sendet Magic-Link per Email
 * 3. User klickt Link → wird eingeloggt
 */

import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { authConfig } from "./auth.config"
import { getCurrentTenant, hasPermission as checkTenantPermission, type TenantConfig } from "@/config/tenant"

// Type Extensions für NextAuth
declare module "next-auth" {
  interface User {
    tenantId: string
    role: string
    permissions: string[]
    twoFactorEnabled: boolean
  }
  
  interface Session {
    user: {
      id: string
      name: string
      email: string
      tenantId: string
      role: string
      permissions: string[]
      twoFactorEnabled: boolean
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    tenantId: string
    role: string
    permissions: string[]
    twoFactorEnabled: boolean
  }
}

// ============================================================
// HELPER: Tenant ermitteln
// ============================================================

function resolveTenantId(credentialsTenantId?: string): string {
  // 1. Explizit übergebene Tenant-ID
  if (credentialsTenantId) return credentialsTenantId
  
  // 2. Aus Environment
  if (process.env.TENANT_ID) return process.env.TENANT_ID
  
  // 3. Fallback auf 'demo'
  return 'demo'
}

// ============================================================
// NEXTAUTH EXPORT
// ============================================================

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    // ==================== CREDENTIALS PROVIDER ====================
    Credentials({
      id: "credentials",
      name: "Email & Passwort",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Passwort", type: "password" },
        tenantId: { label: "Tenant", type: "text" },
        twoFactorCode: { label: "2FA Code", type: "text" },
        twoFactorValidated: { label: "2FA Validated", type: "text" },
      },
      
      async authorize(credentials) {
        const { email, password, tenantId, twoFactorCode, twoFactorValidated } = credentials as {
          email?: string
          password?: string
          tenantId?: string
          twoFactorCode?: string
          twoFactorValidated?: string
        }
        
        if (!email || !password) {
          return null
        }
        
        try {
          const activeTenantId = resolveTenantId(tenantId)
          
          // User in diesem Tenant suchen
          const user = await prisma.user.findUnique({
            where: {
              tenantId_email: {
                tenantId: activeTenantId,
                email: email,
              },
            },
          })
          
          if (!user || !user.active) {
            return null
          }
          
          // Passwort prüfen
          const isValidPassword = await bcrypt.compare(password, user.password)
          if (!isValidPassword) {
            return null
          }
          
          // 2FA Check
          if (user.twoFactorEnabled) {
            // Wenn 2FA aktiviert, muss entweder:
            // a) twoFactorValidated === "true" (bereits validiert)
            // b) twoFactorCode vorhanden und gültig sein
            if (twoFactorValidated !== "true" && !twoFactorCode) {
              // 2FA erforderlich aber nicht validiert
              // Frontend sollte das erkennen und 2FA-Dialog zeigen
              return null
            }
            
            // TODO: twoFactorCode gegen TOTP Secret validieren
            // if (twoFactorCode && !validateTOTP(user.twoFactorSecret, twoFactorCode)) {
            //   return null
            // }
          }
          
          // Last Login aktualisieren
          prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
          }).catch(() => {})
          
          // Audit Log
          prisma.auditLog.create({
            data: {
              tenantId: user.tenantId,
              userId: user.id,
              userName: user.name,
              action: "login",
              entityType: "User",
              entityId: user.id,
              entityName: user.name,
              success: true,
            },
          }).catch(() => {})
          
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            tenantId: user.tenantId,
            role: user.role,
            permissions: user.permissions,
            twoFactorEnabled: user.twoFactorEnabled,
          }
        } catch (error) {
          console.error("Auth error:", error)
          return null
        }
      },
    }),
    
    // ==================== MAGIC-LINK PROVIDER ====================
    Credentials({
      id: "magic-link",
      name: "Magic Link",
      credentials: {
        token: { label: "Token", type: "text" },
      },
      
      async authorize(credentials) {
        const { token } = credentials as { token?: string }
        
        if (!token) {
          return null
        }
        
        try {
          // Magic Token suchen
          const magicToken = await prisma.magicToken.findUnique({
            where: { token },
          })
          
          if (!magicToken) {
            return null
          }
          
          // Token validieren
          if (magicToken.used) {
            return null // Bereits verwendet
          }
          
          if (new Date() > magicToken.expiresAt) {
            return null // Abgelaufen
          }
          
          if (magicToken.type !== 'login') {
            return null // Falscher Token-Typ
          }
          
          // User laden
          const user = await prisma.user.findUnique({
            where: {
              tenantId_email: {
                tenantId: magicToken.tenantId,
                email: magicToken.email,
              },
            },
          })
          
          if (!user || !user.active) {
            return null
          }
          
          // Token als verwendet markieren
          await prisma.magicToken.update({
            where: { id: magicToken.id },
            data: { 
              used: true,
              usedAt: new Date(),
            },
          })
          
          // Last Login aktualisieren
          prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
          }).catch(() => {})
          
          // Audit Log
          prisma.auditLog.create({
            data: {
              tenantId: user.tenantId,
              userId: user.id,
              userName: user.name,
              action: "login",
              entityType: "User",
              entityId: user.id,
              entityName: user.name,
              success: true,
              newData: { method: 'magic-link' },
            },
          }).catch(() => {})
          
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            tenantId: user.tenantId,
            role: user.role,
            permissions: user.permissions,
            twoFactorEnabled: user.twoFactorEnabled,
          }
        } catch (error) {
          console.error("Magic-link auth error:", error)
          return null
        }
      },
    }),
  ],
  
  events: {
    async signOut({ token }) {
      if (token?.id && token?.tenantId) {
        prisma.auditLog.create({
          data: {
            tenantId: token.tenantId as string,
            userId: token.id as string,
            action: "logout",
            entityType: "User",
            entityId: token.id as string,
            success: true,
          },
        }).catch(() => {})
      }
    },
  },
})

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Server-seitige Session abrufen
 * 
 * Nutzung in Server Components und API Routes:
 * ```ts
 * const session = await getServerSession()
 * if (!session) redirect("/login")
 * ```
 */
export async function getServerSession() {
  return await auth()
}

/**
 * Gibt die aktuelle Tenant-ID zurück (aus Session oder Env)
 */
export async function getCurrentTenantId(): Promise<string> {
  const session = await auth()
  return session?.user?.tenantId ?? process.env.TENANT_ID ?? 'demo'
}

/**
 * Prüft ob der aktuelle User eine Permission hat
 * 
 * Kombiniert:
 * 1. Direkte User-Permissions
 * 2. Role-basierte Permissions aus Tenant-Config
 */
export async function checkPermission(permission: string): Promise<boolean> {
  const session = await auth()
  if (!session?.user) return false
  
  const { role, permissions } = session.user
  
  // Admin hat immer alle Rechte
  if (role === "admin") return true
  
  // Direkte User-Permissions prüfen
  if (permissions.includes(permission)) return true
  if (permissions.includes("*")) return true
  
  // Wildcard-Check (z.B. "projects:*" matched "projects:read")
  const [resource, action] = permission.split(":")
  if (permissions.includes(`${resource}:*`)) return true
  
  // Prüfe Tenant-Rollen-Konfiguration
  try {
    const tenantConfig = getCurrentTenant()
    return checkTenantPermission(role, permission, tenantConfig)
  } catch {
    // Tenant nicht geladen → nur direkte Permissions
    return false
  }
}

/**
 * Prüft ob der User eine bestimmte Rolle hat
 */
export async function hasRole(...roles: string[]): Promise<boolean> {
  const session = await auth()
  if (!session?.user) return false
  return roles.includes(session.user.role)
}

/**
 * Prüft ob der User Admin ist
 */
export async function isAdmin(): Promise<boolean> {
  return hasRole("admin")
}

/**
 * Guard für API-Routes - wirft Error wenn nicht berechtigt
 */
export async function requirePermission(permission: string): Promise<void> {
  const hasAccess = await checkPermission(permission)
  if (!hasAccess) {
    throw new Error("Nicht berechtigt")
  }
}

/**
 * Guard für API-Routes - gibt Response zurück wenn nicht berechtigt
 */
export async function withPermission(
  permission: string,
  handler: () => Promise<Response>
): Promise<Response> {
  const hasAccess = await checkPermission(permission)
  if (!hasAccess) {
    return new Response(
      JSON.stringify({ error: "Nicht berechtigt" }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    )
  }
  return handler()
}

/**
 * Prüft ob der User Zugriff auf eine bestimmte Entität hat
 * Berücksichtigt :own Scope
 */
export async function canAccessEntity(
  permission: string,
  ownerId?: string
): Promise<boolean> {
  const session = await auth()
  if (!session?.user) return false
  
  // Volle Permission vorhanden?
  const hasFullAccess = await checkPermission(permission)
  if (hasFullAccess) return true
  
  // :own Permission prüfen
  const ownPermission = `${permission}:own`
  const hasOwnAccess = await checkPermission(ownPermission)
  if (hasOwnAccess && ownerId === session.user.id) {
    return true
  }
  
  return false
}
