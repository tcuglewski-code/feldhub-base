/**
 * Feldhub Dark Mode System
 * 
 * Re-Export der ThemeProvider-Komponenten aus @/components/providers/ThemeProvider
 * 
 * Die eigene Implementation bietet bessere Integration mit dem tenant.ts System
 * als next-themes direkt und unterstützt:
 * - System-Präferenz (prefers-color-scheme)
 * - localStorage Persistenz
 * - Tenant-konfigurierbare Dark-Mode-Aktivierung
 * - Automatische Kontrast-Validierung
 * - FOUC-Prevention
 */

'use client'

// Re-Export alles aus dem ThemeProvider
export {
  ThemeProvider as FeldhubThemeProvider,
  useTheme,
  ThemeToggle,
  ContrastWarningBanner,
  type ThemeMode,
  type ThemeContextValue,
} from '@/components/providers/ThemeProvider'

// Default export für Kompatibilität
export { ThemeProvider as default } from '@/components/providers/ThemeProvider'
