"use client"

import { createContext, useContext, useEffect, useState, ReactNode, useMemo, useCallback } from 'react'
import { tenantConfig, TenantConfig } from '@/config/tenant'
import { generateCssVariables, generateDarkModeVariables, validateTheme, ContrastWarning } from '@/lib/theme'

// =============================================================================
// TYPES
// =============================================================================

export type ThemeMode = 'light' | 'dark' | 'system'

export interface ThemeContextValue {
  mode: ThemeMode
  resolvedMode: 'light' | 'dark'
  setMode: (mode: ThemeMode) => void
  toggleMode: () => void
  config: TenantConfig | null | undefined
  contrastWarnings: ContrastWarning[]
  isDarkModeEnabled: boolean
}

// =============================================================================
// CONTEXT
// =============================================================================

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

// =============================================================================
// PROVIDER
// =============================================================================

interface ThemeProviderProps {
  children: ReactNode
  config?: TenantConfig | null
  defaultMode?: ThemeMode
  storageKey?: string
}

export function ThemeProvider({
  children,
  config: configProp,
  defaultMode = 'system',
  storageKey = 'appfabrik-theme-mode',
}: ThemeProviderProps) {
  const config = configProp ?? tenantConfig
  // Dark Mode nur wenn in config aktiviert
  const isDarkModeEnabled = config?.features?.darkMode ?? false
  
  // State für Theme-Modus
  const [mode, setModeState] = useState<ThemeMode>(() => {
    if (!isDarkModeEnabled) return 'light'
    if (typeof window === 'undefined') return defaultMode
    
    const stored = localStorage.getItem(storageKey)
    if (stored && ['light', 'dark', 'system'].includes(stored)) {
      return stored as ThemeMode
    }
    return defaultMode
  })
  
  // System-Präferenz tracken
  const [systemPreference, setSystemPreference] = useState<'light' | 'dark'>('light')
  
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    setSystemPreference(mediaQuery.matches ? 'dark' : 'light')
    
    const handler = (e: MediaQueryListEvent) => {
      setSystemPreference(e.matches ? 'dark' : 'light')
    }
    
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [])
  
  // Resolved Mode berechnen
  const resolvedMode = useMemo((): 'light' | 'dark' => {
    if (!isDarkModeEnabled) return 'light'
    if (mode === 'system') return systemPreference
    return mode
  }, [mode, systemPreference, isDarkModeEnabled])
  
  // Mode setzen mit localStorage
  const setMode = useCallback((newMode: ThemeMode) => {
    if (!isDarkModeEnabled && newMode !== 'light') return
    
    setModeState(newMode)
    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKey, newMode)
    }
  }, [isDarkModeEnabled, storageKey])
  
  // Toggle zwischen light/dark
  const toggleMode = useCallback(() => {
    setMode(resolvedMode === 'dark' ? 'light' : 'dark')
  }, [resolvedMode, setMode])
  
  // CSS-Variablen anwenden
  useEffect(() => {
    if (typeof window === 'undefined' || !config) return

    const root = document.documentElement

    // Basis-Variablen aus tenant.ts
    const baseVariables = generateCssVariables(config)
    
    // Im Dark-Mode: Override einige Variablen
    const darkOverrides = resolvedMode === 'dark' 
      ? generateDarkModeVariables(config) 
      : {}
    
    // Alle Variablen kombinieren
    const allVariables = { ...baseVariables, ...darkOverrides }
    
    // Auf :root anwenden
    Object.entries(allVariables).forEach(([key, value]) => {
      root.style.setProperty(key, value)
    })
    
    // Dark-Mode-Klasse für Tailwind
    if (resolvedMode === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    
    // Cleanup
    return () => {
      Object.keys(allVariables).forEach(key => {
        root.style.removeProperty(key)
      })
    }
  }, [config, resolvedMode])
  
  // Kontrast-Validierung
  const contrastWarnings = useMemo(() => {
    if (!config) return []
    const validation = validateTheme(config)
    
    // In Development: Warnungen in Console loggen
    if (process.env.NODE_ENV === 'development' && validation.warnings.length > 0) {
      console.warn(
        '⚠️ Theme Kontrast-Probleme erkannt:\n',
        validation.warnings.map(w => 
          `  • ${w.pair}: ${w.ratio}:1 (mindestens ${w.requiredRatio}:1 erforderlich)`
        ).join('\n')
      )
    }
    
    return validation.warnings
  }, [config])
  
  // Context Value
  const value = useMemo<ThemeContextValue>(() => ({
    mode,
    resolvedMode,
    setMode,
    toggleMode,
    config,
    contrastWarnings,
    isDarkModeEnabled,
  }), [mode, resolvedMode, setMode, toggleMode, config, contrastWarnings, isDarkModeEnabled])
  
  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

// =============================================================================
// HOOK
// =============================================================================

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext)
  
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  
  return context
}

// =============================================================================
// THEME TOGGLE COMPONENT
// =============================================================================

interface ThemeToggleProps {
  className?: string
}

/**
 * Einfacher Theme-Toggle-Button
 * Zeigt Sun/Moon Icon und wechselt zwischen Light/Dark
 */
export function ThemeToggle({ className = '' }: ThemeToggleProps) {
  const { resolvedMode, toggleMode, isDarkModeEnabled } = useTheme()
  
  if (!isDarkModeEnabled) return null
  
  return (
    <button
      onClick={toggleMode}
      className={`p-2 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors ${className}`}
      aria-label={resolvedMode === 'dark' ? 'Zu hellem Design wechseln' : 'Zu dunklem Design wechseln'}
      title={resolvedMode === 'dark' ? 'Hell' : 'Dunkel'}
    >
      {resolvedMode === 'dark' ? (
        // Sun Icon
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4"/>
          <path d="M12 2v2"/>
          <path d="M12 20v2"/>
          <path d="m4.93 4.93 1.41 1.41"/>
          <path d="m17.66 17.66 1.41 1.41"/>
          <path d="M2 12h2"/>
          <path d="M20 12h2"/>
          <path d="m6.34 17.66-1.41 1.41"/>
          <path d="m19.07 4.93-1.41 1.41"/>
        </svg>
      ) : (
        // Moon Icon
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
        </svg>
      )}
    </button>
  )
}

// =============================================================================
// CONTRAST WARNING BANNER (Development Only)
// =============================================================================

/**
 * Zeigt Kontrast-Warnungen in der Entwicklung an
 * Nur sichtbar wenn NODE_ENV !== 'production'
 */
export function ContrastWarningBanner() {
  const { contrastWarnings } = useTheme()
  
  if (process.env.NODE_ENV === 'production') return null
  if (contrastWarnings.length === 0) return null
  
  return (
    <div className="fixed bottom-4 left-4 max-w-md p-4 bg-yellow-100 border border-yellow-300 rounded-lg shadow-lg z-50">
      <h4 className="font-semibold text-yellow-800 mb-2">
        ⚠️ Kontrast-Probleme ({contrastWarnings.length})
      </h4>
      <ul className="text-sm text-yellow-700 space-y-1">
        {contrastWarnings.map((warning, i) => (
          <li key={i}>
            <strong>{warning.pair}:</strong> {warning.ratio}:1 
            (min. {warning.requiredRatio}:1)
          </li>
        ))}
      </ul>
    </div>
  )
}

export default ThemeProvider
