/**
 * Theme Generator
 * 
 * Generiert CSS-Custom-Properties aus der Tenant-Konfiguration.
 * Kann serverseitig (für initiales CSS) oder clientseitig (für Runtime-Updates) verwendet werden.
 * 
 * Usage:
 * ```ts
 * import { generateThemeCSS, applyTheme } from '@/styles/themes/theme-generator'
 * 
 * // Server: CSS String generieren
 * const css = generateThemeCSS(tenantConfig)
 * 
 * // Client: Theme anwenden
 * applyTheme(tenantConfig)
 * ```
 */

import { TenantConfig, TenantColors } from '@/config/tenant'

// ============================================================
// CSS VARIABLE GENERATION
// ============================================================

/**
 * Konvertiert TenantColors zu CSS Custom Properties
 */
export function colorsToCssVars(colors: TenantColors): Record<string, string> {
  return {
    // Brand Colors
    '--color-primary': colors.primary,
    '--color-primary-light': colors.primaryLight,
    '--color-primary-dark': colors.primaryDark,
    '--color-secondary': colors.secondary,
    '--color-secondary-light': colors.secondaryLight,
    '--color-secondary-dark': colors.secondaryDark,
    
    // Background Colors
    '--color-background': colors.background,
    '--color-background-alt': colors.backgroundAlt,
    '--color-surface': colors.surface,
    
    // Text Colors
    '--color-text': colors.text,
    '--color-text-muted': colors.textMuted,
    '--color-text-on-primary': colors.textOnPrimary,
    '--color-text-on-secondary': colors.textOnSecondary,
    
    // Semantic Colors
    '--color-success': colors.success,
    '--color-success-light': colors.successLight,
    '--color-warning': colors.warning,
    '--color-warning-light': colors.warningLight,
    '--color-error': colors.error,
    '--color-error-light': colors.errorLight,
    '--color-info': colors.info,
    '--color-info-light': colors.infoLight,
    
    // Border & Divider
    '--color-border': colors.border,
    '--color-divider': colors.divider,
    
    // Sidebar
    '--color-sidebar-bg': colors.sidebarBg,
    '--color-sidebar-text': colors.sidebarText,
    '--color-sidebar-active': colors.sidebarActive,
    
    // Tailwind Compatibility
    '--foreground': colors.text,
    '--background': colors.background,
  }
}

/**
 * Generiert CSS-Variablen aus der vollständigen Tenant-Konfiguration
 */
export function tenantToCssVars(config: TenantConfig): Record<string, string> {
  return {
    ...colorsToCssVars(config.colors),
    
    // Typography
    '--font-family': config.typography.fontFamily,
    '--font-family-mono': config.typography.fontFamilyMono,
    '--font-size-base': config.typography.fontSizeBase,
    
    // Branding Meta
    '--tenant-name': `"${config.name}"`,
    '--tenant-short-name': `"${config.shortName}"`,
  }
}

/**
 * Generiert Dark Mode Overrides
 * Invertiert automatisch Light/Dark wo sinnvoll
 */
export function generateDarkModeVars(colors: TenantColors): Record<string, string> {
  return {
    '--color-background': darken(colors.background, 0.9),
    '--color-background-alt': darken(colors.backgroundAlt, 0.85),
    '--color-surface': darken(colors.surface, 0.82),
    '--color-text': lighten(colors.text, 0.9),
    '--color-text-muted': lighten(colors.textMuted, 0.3),
    '--color-border': darken(colors.border, 0.7),
    '--color-divider': darken(colors.divider, 0.75),
    '--foreground': lighten(colors.text, 0.9),
    '--background': darken(colors.background, 0.9),
  }
}

// ============================================================
// CSS GENERATION
// ============================================================

/**
 * Generiert einen vollständigen CSS-String für das Theme
 */
export function generateThemeCSS(config: TenantConfig): string {
  const lightVars = tenantToCssVars(config)
  const darkVars = generateDarkModeVars(config.colors)
  
  const lightCss = Object.entries(lightVars)
    .map(([key, value]) => `  ${key}: ${value};`)
    .join('\n')
  
  const darkCss = Object.entries(darkVars)
    .map(([key, value]) => `  ${key}: ${value};`)
    .join('\n')
  
  return `
/* Auto-generated Theme: ${config.name} */
/* Generated at: ${new Date().toISOString()} */

:root {
${lightCss}
}

.dark {
${darkCss}
}
`.trim()
}

/**
 * Generiert ein <style> Tag mit dem Theme
 */
export function generateThemeStyleTag(config: TenantConfig): string {
  const css = generateThemeCSS(config)
  return `<style id="tenant-theme">${css}</style>`
}

// ============================================================
// CLIENT-SIDE THEME APPLICATION
// ============================================================

/**
 * Wendet ein Theme zur Laufzeit an (Client-only)
 */
export function applyTheme(config: TenantConfig): void {
  if (typeof document === 'undefined') {
    console.warn('applyTheme() called on server - ignoring')
    return
  }
  
  const vars = tenantToCssVars(config)
  const root = document.documentElement
  
  for (const [key, value] of Object.entries(vars)) {
    root.style.setProperty(key, value)
  }
}

