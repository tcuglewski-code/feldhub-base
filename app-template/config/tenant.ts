/**
 * AppFabrik Mobile App — Tenant Configuration
 * 
 * Diese Datei definiert alle konfigurierbaren Aspekte eines App-Tenants.
 * Analog zur Web-Tenant-Konfiguration (src/config/tenant.ts).
 * 
 * Workflow für neuen Kunden:
 * 1. Kopiere dieses Template
 * 2. Passe alle Werte an den Kunden an
 * 3. Update app.config.ts (Bundle-ID, App-Name, Icons)
 * 4. Build mit `eas build`
 */

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export interface AppColors {
  // Brand Colors
  primary: string;
  primaryLight: string;
  primaryDark: string;
  secondary: string;
  secondaryLight: string;
  
  // Background Colors
  background: string;
  backgroundAlt: string;
  surface: string;
  card: string;
  
  // Text Colors
  text: string;
  textMuted: string;
  textOnPrimary: string;
  textOnSecondary: string;
  
  // Semantic Colors
  success: string;
  successLight: string;
  warning: string;
  warningLight: string;
  error: string;
  errorLight: string;
  info: string;
  infoLight: string;
  
  // UI Elements
  border: string;
  divider: string;
  tabBarBg: string;
  tabBarActive: string;
  tabBarInactive: string;
  headerBg: string;
  headerText: string;
}

export interface AppModule {
  enabled: boolean;
  label?: string;
  icon?: string;        // Lucide or Ionicons name
  roles?: string[];     // Which roles can see this module
}

export interface AppRole {
  id: string;
  name: string;
  description: string;
  homeRoute: string;    // Initial route after login
  bottomTabs: string[]; // Which tabs to show
}

export interface AppFeatures {
  offlineMode: boolean;
  pushNotifications: boolean;
  gpsTracking: boolean;
  photoCapture: boolean;
  signatureCapture: boolean;
  qrScanner: boolean;
  biometricAuth: boolean;
  darkMode: boolean;
  hapticFeedback: boolean;
  crashReporting: boolean;   // Sentry
  updateBanner: boolean;     // In-app update check
}

export interface AppConfig {
  // ==========================================================================
  // APP IDENTITY
  // ==========================================================================
  id: string;                 // Unique tenant ID (matches web)
  appName: string;            // Display name
  shortName: string;          // Short name (home screen)
  bundleId: string;           // com.appfabrik.demo
  version: string;            // Semantic version
  
  // ==========================================================================
  // API CONNECTION
  // ==========================================================================
  api: {
    baseUrl: string;          // ForstManager/Web API
    wpBaseUrl?: string;       // WordPress API (if separate)
    syncEndpoint: string;     // Offline sync endpoint
    timeout: number;          // Request timeout (ms)
  };
  
  // ==========================================================================
  // BRANDING
  // ==========================================================================
  branding: {
    logo: string;             // require('./assets/logo.png')
    splashIcon: string;
    adaptiveIconFg: string;
    adaptiveIconBg: string;
  };
  
  // ==========================================================================
  // COLORS
  // ==========================================================================
  colors: {
    light: AppColors;
    dark: AppColors;
  };
  
  // ==========================================================================
  // LOCALE
  // ==========================================================================
  locale: {
    defaultLanguage: string;
    supportedLanguages: string[];
    dateFormat: string;
    timeFormat: string;
    currency: string;
    currencySymbol: string;
  };
  
  // ==========================================================================
  // MODULES
  // ==========================================================================
  modules: {
    // Core (immer vorhanden)
    dashboard: AppModule;
    auftraege: AppModule;
    zeiterfassung: AppModule;
    profil: AppModule;
    einstellungen: AppModule;
    
    // Optional
    protokolle: AppModule;
    team: AppModule;
    material: AppModule;
    karte: AppModule;
    benachrichtigungen: AppModule;
    dokumente: AppModule;
    sync: AppModule;
    hilfe: AppModule;
    
    // Branchenspezifisch
    saatguternte: AppModule;
    abnahmen: AppModule;
    qualifikationen: AppModule;
    saisons: AppModule;
    lager: AppModule;
    fuhrpark: AppModule;
    gruppen: AppModule;
  };
  
