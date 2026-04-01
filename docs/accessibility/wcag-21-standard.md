# Feldhub Accessibility Standard — WCAG 2.1 AA

> Stand: 01.04.2026 | Sprint AF081 — axe-core Integration aktiv

## Überblick

Feldhub erfüllt **WCAG 2.1 Level AA** für alle Tenant-Oberflächen.
Das gilt als gesetzliche Mindestanforderung (EU Web Accessibility Directive)
und verbessert die Nutzbarkeit für alle Nutzer.

---

## 4 WCAG-Prinzipien (POUR)

| Prinzip | Was es bedeutet | Unsere Umsetzung |
|---------|-----------------|------------------|
| **P**erceivable | Inhalte müssen wahrnehmbar sein | Alt-Texte, Kontrast, Schriftgrößen |
| **O**perable | Bedienbar mit Tastatur + Hilfsmitteln | Fokus-Management, ARIA, skip-links |
| **U**nderstandable | Verständlich + vorhersehbar | Labels, Fehlermeldungen, Sprache |
| **R**obust | Kompatibel mit Hilfstechnologien | Semantisches HTML, ARIA-Rollen |

---

## Checkliste: Neue Komponenten

### ✅ Muss immer erfüllt sein

**Wahrnehmbarkeit:**
- [ ] Bilder haben `alt`-Text (oder `alt=""` wenn dekorativ)
- [ ] Kontrastverhältnis Text/Hintergrund ≥ 4.5:1 (normal) / 3:1 (groß)
- [ ] Schriftgröße min. 16px für Fließtext (12px für Labels akzeptabel)
- [ ] Informationen nicht nur durch Farbe vermittelt (+ Icon oder Text)
- [ ] Videos haben Untertitel (falls vorhanden)

**Bedienbarkeit:**
- [ ] Alle interaktiven Elemente per Tab erreichbar
- [ ] Fokus-Reihenfolge logisch (DOM-Reihenfolge = visuelle Reihenfolge)
- [ ] Fokus-Indikator sichtbar (`focus-visible` in Tailwind)
- [ ] Keine Tastatur-Fallen (modals: Fokus einschließen aber nicht fangen)
- [ ] Skip-Link "Zum Inhalt springen" am Seitenanfang

**Verständlichkeit:**
- [ ] `<html lang="de">` ist gesetzt
- [ ] Form-Inputs haben `<label>` (oder `aria-label`)
- [ ] Fehlermeldungen beschreiben das Problem + Lösungsweg
- [ ] Keine Zeitlimits (oder mit Warnung + Verlängerungsoption)

**Robustheit:**
- [ ] Semantisches HTML (`<nav>`, `<main>`, `<footer>`, `<article>`)
- [ ] ARIA nur wenn natives HTML nicht ausreicht
- [ ] ARIA-Attribute korrekt (keine falschen Werte)

---

## Kontrast-Anforderungen

### Text-Kontrast (WCAG 1.4.3)

| Element | Minimum | Empfohlen |
|---------|---------|-----------|
| Normaler Text (< 18px) | 4.5:1 | 7:1 |
| Großer Text (≥ 18px bold / ≥ 24px) | 3:1 | 4.5:1 |
| Placeholder-Text | 4.5:1 | — |
| Disabled (inaktiv) | Ausgenommen | — |
| Logo / dekorativ | Ausgenommen | — |

### UI-Komponenten-Kontrast (WCAG 1.4.11)

| Element | Minimum |
|---------|---------|
| Input-Border | 3:1 gegenüber Hintergrund |
| Button-Border / Fokus-Ring | 3:1 |
| Icons (informativ) | 3:1 |

### Feldhub Farb-Paare (Koch Aufforstung)

