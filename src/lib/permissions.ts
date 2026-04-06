/**
 * Permissions System
 * 
 * Generisches Permission-System für AppFabrik.
 * Kombiniert:
 * - Rollen-basierte Berechtigungen (RBAC)
 * - Feingranulare Permissions (resource:action)
 * - Scope-basierte Zugriffskontrolle (:own, :team, :all)
 * 
 * Permission-Format: "resource:action" oder "resource:action:scope"
 * Beispiele:
 * - "projects:read" → Kann Projekte lesen
 * - "projects:*" → Kann alles mit Projekten
 * - "projects:read:own" → Kann nur eigene Projekte lesen
 * - "*" → Super-Admin, kann alles
 */

import { Session } from "next-auth"
import { getCurrentTenant, type TenantConfig, type TenantRole } from "@/config/tenant"

// ============================================================
// TYPES
// ============================================================

export type Action = 'create' | 'read' | 'update' | 'delete' | '*'
export type Scope = 'own' | 'team' | 'all'

export interface PermissionCheck {
  resource: string
  action: Action
  scope?: Scope
  ownerId?: string
  teamId?: string
}

// ============================================================
// CORE RESOURCES (generisch für alle Tenants)
// ============================================================

export const RESOURCES = {
  // Core
  dashboard: 'Dashboard',
  projects: 'Projekte/Aufträge',
  tasks: 'Aufgaben',
  timeEntries: 'Zeiterfassung',
  
  // Team
  team: 'Team/Mitarbeiter',
  teamGroups: 'Teams/Gruppen',
  
  // Finanzen
  invoices: 'Rechnungen',
  quotes: 'Angebote',
  payroll: 'Lohnabrechnung',
  
  // Ressourcen
  inventory: 'Lager/Inventar',
  equipment: 'Fuhrpark/Geräte',
  
  // Dokumentation
  documents: 'Dokumente',
  reports: 'Berichte',
  dailyReports: 'Tagesprotokolle',
  
  // Kontakte
  contacts: 'Kontakte',
  customers: 'Kunden',
  
  // Planung
  calendar: 'Kalender',
  seasons: 'Saisons',
  
  // Admin
  users: 'Benutzerverwaltung',
  roles: 'Rollenverwaltung',
  settings: 'Einstellungen',
  auditLog: 'Audit-Log',
  
  // Portal
  portal: 'Kundenportal',
} as const

export type Resource = keyof typeof RESOURCES

// ============================================================
// ACTIONS
// ============================================================

export const ACTIONS = {
  create: 'Erstellen',
  read: 'Lesen',
  update: 'Bearbeiten',
  delete: 'Löschen',
  export: 'Exportieren',
  approve: 'Genehmigen',
  assign: 'Zuweisen',
  '*': 'Alle',
} as const

// ============================================================
// PERMISSION HELPERS
// ============================================================

/**
 * Baut einen Permission-String
 */
export function buildPermission(
  resource: string, 
  action: Action, 
  scope?: Scope
): string {
  if (scope) {
    return `${resource}:${action}:${scope}`
  }
  return `${resource}:${action}`
}

/**
 * Parsed einen Permission-String
 */
export function parsePermission(permission: string): {
  resource: string
  action: string
  scope?: string
} {
  const parts = permission.split(':')
  return {
    resource: parts[0] ?? '',
    action: parts[1] ?? '*',
    scope: parts[2],
  }
}

/**
 * Prüft ob eine Permission eine andere abdeckt
 * 
 * Beispiele:
 * - "projects:*" covers "projects:read" → true
 * - "*" covers "projects:read" → true
 * - "projects:read" covers "projects:read:own" → true
 * - "projects:read:own" covers "projects:read" → false
 */