  // ==========================================================================
  // ROLES
  // ==========================================================================
  roles: AppRole[];
  defaultRole: string;
  
  // ==========================================================================
  // FEATURES
  // ==========================================================================
  features: AppFeatures;
  
  // ==========================================================================
  // LABELS (anpassbar für verschiedene Branchen)
  // ==========================================================================
  labels: {
    auftrag: string;
    auftraege: string;
    protokoll: string;
    protokolle: string;
    mitarbeiter: string;
    stunden: string;
    material: string;
    team: string;
    gruppe: string;
    dashboard: string;
  };
  
  // ==========================================================================
  // GPS & TRACKING
  // ==========================================================================
  gps: {
    enabled: boolean;
    trackingIntervalMs: number;       // Normal interval
    trackingIntervalMovingMs: number; // When moving
    trackingIntervalIdleMs: number;   // When stationary
    batteryThreshold: number;         // Pause below this %
  };
  
  // ==========================================================================
  // OFFLINE & SYNC
  // ==========================================================================
  offline: {
    enabled: boolean;
    syncIntervalMs: number;
    maxQueueSize: number;
    photoCompression: number;   // 0-1
    maxPhotoCacheMb: number;
  };
  
  // ==========================================================================
  // PUSH NOTIFICATIONS
  // ==========================================================================
  push: {
    enabled: boolean;
    requestOnLogin: boolean;
    topics: string[];           // FCM topics to subscribe
    
    /**
     * Event types that trigger notifications (tenant can enable/disable)
     */
    enabledEvents?: string[];
    
    /**
     * Quiet hours (no notifications during this time)
     */
    quietHours?: {
      enabled: boolean;
      start: string; // "22:00"
      end: string;   // "07:00"
      allowCritical: boolean;
    };
    
    /**
     * Custom notification channels for Android
     */
    channels?: Array<{
      id: string;
      name: string;
      description?: string;
      importance: 'min' | 'low' | 'default' | 'high' | 'max';
      sound?: boolean;
      vibration?: boolean;
    }>;
    
    /**
     * Route mapping for event types → deep links
     */
    routeMapping?: Record<string, string>;
  };
  
  // ==========================================================================
  // UI SETTINGS
  // ==========================================================================
  ui: {
    tabBarPosition: 'bottom' | 'top';
    headerStyle: 'default' | 'large' | 'transparent';
    cardStyle: 'elevated' | 'outlined' | 'filled';
    animationsEnabled: boolean;
  };
}

// =============================================================================
// DEFAULT CONFIGURATION (Template)
// =============================================================================

export const defaultColors: AppColors = {
  // Brand
  primary: '#2C3A1C',
  primaryLight: '#4A6030',
  primaryDark: '#1A2410',
  secondary: '#C5A55A',
  secondaryLight: '#D4BC7F',
  
  // Background
  background: '#F8F7F2',
  backgroundAlt: '#FFFFFF',
  surface: '#FFFFFF',
  card: '#FFFFFF',
  
  // Text
  text: '#1A1A1A',
  textMuted: '#6B7280',
  textOnPrimary: '#FFFFFF',
  textOnSecondary: '#1A1A1A',
  
  // Semantic
  success: '#16A34A',
  successLight: '#DCFCE7',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  error: '#DC2626',
  errorLight: '#FEE2E2',
  info: '#3B82F6',
  infoLight: '#DBEAFE',
  
  // UI
  border: '#E5E7EB',
  divider: '#E5E7EB',
  tabBarBg: '#FFFFFF',
  tabBarActive: '#2C3A1C',
  tabBarInactive: '#9CA3AF',
  headerBg: '#2C3A1C',
  headerText: '#FFFFFF',
};