| Vordergrund | Hintergrund | Verhältnis | Erfüllt |
|-------------|-------------|-----------|---------|
| `#2C3A1C` (primary) | `#FFFFFF` | 9.8:1 | ✅ AAA |
| `#FFFFFF` | `#2C3A1C` (primary-bg) | 9.8:1 | ✅ AAA |
| `#C5A55A` (gold) | `#FFFFFF` | 2.4:1 | ❌ Nur für Deko |
| `#C5A55A` (gold) | `#2C3A1C` | 4.1:1 | ✅ für große Texte |
| `#555555` (gray) | `#FFFFFF` | 7.0:1 | ✅ AAA |
| `#888888` (muted) | `#FFFFFF` | 3.9:1 | ⚠️ Nur große Texte |

**⚠️ Gold `#C5A55A` darf nicht für normalen Text auf weißem Hintergrund genutzt werden!**  
Nur als dekorative Farbe oder auf dunkelgrünem Hintergrund.

---

## ARIA-Patterns (korrekte Nutzung)

### Dialog / Modal

```tsx
// ✅ Korrekt
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="dialog-title"
  aria-describedby="dialog-desc"
>
  <h2 id="dialog-title">Auftrag löschen</h2>
  <p id="dialog-desc">Möchten Sie diesen Auftrag wirklich löschen?</p>
  {/* Fokus beim Öffnen auf erstes fokussierbares Element */}
</div>
```

### Navigation

```tsx
// ✅ Korrekt
<nav aria-label="Hauptnavigation">
  <ul role="list">
    <li><a href="/auftraege" aria-current={isActive ? 'page' : undefined}>Aufträge</a></li>
  </ul>
</nav>
```

### Formular-Fehler

```tsx
// ✅ Korrekt
<div>
  <label htmlFor="email">E-Mail *</label>
  <input
    id="email"
    type="email"
    aria-describedby={error ? 'email-error' : undefined}
    aria-invalid={!!error}
  />
  {error && (
    <p id="email-error" role="alert" className="text-red-600 text-sm">
      {error}
    </p>
  )}
</div>
```

### Loading / Async

```tsx
// ✅ Korrekt
<div aria-live="polite" aria-atomic="true">
  {isLoading ? 'Daten werden geladen...' : `${count} Aufträge gefunden`}
</div>

// Für kritische Updates (z.B. Fehler):
<div role="alert" aria-live="assertive">
  {criticalError}
</div>
```

### Tabellen

```tsx
// ✅ Korrekt
<table>
  <caption className="sr-only">Auftrags-Übersicht</caption>
  <thead>
    <tr>
      <th scope="col">Auftrag</th>
      <th scope="col">Status</th>
      <th scope="col">
        <span className="sr-only">Aktionen</span>
      </th>
    </tr>
  </thead>
</table>
```

---

## Tailwind-Klassen für A11y

### Fokus-Styles (müssen IMMER vorhanden sein)

```tsx
// Standard Focus-Ring (für alle interaktiven Elemente)
className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"

// Für dunkle Hintergründe
className="focus-visible:ring-white focus-visible:ring-offset-primary"
```

### Screen-Reader-Only Text

```tsx
// Text nur für Screen-Reader sichtbar
<span className="sr-only">Schließen</span>

// Element komplett verstecken (auch für Screen-Reader)
<div aria-hidden="true">🌲</div>
```

### Skip-Link

```tsx
// Im RootLayout vor allem anderen
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 
             focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-white 
             focus:rounded-lg focus:shadow-lg"
>
  Zum Inhalt springen
</a>
```

---

## Testing-Toolchain

### 🚀 A11y-Tests ausführen

```bash
# Lokal alle A11y-Tests
npm run test:a11y

# Mit UI (Debug-Modus)
npm run test:a11y:ui

# Nur ein spezifischer Test
npx playwright test tests/a11y/main-pages.spec.ts --grep "Login"
```

### Automatisiert (CI)

| Tool | Was es prüft | Integration |
|------|-------------|-------------|
| `axe-core` via `@axe-core/playwright` | 40% aller WCAG-Regeln | Playwright Tests ✅ |
| `eslint-plugin-jsx-a11y` | JSX-spezifische A11y-Regeln | ESLint |
| Lighthouse CI | Accessibility Score ≥ 90 | GitHub Actions ✅ |

