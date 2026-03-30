# AppFabrik App Template

White-Label Mobile App Template für Field Service Management.

## 🚀 Quick Start

### 1. Template kopieren

```bash
# Neues Projekt erstellen
cp -r app-template ~/projects/kunde-app
cd ~/projects/kunde-app
```

### 2. Tenant konfigurieren

Bearbeite `config/tenant.ts`:

```typescript
export const appConfig: AppConfig = {
  id: 'mein-kunde',
  appName: 'Mein Kunde App',
  bundleId: 'com.meinkunde.app',
  api: {
    baseUrl: 'https://api.meinkunde.de/api',
    // ...
  },
  colors: {
    light: {
      primary: '#1E40AF',  // Kundenfarbe
      // ...
    },
  },
  // ...
};
```

### 3. Assets anpassen

```
assets/
├── logo.png            # App-Logo (512x512)
├── splash.png          # Splash Screen (1242x2688)
├── adaptive-icon.png   # Android Icon (512x512)
└── notification-icon.png
```

### 4. Installieren & Starten

```bash
npm install
npx expo start
```

### 5. EAS Build

```bash
# Einmalig: EAS Setup
eas build:configure

# Preview Build (Android)
eas build --platform android --profile preview

# Production Build
eas build --platform android --profile production
eas build --platform ios --profile production
```

---

## 📁 Projektstruktur

```
app-template/
├── app/                    # Expo Router Screens
│   ├── _layout.tsx         # Root Layout + Providers
│   ├── index.tsx           # Auth Redirect
│   ├── login.tsx           # Login Screen
│   ├── (admin)/            # Admin-Rolle Screens
│   ├── (gf)/               # Gruppenführer Screens
│   ├── (mitarbeiter)/      # Mitarbeiter Screens
│   └── (shared)/           # Geteilte Screens
├── components/             # UI Components
│   └── ui/                 # Basis-Komponenten
├── config/
│   └── tenant.ts           # ⭐ Tenant-Konfiguration
├── hooks/                  # Custom Hooks
├── lib/                    # Utilities
│   └── database/           # WatermelonDB
├── store/                  # Zustand Stores
├── theme/                  # Theme System
├── assets/                 # Icons, Splash, etc.
├── app.config.ts           # Expo Config
└── package.json
```

---

## ⚙️ Tenant-Konfiguration

Die `config/tenant.ts` enthält alle anpassbaren Aspekte:

### Grundinfo

```typescript
{
  id: 'mein-kunde',           // Unique ID
  appName: 'Mein Kunde App',  // Display Name
  bundleId: 'com.kunde.app',  // Bundle ID
  version: '1.0.0',
}
```

### API-Verbindung

```typescript
api: {
  baseUrl: 'https://api.kunde.de/api',
  wpBaseUrl: 'https://wordpress.kunde.de/wp-json/ka/v1', // optional
  syncEndpoint: '/sync',
  timeout: 30000,
}
```

### Farben

```typescript
colors: {
  light: {
    primary: '#2C5F2D',
    secondary: '#97BC62',
    background: '#F5F7F2',
    // ... vollständige Palette
  },
  dark: {
    // Dark Mode Farben
  },
}
```

### Module aktivieren/deaktivieren

```typescript
modules: {
  dashboard: { enabled: true, icon: 'home' },
  auftraege: { enabled: true, label: 'Aufträge' },
  protokolle: { enabled: true },
  // Branchenspezifisch:
  saatguternte: { enabled: false },  // Nur für Forst
  abnahmen: { enabled: false },
}
```

### Rollen

```typescript
roles: [
  {
    id: 'admin',
    name: 'Administrator',
    homeRoute: '/(admin)/dashboard',
    bottomTabs: ['dashboard', 'auftraege', 'team', 'einstellungen'],
  },
  {
    id: 'mitarbeiter',
    name: 'Mitarbeiter',
    homeRoute: '/(mitarbeiter)/start',
    bottomTabs: ['start', 'stunden', 'profil'],
  },
]
```

### Labels (Branchenanpassung)

```typescript
labels: {
  auftrag: 'Service-Auftrag',      // oder 'Pflanzauftrag'
  mitarbeiter: 'Techniker',        // oder 'Pflanzer'
  team: 'Service-Team',            // oder 'Pflanzkolonne'
}
```

### Features