export const darkColors: AppColors = {
  // Brand
  primary: '#4A6030',
  primaryLight: '#6B8045',
  primaryDark: '#2C3A1C',
  secondary: '#C5A55A',
  secondaryLight: '#D4BC7F',
  
  // Background
  background: '#121212',
  backgroundAlt: '#1E1E1E',
  surface: '#2A2A2A',
  card: '#2A2A2A',
  
  // Text
  text: '#F5F5F5',
  textMuted: '#9CA3AF',
  textOnPrimary: '#FFFFFF',
  textOnSecondary: '#1A1A1A',
  
  // Semantic
  success: '#22C55E',
  successLight: '#14532D',
  warning: '#FBBF24',
  warningLight: '#451A03',
  error: '#EF4444',
  errorLight: '#450A0A',
  info: '#60A5FA',
  infoLight: '#1E3A5F',
  
  // UI
  border: '#374151',
  divider: '#374151',
  tabBarBg: '#1E1E1E',
  tabBarActive: '#C5A55A',
  tabBarInactive: '#6B7280',
  headerBg: '#1E1E1E',
  headerText: '#F5F5F5',
};

export const appConfig: AppConfig = {
  id: 'appfabrik-demo',
  appName: 'AppFabrik Field',
  shortName: 'Field',
  bundleId: 'com.appfabrik.field',
  version: '1.0.0',
  
  api: {
    baseUrl: 'https://demo.appfabrik.de/api',
    syncEndpoint: '/sync',
    timeout: 30000,
  },
  
  branding: {
    logo: './assets/logo.png',
    splashIcon: './assets/splash.png',
    adaptiveIconFg: './assets/adaptive-icon.png',
    adaptiveIconBg: '#2C3A1C',
  },
  
  colors: {
    light: defaultColors,
    dark: darkColors,
  },
  
  locale: {
    defaultLanguage: 'de',
    supportedLanguages: ['de', 'en'],
    dateFormat: 'DD.MM.YYYY',
    timeFormat: 'HH:mm',
    currency: 'EUR',
    currencySymbol: '€',
  },
  
  modules: {
    // Core
    dashboard: { enabled: true, icon: 'home', label: 'Start' },
    auftraege: { enabled: true, icon: 'clipboard-list', label: 'Aufträge' },
    zeiterfassung: { enabled: true, icon: 'clock', label: 'Zeiten' },
    profil: { enabled: true, icon: 'user' },
    einstellungen: { enabled: true, icon: 'settings' },
    
    // Optional
    protokolle: { enabled: true, icon: 'file-text', label: 'Protokolle' },
    team: { enabled: true, icon: 'users', label: 'Team' },
    material: { enabled: true, icon: 'package', label: 'Material' },
    karte: { enabled: true, icon: 'map', label: 'Karte' },
    benachrichtigungen: { enabled: true, icon: 'bell' },
    dokumente: { enabled: true, icon: 'folder' },
    sync: { enabled: true, icon: 'refresh-cw' },
    hilfe: { enabled: true, icon: 'help-circle' },
    
    // Branchenspezifisch (deaktiviert im Template)
    saatguternte: { enabled: false, icon: 'tree-deciduous' },
    abnahmen: { enabled: false, icon: 'check-square' },
    qualifikationen: { enabled: false, icon: 'award' },
    saisons: { enabled: false, icon: 'calendar-range' },
    lager: { enabled: false, icon: 'warehouse' },
    fuhrpark: { enabled: false, icon: 'truck' },
    gruppen: { enabled: false, icon: 'users-round' },
  },
  
  roles: [
    {
      id: 'admin',
      name: 'Administrator',
      description: 'Voller Zugriff',
      homeRoute: '/(admin)/dashboard',
      bottomTabs: ['dashboard', 'auftraege', 'team', 'einstellungen'],
    },
    {
      id: 'gruppenführer',
      name: 'Gruppenführer',
      description: 'Team-Leitung',
      homeRoute: '/(gf)/dashboard',
      bottomTabs: ['dashboard', 'auftraege', 'protokolle', 'team'],
    },
    {
      id: 'mitarbeiter',
      name: 'Mitarbeiter',
      description: 'Außendienst',
      homeRoute: '/(mitarbeiter)/start',
      bottomTabs: ['start', 'stunden', 'profil'],
    },
  ],
  defaultRole: 'mitarbeiter',
  
  features: {
    offlineMode: true,
    pushNotifications: true,
    gpsTracking: true,
    photoCapture: true,
    signatureCapture: true,
    qrScanner: true,
    biometricAuth: false,
    darkMode: true,
    hapticFeedback: true,
    crashReporting: true,
    updateBanner: true,
  },
  
  labels: {
    auftrag: 'Auftrag',
    auftraege: 'Aufträge',
    protokoll: 'Protokoll',
    protokolle: 'Protokolle',
    mitarbeiter: 'Mitarbeiter',
    stunden: 'Stunden',
    material: 'Material',
    team: 'Team',
    gruppe: 'Team',
    dashboard: 'Übersicht',
  },
  
  gps: {
    enabled: true,
    trackingIntervalMs: 60000,        // 1 min normal
    trackingIntervalMovingMs: 30000,  // 30s when moving
    trackingIntervalIdleMs: 300000,   // 5 min when idle
    batteryThreshold: 10,
  },
  
  offline: {
    enabled: true,
    syncIntervalMs: 300000,           // 5 min
    maxQueueSize: 100,
    photoCompression: 0.7,
    maxPhotoCacheMb: 500,
  },
  
  push: {
    enabled: true,
    requestOnLogin: true,
    topics: ['all', 'auftraege'],
    enabledEvents: [
      'task.assigned',
      'task.updated',
      'task.due_soon',
      'message.received',
      'message.broadcast',
      'system.update_available',
    ],
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '07:00',
      allowCritical: true,
    },
    channels: [
      { id: 'default', name: 'Allgemein', importance: 'default', sound: true, vibration: true },
      { id: 'tasks', name: 'Aufgaben', importance: 'high', sound: true, vibration: true },
      { id: 'messages', name: 'Nachrichten', importance: 'high', sound: true, vibration: true },
      { id: 'system', name: 'System', importance: 'low', sound: false, vibration: false },
    ],
    routeMapping: {
      'task.assigned': '/(tabs)/auftraege/[id]',
      'task.updated': '/(tabs)/auftraege/[id]',
      'task.due_soon': '/(tabs)/auftraege/[id]',
      'message.received': '/(tabs)/messages/[id]',
      'message.broadcast': '/(tabs)/messages',
    },
  },
  
  ui: {
    tabBarPosition: 'bottom',
    headerStyle: 'default',
    cardStyle: 'elevated',
    animationsEnabled: true,
  },
};