**GitHub Actions Workflow:** `.github/workflows/a11y.yml`  
Läuft automatisch bei PRs und auf main-Branch.

### Manuell (Checkliste vor Release)

1. **Keyboard-Only Navigation:** Tab durch alle Interaktionen
2. **Screen-Reader Test:** NVDA (Windows) / VoiceOver (Mac/iOS)
3. **Zoom 200%:** Layout bricht nicht, kein horizontales Scrolling
4. **High-Contrast Mode:** Windows High Contrast Mode testen
5. **Mobile:** Mindest-Touch-Target 44×44px (besonders im Außendienst!)

### ESLint-Konfiguration (jsx-a11y)

```js
// .eslintrc.js Ergänzung
module.exports = {
  extends: [
    'next/core-web-vitals',
    'plugin:jsx-a11y/recommended', // ← Hinzufügen
  ],
  plugins: ['jsx-a11y'],
  rules: {
    'jsx-a11y/alt-text': 'error',
    'jsx-a11y/aria-props': 'error',
    'jsx-a11y/aria-proptypes': 'error',
    'jsx-a11y/aria-unsupported-elements': 'error',
    'jsx-a11y/role-has-required-aria-props': 'error',
    'jsx-a11y/click-events-have-key-events': 'warn',
    'jsx-a11y/no-static-element-interactions': 'warn',
  },
};
```

### Playwright A11y-Test (Template)

```ts
// tests/a11y/main-pages.spec.ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility — Hauptseiten', () => {
  const pages = ['/dashboard', '/auftraege', '/mitarbeiter'];

  for (const page of pages) {
    test(`${page} hat keine WCAG-Verletzungen`, async ({ page: p }) => {
      await p.goto(page);
      
      const results = await new AxeBuilder({ page: p })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();
      
      expect(results.violations).toEqual([]);
    });
  }
});
```

---

## Spezielle Anforderungen: Außendienst-App

Mobile-App (Expo/React Native) hat eigene A11y-Anforderungen:

| Anforderung | React Native | Beschreibung |
|-------------|-------------|-------------|
| `accessibilityLabel` | Pflicht für Icons | Screen-Reader liest Label |
| `accessibilityRole` | Empfohlen | button, header, link, etc. |
| Touch-Targets | Min. 44×44 pt | Außendienst: Handschuhe! |
| Kontrast | Wie Web (4.5:1) | Direkte Sonne: höher besser |
| `accessible={true}` | Für komplexe Views | Gruppierung für Screen-Reader |

```tsx
// React Native — Beispiel Button
<TouchableOpacity
  accessible={true}
  accessibilityRole="button"
  accessibilityLabel="Auftrag abschließen"
  accessibilityHint="Markiert diesen Auftrag als erledigt"
  style={{ minWidth: 44, minHeight: 44 }}
>
  <Text>✓ Abschließen</Text>
</TouchableOpacity>
```

---

## Bekannte Ausnahmen

| Komponente | Problem | Begründung / Workaround |
|------------|---------|------------------------|
| Leaflet Karte | Nicht vollständig navigierbar | Karte ist ergänzend, Tabelle als Alternative |
| WaldkarteViewer | Map ohne Tastatur | Alt: Tabellarische Revierübersicht (RevierplanKarte) |
| PDFs | Teils nicht barrierefrei | Extern generiert, Roadmap: PDF/UA |

---

## Ressourcen

- [WCAG 2.1 Kurzreferenz (DE)](https://www.w3.org/WAI/WCAG21/quickref/?currentsidebar=%23col_customize)
- [ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Kontrast-Checker](https://webaim.org/resources/contrastchecker/)
- [Deque axe DevTools](https://www.deque.com/axe/)
- [jsx-a11y ESLint Plugin](https://github.com/jsx-eslint/eslint-plugin-jsx-a11y)
