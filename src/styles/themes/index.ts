/**
 * Theme System Exports
 * 
 * Zentraler Export für alle Theme-relevanten Utilities.
 */

// Theme Generator
export {
  generateThemeCSS,
  generateThemeStyleTag,
  applyTheme,
  removeTheme,
  toggleDarkMode,
  initDarkMode,
  colorsToCssVars,
  tenantToCssVars,
  generateDarkModeVars,
  getContrastRatio,
  meetsWcagAA,
  meetsWcagAAA,
  type ThemeMode,
  type ThemeState,
} from './theme-generator'

// Re-export from lib/theme for convenience
export {
  generateCssVariables,
  generateCssString,
  generateTailwindColors,
  validateTheme,
  generateDarkModeVariables,
} from '@/lib/theme'