// =============================================================================
// REFERENCE CONFIG: KOCH AUFFORSTUNG
// =============================================================================

export const kochAufforstungAppConfig: AppConfig = {
  id: 'koch-aufforstung',
  appName: 'Koch Aufforstung',
  shortName: 'KA App',
  bundleId: 'com.kochaufforstung.app',
  version: '1.9.0',
  
  api: {
    baseUrl: 'https://ka-forstmanager.vercel.app/api',
    wpBaseUrl: 'https://peru-otter-113714.hostingersite.com/wp-json/ka/v1',
    syncEndpoint: '/sync',
    timeout: 30000,
  },
  
  branding: {
    logo: './assets/logo-koch.png',
    splashIcon: './assets/splash-koch.png',
    adaptiveIconFg: './assets/adaptive-icon-koch.png',
    adaptiveIconBg: '#2C5F2D',
  },
  
  colors: {
    light: {
      ...defaultColors,
      primary: '#2C5F2D',
      primaryLight: '#4A8C4B',
      primaryDark: '#1A3A1A',
      secondary: '#97BC62',
      secondaryLight: '#B5D389',
      background: '#F5F7F2',
      tabBarActive: '#2C5F2D',
      headerBg: '#1A3A1A',
    },
    dark: {
      ...darkColors,
      primary: '#4A8C4B',
      primaryLight: '#6BAF6C',
      primaryDark: '#2C5F2D',
      secondary: '#97BC62',
      tabBarActive: '#97BC62',
    },
  },
  
  locale: {
    defaultLanguage: 'de',
    supportedLanguages: ['de', 'pl', 'ro'],
    dateFormat: 'DD.MM.YYYY',
    timeFormat: 'HH:mm',
    currency: 'EUR',
    currencySymbol: '€',
  },
  
  modules: {
    // Core
    dashboard: { enabled: true, icon: 'home', label: 'Start' },
    auftraege: { enabled: true, icon: 'tree-deciduous', label: 'Pflanzaufträge' },
    zeiterfassung: { enabled: true, icon: 'clock', label: 'Stunden' },
    profil: { enabled: true, icon: 'user' },
    einstellungen: { enabled: true, icon: 'settings' },
    
    // Optional
    protokolle: { enabled: true, icon: 'file-text', label: 'Pflanzprotokolle' },
    team: { enabled: true, icon: 'users', label: 'Kolonne' },
    material: { enabled: true, icon: 'package', label: 'Pflanzgut' },
    karte: { enabled: true, icon: 'map', label: 'Flächen' },
    benachrichtigungen: { enabled: true, icon: 'bell' },
    dokumente: { enabled: true, icon: 'folder' },
    sync: { enabled: true, icon: 'refresh-cw' },
    hilfe: { enabled: true, icon: 'help-circle' },
    
    // Branchenspezifisch (aktiviert für Forst)
    saatguternte: { enabled: true, icon: 'tree-deciduous', label: 'Saatguternte' },
    abnahmen: { enabled: true, icon: 'check-square', label: 'Abnahmen' },
    qualifikationen: { enabled: true, icon: 'award' },
    saisons: { enabled: true, icon: 'calendar-range', label: 'Pflanzsaisons' },
    lager: { enabled: true, icon: 'warehouse', label: 'Pflanzgutlager' },
    fuhrpark: { enabled: true, icon: 'truck' },
    gruppen: { enabled: true, icon: 'users-round', label: 'Pflanzkolonnen' },
  },
  
  roles: [
    {
      id: 'admin',
      name: 'Administrator',
      description: 'Voller Zugriff',
      homeRoute: '/(admin)/dashboard',
      bottomTabs: ['dashboard', 'auftraege', 'mitarbeiter', 'lager', 'einstellungen'],
    },
    {
      id: 'gruppenführer',
      name: 'Gruppenführer',
      description: 'Leitet Pflanzkolonne',
      homeRoute: '/(gf)/dashboard',
      bottomTabs: ['dashboard', 'auftraege', 'tagesprotokoll', 'team', 'material'],
    },
    {
      id: 'mitarbeiter',
      name: 'Pflanzer',
      description: 'Außendienst',
      homeRoute: '/(mitarbeiter)/start',
      bottomTabs: ['start', 'session', 'stunden', 'profil'],
    },
    {
      id: 'foerster',
      name: 'Förster',
      description: 'Abnahmen & Prüfung',
      homeRoute: '/(foerster)/dashboard',
      bottomTabs: ['dashboard', 'abnahmen', 'flaechen', 'einstellungen'],
    },
  ],
  defaultRole: 'mitarbeiter',
  
  features: {
    offlineMode: true,       // Wichtig im Wald!
    pushNotifications: true,
    gpsTracking: true,
    photoCapture: true,
    signatureCapture: true,
    qrScanner: true,
    biometricAuth: false,
    darkMode: true,
    hapticFeedback: true,
    crashReporting: true,
    updateBanner: true,
  },
  
  labels: {
    auftrag: 'Pflanzauftrag',
    auftraege: 'Pflanzaufträge',
    protokoll: 'Pflanzprotokoll',
    protokolle: 'Pflanzprotokolle',
    mitarbeiter: 'Pflanzer',
    stunden: 'Arbeitsstunden',
    material: 'Pflanzgut',
    team: 'Pflanzkolonne',
    gruppe: 'Kolonne',
    dashboard: 'Übersicht',
  },
  
  gps: {
    enabled: true,
    trackingIntervalMs: 60000,
    trackingIntervalMovingMs: 30000,
    trackingIntervalIdleMs: 300000,
    batteryThreshold: 10,
  },
  
  offline: {
    enabled: true,
    syncIntervalMs: 300000,
    maxQueueSize: 200,
    photoCompression: 0.7,
    maxPhotoCacheMb: 1000,    // Mehr Platz für Waldfotos
  },
  
  push: {
    enabled: true,
    requestOnLogin: true,
    topics: ['all', 'pflanzauftraege', 'abnahmen', 'wetter'],
    enabledEvents: [
      'task.assigned',
      'task.updated',
      'task.due_soon',
      'task.overdue',
      'message.received',
      'message.broadcast',
      'team.schedule_changed',
      'document.signed',
      'system.update_available',
    ],
    quietHours: {
      enabled: true,
      start: '21:00',
      end: '06:00',
      allowCritical: true,
    },
    channels: [
      { id: 'default', name: 'Allgemein', importance: 'default', sound: true, vibration: true },
      { id: 'pflanzauftraege', name: 'Pflanzaufträge', importance: 'high', sound: true, vibration: true },
      { id: 'abnahmen', name: 'Abnahmen', importance: 'high', sound: true, vibration: true },
      { id: 'wetter', name: 'Wetter', description: 'Wetterwarnung', importance: 'high', sound: true, vibration: true },
      { id: 'system', name: 'System', importance: 'low', sound: false, vibration: false },
    ],
    routeMapping: {
      'task.assigned': '/(tabs)/auftraege/[id]',
      'task.updated': '/(tabs)/auftraege/[id]',
      'task.due_soon': '/(tabs)/auftraege/[id]',
      'task.overdue': '/(tabs)/auftraege',
      'message.received': '/(tabs)/messages/[id]',
      'team.schedule_changed': '/(tabs)/team',
      'document.signed': '/(tabs)/dokumente/[id]',
    },
  },
  
  ui: {
    tabBarPosition: 'bottom',
    headerStyle: 'default',
    cardStyle: 'elevated',
    animationsEnabled: true,
  },
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Returns the appropriate color palette based on color scheme
 */
export function getColors(
  scheme: 'light' | 'dark',
  config: AppConfig = appConfig
): AppColors {
  return scheme === 'dark' ? config.colors.dark : config.colors.light;
}

/**
 * Returns enabled modules for a specific role
 */
export function getModulesForRole(
  roleId: string,
  config: AppConfig = appConfig
): string[] {
  const role = config.roles.find(r => r.id === roleId);
  if (!role) return [];
  
  return Object.entries(config.modules)
    .filter(([, mod]) => {
      if (!mod.enabled) return false;
      if (mod.roles && !mod.roles.includes(roleId)) return false;
      return true;
    })
    .map(([key]) => key);
}

/**
 * Returns bottom tabs for a specific role
 */
export function getBottomTabs(
  roleId: string,
  config: AppConfig = appConfig
): string[] {
  const role = config.roles.find(r => r.id === roleId);
  return role?.bottomTabs || [];
}

/**
 * Returns the home route for a role
 */
export function getHomeRoute(
  roleId: string,
  config: AppConfig = appConfig
): string {
  const role = config.roles.find(r => r.id === roleId);
  return role?.homeRoute || '/(mitarbeiter)/start';
}

/**
 * Gets a label with fallback
 */
export function getLabel(
  key: keyof AppConfig['labels'],
  config: AppConfig = appConfig
): string {
  return config.labels[key] || key;
}

// =============================================================================
// EXPORT
// =============================================================================

export type { AppConfig, AppColors, AppModule, AppRole, AppFeatures };
export default appConfig;
