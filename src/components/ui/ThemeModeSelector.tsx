'use client'

import { useTheme, ThemeMode } from '@/components/providers/ThemeProvider'
import { Sun, Moon, Monitor } from 'lucide-react'

/**
 * Theme Mode Selector — Vollständiger Umschalter für Light/Dark/System
 * 
 * Zeigt drei Buttons oder ein Dropdown für die Theme-Auswahl.
 */

interface ThemeModeSelectorProps {
  /** Variante: 'buttons' zeigt 3 Icons nebeneinander, 'dropdown' ein Select */
  variant?: 'buttons' | 'dropdown'
  /** Zusätzliche CSS-Klassen */
  className?: string
  /** Label anzeigen (default: true) */
  showLabel?: boolean
}

const modeOptions: { value: ThemeMode; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Hell', icon: Sun },
  { value: 'dark', label: 'Dunkel', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
]

export function ThemeModeSelector({ 
  variant = 'buttons',
  className = '',
  showLabel = true,
}: ThemeModeSelectorProps) {
  const { mode, setMode, isDarkModeEnabled } = useTheme()
  
  // Wenn Dark Mode deaktiviert ist, nichts anzeigen
  if (!isDarkModeEnabled) return null
  
  if (variant === 'dropdown') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {showLabel && (
          <label htmlFor="theme-select" className="text-sm text-muted-foreground">
            Design:
          </label>
        )}
        <select
          id="theme-select"
          value={mode}
          onChange={(e) => setMode(e.target.value as ThemeMode)}
          className="select text-sm py-1 px-2 pr-8 rounded-md border border-border bg-surface"
          aria-label="Design-Modus auswählen"
        >
          {modeOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    )
  }
  
  // Buttons Variante (Default)
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {showLabel && (
        <span className="text-sm text-muted-foreground mr-2">Design:</span>
      )}
      <div className="flex rounded-lg border border-border p-0.5 bg-surface">
        {modeOptions.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            onClick={() => setMode(value)}
            className={`
              flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-sm
              transition-colors duration-150
              ${mode === value 
                ? 'bg-primary text-white' 
                : 'hover:bg-black/5 dark:hover:bg-white/10 text-muted-foreground'
              }
            `}
            title={label}
            aria-label={`${label} Modus aktivieren`}
            aria-pressed={mode === value}
          >
            <Icon size={16} />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

/**
 * Kompakter Theme-Toggle für Sidebars/Navbars
 * Zeigt nur das aktuelle Icon und wechselt beim Klick
 */
export function ThemeToggleCompact({ className = '' }: { className?: string }) {
  const { resolvedMode, toggleMode, isDarkModeEnabled } = useTheme()
  
  if (!isDarkModeEnabled) return null
  
  return (
    <button
      onClick={toggleMode}
      className={`
        p-2 rounded-lg transition-colors
        hover:bg-black/10 dark:hover:bg-white/10
        ${className}
      `}
      aria-label={resolvedMode === 'dark' ? 'Zu hellem Design wechseln' : 'Zu dunklem Design wechseln'}
      title={resolvedMode === 'dark' ? 'Hell' : 'Dunkel'}
    >
      {resolvedMode === 'dark' ? (
        <Sun size={20} className="text-yellow-400" />
      ) : (
        <Moon size={20} className="text-slate-600" />
      )}
    </button>
  )
}

export default ThemeModeSelector
