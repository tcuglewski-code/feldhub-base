/**
 * NextAuth.js Edge-Safe Configuration
 * 
 * Diese Konfiguration kann in der Middleware verwendet werden,
 * da sie keine Prisma-Abhängigkeit hat.
 * 
 * Die Provider werden in auth.ts hinzugefügt.
 */

import type { NextAuthConfig } from "next-auth"

export const authConfig = {
  // JWT-basierte Sessions (stateless, Edge-kompatibel)
  session: { 
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 Tage
  },
  
  // Custom Pages
  pages: {
    signIn: "/login",
    error: "/login",
  },
  
  // Callbacks für JWT und Session
  callbacks: {
    /**
     * JWT Callback - wird bei jedem Token-Update aufgerufen
     * Speichert User-Daten im Token
     */
    jwt({ token, user, trigger, session }) {
      // Bei Login: User-Daten ins Token
      if (user) {
        token.id = user.id
        token.tenantId = user.tenantId
        token.role = user.role
        token.permissions = user.permissions
        token.twoFactorEnabled = user.twoFactorEnabled
      }
      
      // Bei Session-Update: neue Daten übernehmen
      if (trigger === "update" && session) {
        token.name = session.name ?? token.name
        token.role = session.role ?? token.role
        token.permissions = session.permissions ?? token.permissions
      }
      
      return token
    },
    
    /**
     * Session Callback - formt das Session-Objekt für den Client
     */
    session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string
        session.user.tenantId = token.tenantId as string
        session.user.role = token.role as string
        session.user.permissions = token.permissions as string[]
        session.user.twoFactorEnabled = token.twoFactorEnabled as boolean
      }
      return session
    },
    
    /**
     * Authorized Callback - wird von der Middleware aufgerufen
     * Prüft ob der Request autorisiert ist
     */
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl
      
      // Öffentliche Pfade (immer erlaubt)
      const publicPaths = [
        "/login",
        "/api/auth",
        "/_next",
        "/favicon.ico",
        "/logo",
        "/images",
      ]
      
      if (publicPaths.some(path => pathname.startsWith(path))) {
        return true
      }
      
      // API-Routen ohne Auth (z.B. Webhooks)
      const publicApiPaths = [
        "/api/webhooks",
        "/api/health",
        "/api/magic-link/request",
      ]
      
      if (publicApiPaths.some(path => pathname.startsWith(path))) {
        return true
      }
      
      // Alle anderen Pfade: Login erforderlich
      const isLoggedIn = !!auth?.user
      return isLoggedIn
    },
  },
  
  // Leere Providers - werden in auth.ts hinzugefügt
  providers: [],
  
} satisfies NextAuthConfig