```typescript
features: {
  offlineMode: true,
  pushNotifications: true,
  gpsTracking: true,
  photoCapture: true,
  signatureCapture: true,
  darkMode: true,
}
```

---

## 📱 Neue Screens hinzufügen

### 1. Generischer Screen

```typescript
// app/(mitarbeiter)/mein-screen.tsx

import { View, Text, StyleSheet, useColorScheme } from 'react-native';
import { getColors } from '../../config/tenant';

export default function MeinScreen() {
  const colorScheme = useColorScheme();
  const colors = getColors(colorScheme === 'dark' ? 'dark' : 'light');
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>
        Mein Screen
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 24, fontWeight: '600' },
});
```

### 2. Branchenspezifischer Screen

Für branchenspezifische Screens (z.B. Saatguternte):

```typescript
// app/(mitarbeiter)/saatgut/index.tsx

import { appConfig } from '../../../config/tenant';

export default function SaatgutScreen() {
  // Prüfen ob Modul aktiviert
  if (!appConfig.modules.saatguternte.enabled) {
    return null; // oder Redirect
  }
  
  // Screen-Logik...
}
```

---

## 🔄 Offline & Sync

### WatermelonDB Schema erweitern

```typescript
// lib/database/schema.ts

const meineTabelle = tableSchema({
  name: 'meine_daten',
  columns: [
    { name: 'remote_id', type: 'string' },
    { name: 'titel', type: 'string' },
    // ...
  ],
});
```

### Sync-Queue nutzen

```typescript
import { addToSyncQueue } from '../lib/database/syncQueue';

// Offline-Änderung queuen
await addToSyncQueue('meine_daten', entityId, 'create', payload);
```

---

## 🔔 Push Notifications

Das App-Template enthält einen vollständigen Push Notification Service mit Tenant-Konfiguration.

### Architektur

```
lib/notifications/
├── index.ts                  # Exports
├── types.ts                  # TypeScript Typen & Konfiguration
├── NotificationService.ts    # Singleton Service
├── NotificationProvider.tsx  # React Context Provider
└── useNotifications.ts       # React Hooks

components/notifications/
└── NotificationSettings.tsx  # Einstellungs-UI Komponente
```

### Setup in _layout.tsx

```typescript
import { NotificationProvider } from '../lib/notifications';
import { appConfig } from '../config/tenant';

export default function RootLayout() {
  return (
    <NotificationProvider
      apiBaseUrl={appConfig.api.baseUrl}
      config={appConfig.push}
      autoInit={true}
      autoRegister={false}  // Erst nach Login registrieren
    >
      <Stack />
    </NotificationProvider>
  );
}
```

### Nach Login registrieren

```typescript
import { useNotificationContext } from '../lib/notifications';

function AfterLoginScreen() {
  const { register, updateAuthToken } = useNotificationContext();
  
  useEffect(() => {
    // Auth-Token setzen
    updateAuthToken(userToken);
    
    // Push-Token registrieren (wenn in tenant.ts aktiviert)
    if (appConfig.push.requestOnLogin) {
      register();
    }
  }, [userToken]);
}
```

### Tenant-Konfiguration

In `config/tenant.ts`:

```typescript
push: {
  enabled: true,
  requestOnLogin: true,
  topics: ['all', 'auftraege', 'wetter'],
  enabledEvents: [
    'task.assigned',
    'task.updated',
    'task.due_soon',
    'message.received',
  ],
  quietHours: {
    enabled: true,
    start: '22:00',
    end: '07:00',
    allowCritical: true,
  },
  channels: [
    { id: 'tasks', name: 'Aufgaben', importance: 'high' },
    { id: 'messages', name: 'Nachrichten', importance: 'high' },
  ],
  routeMapping: {
    'task.assigned': '/(tabs)/auftraege/[id]',
    'message.received': '/(tabs)/messages/[id]',
  },
}
```

### Event-Typen

| Event | Beschreibung |
|-------|--------------|
| `task.assigned` | Neue Aufgabe zugewiesen |
| `task.updated` | Aufgabe aktualisiert |
| `task.due_soon` | Aufgabe bald fällig |
| `task.overdue` | Aufgabe überfällig |
| `message.received` | Neue Nachricht |
| `message.broadcast` | Team-Broadcast |
| `team.schedule_changed` | Zeitplan geändert |
| `document.signed` | Unterschrift benötigt |
| `system.update_available` | App-Update verfügbar |

