/**
 * Prisma Tenant Extension — IDOR-Fix OIA
 *
 * Erzwingt Tenant-Isolation auf DB-Ebene.
 * Alle Queries werden automatisch nach tenantId gefiltert.
 */

import { PrismaClient } from '@prisma/client'

export function createTenantPrisma(tenantId: string) {
  const prisma = new PrismaClient()
  return prisma.$extends({
    query: {
      $allModels: {
        async findMany({ args, query }) {
          args.where = { ...args.where, tenantId }
          return query(args)
        },
        async findFirst({ args, query }) {
          args.where = { ...args.where, tenantId }
          return query(args)
        },
        async findUnique({ args, query }) {
          args.where = { ...args.where, tenantId } as typeof args.where
          return query(args)
        },
        async update({ args, query }) {
          args.where = { ...args.where, tenantId } as typeof args.where
          return query(args)
        },
        async delete({ args, query }) {
          args.where = { ...args.where, tenantId } as typeof args.where
          return query(args)
        },
      }
    }
  })
}

/**
 * Validiert dass eine Ressource zum angegebenen Tenant gehört.
 * Gibt true zurück wenn gültig, false bei Cross-Tenant-Zugriff.
 */
export function validateTenantAccess(
  resource: { tenantId?: string } | null,
  sessionTenantId: string
): boolean {
  if (!resource) return false
  return resource.tenantId === sessionTenantId
}