export function permissionCovers(
  held: string,
  required: string
): boolean {
  // Super-Admin Wildcard
  if (held === '*') return true
  
  const heldParts = parsePermission(held)
  const reqParts = parsePermission(required)
  
  // Resource muss matchen (oder Wildcard)
  if (heldParts.resource !== reqParts.resource && heldParts.resource !== '*') {
    return false
  }
  
  // Action muss matchen (oder Wildcard)
  if (heldParts.action !== reqParts.action && heldParts.action !== '*') {
    return false
  }
  
  // Scope: ohne Scope bedeutet "all" (oder Scope matcht)
  if (reqParts.scope && heldParts.scope && heldParts.scope !== reqParts.scope) {
    // held hat :own, required hat kein Scope → nicht abgedeckt
    return false
  }
  
  // Spezialfall: held hat :own Scope, required hat keinen
  // → User hat nur Zugriff auf eigene Ressourcen
  if (heldParts.scope === 'own' && !reqParts.scope) {
    return false
  }
  
  return true
}

/**
 * Prüft ob ein User eine Permission hat (basierend auf Session)
 */
export function hasPermission(
  session: Session | null,
  permission: string,
  tenantConfig?: TenantConfig
): boolean {
  if (!session?.user) return false
  
  const { role, permissions } = session.user as { 
    role?: string
    permissions?: string[] 
  }
  
  // Direkte User-Permissions prüfen
  const userPermissions = permissions ?? []
  
  for (const held of userPermissions) {
    if (permissionCovers(held, permission)) {
      return true
    }
  }
  
  // Role-basierte Permissions aus Tenant-Config prüfen
  if (role && tenantConfig) {
    const roleConfig = tenantConfig.roles.find(r => r.id === role)
    if (roleConfig) {
      for (const held of roleConfig.permissions) {
        if (permissionCovers(held, permission)) {
          return true
        }
      }
    }
  }
  
  // Fallback: getCurrentTenant() versuchen
  if (role && !tenantConfig) {
    try {
      const config = getCurrentTenant()
      return hasPermission(session, permission, config)
    } catch {
      // Tenant nicht geladen
    }
  }
  
  return false
}

/**
 * Prüft ob der User irgendeine der Permissions hat
 */
export function hasAnyPermission(
  session: Session | null,
  permissions: string[],
  tenantConfig?: TenantConfig
): boolean {
  return permissions.some(p => hasPermission(session, p, tenantConfig))
}

/**
 * Prüft ob der User alle Permissions hat
 */
export function hasAllPermissions(
  session: Session | null,
  permissions: string[],
  tenantConfig?: TenantConfig
): boolean {
  return permissions.every(p => hasPermission(session, p, tenantConfig))
}

// ============================================================
// ROLE HELPERS
// ============================================================

/**
 * Prüft ob der User eine bestimmte Rolle hat
 */
export function hasRole(
  session: Session | null,
  ...roles: string[]
): boolean {
  if (!session?.user) return false
  const userRole = (session.user as { role?: string }).role ?? ''
  return roles.includes(userRole)
}

/**
 * Prüft ob der User Admin ist
 */
export function isAdmin(session: Session | null): boolean {
  return hasRole(session, 'admin')
}

/**
 * Prüft ob der User Admin oder Geschäftsführer ist
 */
export function isAdminOrGF(session: Session | null): boolean {
  return hasRole(session, 'admin', 'geschaeftsfuehrer', 'gf', 'manager', 'verwaltung')
}

/**
 * Prüft ob der User Manager oder höher ist
 */
export function isManager(session: Session | null): boolean {
  return hasRole(session, 'admin', 'manager', 'verwaltung')
}

/**
 * Prüft ob der User ein Kunde ist (Portal-User)
 */
export function isClient(session: Session | null): boolean {
  return hasRole(session, 'client', 'kunde', 'waldbesitzer')
}

// ============================================================
// ENTITY ACCESS CHECK
// ============================================================

/**
 * Prüft ob der User Zugriff auf eine spezifische Entität hat
 * Berücksichtigt :own und :team Scopes
 */