### Hooks

```typescript
import { useNotifications, useNotificationReceived } from '../lib/notifications';

function MyComponent() {
  // Voller Zugriff
  const {
    token,
    unreadCount,
    permissionStatus,
    register,
    clearBadge,
    setEnabledEvents,
  } = useNotifications();

  // Notification-Listener
  useNotificationReceived((notification) => {
    console.log('Notification received:', notification);
  });
}
```

### Einstellungs-Screen

```typescript
import { NotificationSettings } from '../components/notifications';

// In app/(tabs)/einstellungen/benachrichtigungen.tsx
export default function BenachrichtigungenScreen() {
  return <NotificationSettings />;
}
```

### Backend-Endpunkte (erforderlich)

Das Backend muss folgende Endpunkte bereitstellen:

| Endpoint | Method | Beschreibung |
|----------|--------|--------------|
| `/api/push/register` | POST | Token registrieren |
| `/api/push/unregister` | POST | Token löschen |
| `/api/push/topics/subscribe` | POST | Topic abonnieren |
| `/api/push/topics/unsubscribe` | POST | Topic abbestellen |

**Register Body:**
```json
{
  "token": "ExponentPushToken[xxx]",
  "platform": "android",
  "deviceId": "..."
}
```

---

## 📦 Build & Deploy

### EAS Build Profile

Die `eas.json` enthält vorkonfigurierte Build-Profile:

| Profile | Zweck | Distribution |
|---------|-------|--------------|
| `development` | Dev-Client mit Hot Reload | Internal (APK/Simulator) |
| `preview` | Test-Builds für QA | Internal (APK) |
| `production` | Store-Ready Builds | Store (AAB/IPA) |

### Lokaler Build

```bash
# Preview Build (schnell, APK)
eas build --platform android --profile preview

# Production Build (AAB für Play Store)
eas build --platform android --profile production

# iOS Build
eas build --platform ios --profile production
```

### GitHub Actions (Automatisch)

Der `eas-build.yml` Workflow ermöglicht automatisierte Builds:

```yaml
# Manueller Trigger via GitHub UI:
# - Platform: android | ios | all
# - Profile: development | preview | production
# - Submit to Store: true/false
```

**Benötigte GitHub Secrets:**

| Secret | Beschreibung | Pflicht |
|--------|--------------|---------|
| `EXPO_TOKEN` | Expo Access Token | ✅ |
| `EAS_PROJECT_ID` | EAS Project ID | ✅ |
| `APPLE_ID` | Apple Developer Account | iOS Store |
| `ASC_APP_ID` | App Store Connect App ID | iOS Store |
| `APPLE_TEAM_ID` | Apple Team ID | iOS Store |

**Workflow auslösen:**
1. GitHub Repo → Actions → "EAS Build Pipeline"
2. "Run workflow" klicken
3. Parameter wählen → "Run workflow"

**Auto-Build bei Tags:**
```bash
git tag v1.0.0
git push origin v1.0.0
# → Triggert automatisch Production Build
```

### Umgebungsvariablen

```bash
# In EAS Secrets oder eas.json
EAS_PROJECT_ID=xxx
EXPO_PUBLIC_API_URL=https://api.kunde.de
EXPO_PUBLIC_WP_URL=https://wp.kunde.de/wp-json/ka/v1

# Optional
SENTRY_DSN=xxx
```

---

## 📋 Checkliste: Neuer Kunde

- [ ] Template kopieren
- [ ] `config/tenant.ts` anpassen (ID, Name, Farben, API)
- [ ] Assets erstellen (Logo, Splash, Icons)
- [ ] Bundle-ID in Expo-Konsole registrieren
- [ ] EAS-Projekt erstellen
- [ ] `eas.json` konfigurieren
- [ ] Secrets setzen (API-Keys, Sentry DSN)
- [ ] Preview-Build testen
- [ ] Production-Build erstellen
- [ ] App Store / Play Store Upload

---

## 🔗 Weitere Ressourcen

- [AppFabrik Web Template](../README.md)
- [Tenant Config Reference](./config/tenant.ts)
- [Expo Documentation](https://docs.expo.dev)
- [WatermelonDB Docs](https://watermelondb.dev)
