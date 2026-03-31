/**
 * Feldhub — OnboardingBanner Komponente
 * 
 * Zeigt den Onboarding-Fortschritt im Dashboard.
 * Verschwindet automatisch wenn 100% erreicht.
 */

'use client';

import React, { useState } from 'react';

// =============================================================================
// ONBOARDING SCHRITTE (Client-seitig für UI)
// =============================================================================

interface OnboardingSchritt {
  id: string;
  label: string;
  phase: number;
  erledigt: boolean;
}

// =============================================================================
// PROPS
// =============================================================================

interface OnboardingBannerProps {
  prozent: number;
  aktuellePhase: number;
  offeneSchritte: Array<{ id: string; label: string; phase: number }>;
  onSchliessen?: () => void;
  onAlleZeigen?: () => void;
}

// =============================================================================
// PHASEN-INFO
// =============================================================================

const PHASEN_LABELS = [
  { phase: 1, label: 'System-Setup', emoji: '⚙️' },
  { phase: 2, label: 'Stammdaten', emoji: '📋' },
  { phase: 3, label: 'Erste Nutzung', emoji: '🚀' },
  { phase: 4, label: 'Integration', emoji: '🔗' },
  { phase: 5, label: 'Routine', emoji: '✅' },
];

// =============================================================================
// KOMPONENTE
// =============================================================================

export function OnboardingBanner({
  prozent,
  aktuellePhase,
  offeneSchritte,
  onSchliessen,
  onAlleZeigen,
}: OnboardingBannerProps) {
  const [collapsed, setCollapsed] = useState(false);

  // Bei 100% nicht anzeigen
  if (prozent >= 100) return null;

  const aktuellePhaseInfo = PHASEN_LABELS.find(p => p.phase === aktuellePhase);

  if (collapsed) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setCollapsed(false)}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-full shadow-lg hover:bg-primary/90 transition-colors text-sm font-medium"
        >
          <span>🎯</span>
          <span>Onboarding: {prozent}%</span>
          <div className="w-12 h-1.5 bg-white/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all"
              style={{ width: `${prozent}%` }}
            />
          </div>
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-primary to-primary/80 text-white rounded-xl p-4 shadow-lg">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="text-2xl">🎼</div>
          <div>
            <h3 className="font-semibold text-lg">Willkommen bei Feldhub!</h3>
            <p className="text-white/80 text-sm mt-0.5">
              Du bist {prozent}% fertig mit dem Einrichten
            </p>
          </div>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => setCollapsed(true)}
            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors text-white/80 hover:text-white"
            aria-label="Minimieren"
          >
            ↘
          </button>
          {onSchliessen && (
            <button
              onClick={onSchliessen}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors text-white/80 hover:text-white"
              aria-label="Schließen"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Fortschrittsbalken */}
      <div className="mt-4">
        <div className="flex justify-between text-xs text-white/70 mb-1">
          <span>Fortschritt</span>
          <span>{prozent}%</span>
        </div>
        <div className="h-3 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-white rounded-full transition-all duration-500"
            style={{ width: `${prozent}%` }}
            role="progressbar"
            aria-valuenow={prozent}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
      </div>

      {/* Phasen */}
      <div className="flex gap-1 mt-3">
        {PHASEN_LABELS.map((p) => (
          <div
            key={p.phase}
            className={`flex-1 text-center py-1.5 rounded text-xs transition-all ${
              p.phase < aktuellePhase
                ? 'bg-white/30 text-white'
                : p.phase === aktuellePhase
                ? 'bg-white text-primary font-semibold'
                : 'bg-white/10 text-white/50'
            }`}
          >
            <div>{p.emoji}</div>
            <div className="hidden sm:block text-[10px] mt-0.5">{p.label}</div>
          </div>
        ))}
      </div>

      {/* Nächste Schritte */}
      {offeneSchritte.length > 0 && (
        <div className="mt-4">
          <p className="text-sm font-medium text-white/90 mb-2">Als nächstes:</p>
          <div className="space-y-1.5">
            {offeneSchritte.slice(0, 3).map((schritt) => (
              <div
                key={schritt.id}
                className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2 text-sm"
              >
                <span className="text-white/60">○</span>
                <span>{schritt.label}</span>
                <span className="ml-auto text-white/50 text-xs">Phase {schritt.phase}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      {onAlleZeigen && (
        <button
          onClick={onAlleZeigen}
          className="mt-3 w-full text-center text-white/70 hover:text-white text-sm transition-colors underline underline-offset-2"
        >
          Alle Schritte anzeigen →
        </button>
      )}
    </div>
  );
}

export default OnboardingBanner;