/**
 * Entfernt das aktuelle Theme (zurück zu Defaults)
 */
export function removeTheme(): void {
  if (typeof document === 'undefined') return
  
  const root = document.documentElement
  const vars = [
    '--color-primary', '--color-primary-light', '--color-primary-dark',
    '--color-secondary', '--color-secondary-light', '--color-secondary-dark',
    '--color-background', '--color-background-alt', '--color-surface',
    '--color-text', '--color-text-muted', '--color-text-on-primary', '--color-text-on-secondary',
    '--color-success', '--color-success-light', '--color-warning', '--color-warning-light',
    '--color-error', '--color-error-light', '--color-info', '--color-info-light',
    '--color-border', '--color-divider',
    '--color-sidebar-bg', '--color-sidebar-text', '--color-sidebar-active',
    '--font-family', '--font-family-mono', '--font-size-base',
  ]
  
  for (const key of vars) {
    root.style.removeProperty(key)
  }
}

/**
 * Toggle Dark Mode
 */
export function toggleDarkMode(isDark?: boolean): void {
  if (typeof document === 'undefined') return
  
  const root = document.documentElement
  
  if (isDark === undefined) {
    root.classList.toggle('dark')
  } else if (isDark) {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }
  
  // Persist preference
  if (typeof localStorage !== 'undefined') {
    const currentMode = root.classList.contains('dark') ? 'dark' : 'light'
    localStorage.setItem('theme-mode', currentMode)
  }
}

/**
 * Initialisiert Dark Mode basierend auf User-Preference
 */
export function initDarkMode(): void {
  if (typeof window === 'undefined') return
  
  // 1. Check localStorage
  const stored = localStorage.getItem('theme-mode')
  if (stored === 'dark') {
    document.documentElement.classList.add('dark')
    return
  }
  if (stored === 'light') {
    document.documentElement.classList.remove('dark')
    return
  }
  
  // 2. Check system preference
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  if (prefersDark) {
    document.documentElement.classList.add('dark')
  }
}

// ============================================================
// COLOR UTILITIES
// ============================================================

/**
 * Verdunkelt eine HEX-Farbe
 * @param hex HEX-Farbcode (#RRGGBB)
 * @param amount 0-1 (0 = keine Änderung, 1 = schwarz)
 */
function darken(hex: string, amount: number): string {
  const rgb = hexToRgb(hex)
  if (!rgb) return hex
  
  const factor = 1 - amount
  return rgbToHex(
    Math.round(rgb.r * factor),
    Math.round(rgb.g * factor),
    Math.round(rgb.b * factor)
  )
}

/**
 * Hellt eine HEX-Farbe auf
 * @param hex HEX-Farbcode (#RRGGBB)
 * @param amount 0-1 (0 = keine Änderung, 1 = weiß)
 */
function lighten(hex: string, amount: number): string {
  const rgb = hexToRgb(hex)
  if (!rgb) return hex
  
  return rgbToHex(
    Math.round(rgb.r + (255 - rgb.r) * amount),
    Math.round(rgb.g + (255 - rgb.g) * amount),
    Math.round(rgb.b + (255 - rgb.b) * amount)
  )
}

/**
 * Konvertiert HEX zu RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null
}

/**
 * Konvertiert RGB zu HEX
 */
function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b]
    .map(x => {
      const hex = Math.max(0, Math.min(255, x)).toString(16)
      return hex.length === 1 ? '0' + hex : hex
    })
    .join('')
}

/**
 * Berechnet Kontrastverhältnis zwischen zwei Farben
 * Gibt einen Wert zwischen 1 (kein Kontrast) und 21 (maximaler Kontrast) zurück
 */
export function getContrastRatio(foreground: string, background: string): number {
  const fgRgb = hexToRgb(foreground)
  const bgRgb = hexToRgb(background)
  
  if (!fgRgb || !bgRgb) return 1
  
  const fgLuminance = getLuminance(fgRgb)
  const bgLuminance = getLuminance(bgRgb)
  
  const lighter = Math.max(fgLuminance, bgLuminance)
  const darker = Math.min(fgLuminance, bgLuminance)
  
  return (lighter + 0.05) / (darker + 0.05)
}

/**
 * Berechnet relative Luminanz einer Farbe
 */
function getLuminance(rgb: { r: number; g: number; b: number }): number {
  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(c => {
    c = c / 255
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/**
 * Prüft ob eine Farbkombination WCAG AA erfüllt (Mindest-Kontrast 4.5:1)
 */
export function meetsWcagAA(foreground: string, background: string): boolean {
  return getContrastRatio(foreground, background) >= 4.5
}

/**
 * Prüft ob eine Farbkombination WCAG AAA erfüllt (Mindest-Kontrast 7:1)
 */
export function meetsWcagAAA(foreground: string, background: string): boolean {
  return getContrastRatio(foreground, background) >= 7
}

// ============================================================
// EXPORTS
// ============================================================

export type ThemeMode = 'light' | 'dark' | 'system'

export interface ThemeState {
  mode: ThemeMode
  colors: TenantColors
}