export function canAccessEntity(
  session: Session | null,
  permission: string,
  entity: {
    ownerId?: string
    teamId?: string
    createdById?: string
  },
  tenantConfig?: TenantConfig
): boolean {
  if (!session?.user) return false
  
  const userId = session.user.id
  const userTeamId = (session.user as { teamId?: string }).teamId
  
  // Volle Permission (ohne Scope)?
  if (hasPermission(session, permission, tenantConfig)) {
    return true
  }
  
  // :own Scope prüfen
  const ownPermission = `${permission}:own`
  if (hasPermission(session, ownPermission, tenantConfig)) {
    if (entity.ownerId === userId || entity.createdById === userId) {
      return true
    }
  }
  
  // :team Scope prüfen
  const teamPermission = `${permission}:team`
  if (hasPermission(session, teamPermission, tenantConfig)) {
    if (entity.teamId && entity.teamId === userTeamId) {
      return true
    }
  }
  
  return false
}

// ============================================================
// PERMISSION GROUPS (für UI)
// ============================================================

export interface PermissionGroup {
  id: string
  label: string
  permissions: string[]
}

/**
 * Generiert Permission-Gruppen basierend auf Resources
 */
export function getPermissionGroups(): PermissionGroup[] {
  return [
    {
      id: 'projects',
      label: 'Projekte',
      permissions: ['projects:read', 'projects:create', 'projects:update', 'projects:delete'],
    },
    {
      id: 'team',
      label: 'Team',
      permissions: ['team:read', 'team:create', 'team:update', 'team:delete'],
    },
    {
      id: 'time',
      label: 'Zeiterfassung',
      permissions: ['timeEntries:read', 'timeEntries:create', 'timeEntries:approve'],
    },
    {
      id: 'finance',
      label: 'Finanzen',
      permissions: [
        'invoices:read', 'invoices:create', 'invoices:update',
        'quotes:read', 'quotes:create',
        'payroll:read', 'payroll:update',
      ],
    },
    {
      id: 'resources',
      label: 'Ressourcen',
      permissions: [
        'inventory:read', 'inventory:update',
        'equipment:read', 'equipment:update',
      ],
    },
    {
      id: 'documents',
      label: 'Dokumente',
      permissions: ['documents:read', 'documents:create', 'documents:delete'],
    },
    {
      id: 'reports',
      label: 'Berichte',
      permissions: ['reports:read', 'dailyReports:read', 'dailyReports:create', 'dailyReports:approve'],
    },
    {
      id: 'admin',
      label: 'Administration',
      permissions: ['users:*', 'roles:*', 'settings:*', 'auditLog:read'],
    },
  ]
}

/**
 * Gibt alle verfügbaren Permissions als flache Liste zurück
 */
export function getAllPermissions(): string[] {
  const permissions: string[] = []
  
  for (const resource of Object.keys(RESOURCES)) {
    for (const action of Object.keys(ACTIONS)) {
      if (action === '*') {
        permissions.push(`${resource}:*`)
      } else {
        permissions.push(`${resource}:${action}`)
        permissions.push(`${resource}:${action}:own`)
        permissions.push(`${resource}:${action}:team`)
      }
    }
  }
  
  permissions.push('*') // Super-Admin

  return permissions
}

// ============================================================
// EXPORTS für Admin-UI (Benutzer-Verwaltung)
// ============================================================

export type Permission = string

export const ALL_PERMISSIONS: Permission[] = getAllPermissions()

export const PERMISSION_GROUPS = getPermissionGroups()

export const ROLE_TEMPLATES: Record<string, { label: string; permissions: Permission[] }> = {
  admin: {
    label: 'Administrator',
    permissions: ['*'],
  },
  manager: {
    label: 'Manager / Verwaltung',
    permissions: [
      'projects:*', 'team:*', 'timeEntries:*', 'invoices:*',
      'quotes:*', 'inventory:*', 'equipment:*', 'documents:*',
      'reports:*', 'dailyReports:*', 'contacts:*', 'calendar:*',
      'seasons:*', 'portal:read',
    ],
  },
  mitarbeiter: {
    label: 'Mitarbeiter',
    permissions: [
      'projects:read', 'timeEntries:create', 'timeEntries:read:own',
      'dailyReports:create', 'dailyReports:read:own',
      'documents:read', 'equipment:read', 'calendar:read',
    ],
  },
  kunde: {
    label: 'Kunde / Portal-User',
    permissions: [
      'portal:read', 'portal:create', 'documents:read:own',
    ],
  },
}
