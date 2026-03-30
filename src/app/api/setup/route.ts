import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { z } from 'zod';

/**
 * Setup API Route
 * 
 * POST /api/setup
 * Erstellt eine neue Tenant-Konfiguration basierend auf Wizard-Daten
 * 
 * SECURITY: Diese Route sollte in Produktion geschützt werden!
 */

// Validation Schema für Setup-Daten
const SetupDataSchema = z.object({
  // Step 1: Firma
  companyName: z.string().min(1, 'Firmenname erforderlich'),
  shortName: z.string().min(1).max(20),
  tagline: z.string().default(''),
  tenantId: z.string().min(1).regex(/^[a-z0-9-]+$/, 'Nur Kleinbuchstaben, Zahlen und Bindestriche'),
  
  // Step 2: Farben
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  
  // Step 3: Branding
  logoUrl: z.string().default('/logo.svg'),
  
  // Step 4: Admin
  adminName: z.string().min(1),
  adminEmail: z.string().email(),
  adminPassword: z.string().min(8),
  
  // Step 5: Features
  features: z.object({
    darkMode: z.boolean(),
    pushNotifications: z.boolean(),
    twoFactorAuth: z.boolean(),
    offlineMode: z.boolean(),
    gpsTracking: z.boolean(),
    customerPortal: z.boolean(),
    advancedReporting: z.boolean(),
  }),
});

type SetupData = z.infer<typeof SetupDataSchema>;

/**
 * Generiert helle und dunkle Varianten einer Farbe
 */
function generateColorVariants(hex: string): { light: string; dark: string } {
  // Parse hex to RGB
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  
  // Light variant: +40
  const lightR = Math.min(255, r + 40);
  const lightG = Math.min(255, g + 40);
  const lightB = Math.min(255, b + 40);
  
  // Dark variant: -40
  const darkR = Math.max(0, r - 40);
  const darkG = Math.max(0, g - 40);
  const darkB = Math.max(0, b - 40);
  
  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  
  return {
    light: `#${toHex(lightR)}${toHex(lightG)}${toHex(lightB)}`,
    dark: `#${toHex(darkR)}${toHex(darkG)}${toHex(darkB)}`,
  };
}

/**
 * Generiert die Tenant-Config TypeScript-Datei
 */
function generateTenantConfig(data: SetupData): string {
  const primaryVariants = generateColorVariants(data.primaryColor);
  const secondaryVariants = generateColorVariants(data.secondaryColor);
  
  const timestamp = new Date().toISOString();
  
  return `/**
 * Tenant Configuration: ${data.companyName}
 * 
 * Generiert am: ${timestamp}
 * Via AppFabrik Setup Wizard
 */

import { TenantConfig, registerTenant } from '../tenant';

export const ${data.tenantId.replace(/-/g, '_')}Tenant: TenantConfig = {
  id: '${data.tenantId}',
  name: '${data.companyName.replace(/'/g, "\\'")}',
  shortName: '${data.shortName.replace(/'/g, "\\'")}',
  tagline: '${(data.tagline || 'Field Service Management').replace(/'/g, "\\'")}',
  
  branding: {
    logo: '${data.logoUrl}',
    logoLight: '${data.logoUrl}',
    logoDark: '${data.logoUrl}',
    favicon: '/favicon.ico',
    appleTouchIcon: '/apple-touch-icon.png',
    ogImage: '/og-image.png',
  },
  
  colors: {
    // Brand
    primary: '${data.primaryColor}',
    primaryLight: '${primaryVariants.light}',
    primaryDark: '${primaryVariants.dark}',
    secondary: '${data.secondaryColor}',
    secondaryLight: '${secondaryVariants.light}',
    secondaryDark: '${secondaryVariants.dark}',
    
    // Background
    background: '#F8F7F2',
    backgroundAlt: '#FFFFFF',
    surface: '#FFFFFF',
    
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
    sidebarBg: '${data.primaryColor}',
    sidebarText: '#FFFFFF',
    sidebarActive: '${data.secondaryColor}',
  },
  
  typography: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    fontFamilyMono: "'JetBrains Mono', 'Fira Code', monospace",
    fontSizeBase: '16px',
  },
  
  locale: {
    language: 'de',
    timezone: 'Europe/Berlin',
    dateFormat: 'DD.MM.YYYY',
    timeFormat: 'HH:mm',
    currency: 'EUR',
    currencySymbol: '€',
  },
  
  modules: {
    dashboard: { enabled: true, icon: 'LayoutDashboard' },
    auftraege: { enabled: true, icon: 'ClipboardList' },
    mitarbeiter: { enabled: true, icon: 'Users' },
    lager: { enabled: true, icon: 'Warehouse' },
    fuhrpark: { enabled: true, icon: 'Truck' },
    rechnungen: { enabled: true, icon: 'Receipt' },
    protokolle: { enabled: true, icon: 'FileText' },
    kontakte: { enabled: true, icon: 'Contact' },
    dokumente: { enabled: true, icon: 'FolderOpen' },
    reports: { enabled: ${data.features.advancedReporting}, icon: 'BarChart3' },
    lohn: { enabled: true, icon: 'Banknote' },
    wochenplan: { enabled: true, icon: 'Calendar' },
    saisons: { enabled: true, icon: 'CalendarRange' },
    schulungen: { enabled: false, icon: 'GraduationCap' },
    gruppen: { enabled: true, icon: 'UsersRound' },
    angebote: { enabled: true, icon: 'FileSignature' },
    foerderung: { enabled: false, icon: 'Sprout' },
    abnahme: { enabled: false, icon: 'CheckSquare' },
    qualifikationen: { enabled: false, icon: 'Award' },
    saatguternte: { enabled: false, icon: 'TreeDeciduous' },
    flaechen: { enabled: false, icon: 'Map' },
  },
  
  roles: [
    {
      id: 'admin',
      name: 'Administrator',
      description: 'Voller Zugriff auf alle Funktionen',
      permissions: ['*'],
      canBeDeleted: false,
    },
    {
      id: 'manager',
      name: 'Manager',
      description: 'Verwaltet Teams und Operationen',
      permissions: [
        'auftraege:*',
        'mitarbeiter:read',
        'protokolle:*',
        'lager:*',
        'fuhrpark:*',
        'gruppen:*',
        'reports:read',
      ],
    },
    {
      id: 'worker',
      name: 'Mitarbeiter',
      description: 'Basis-Zugriff für Außendienst',
      permissions: [
        'auftraege:read',
        'protokolle:read',
        'protokolle:create',
        'stunden:create',
        'profil:*',
      ],
      isDefault: true,
    },
    {
      id: 'client',
      name: 'Kunde',
      description: 'Kundenportal-Zugang',
      permissions: [
        'kundenportal:*',
        'auftraege:read:own',
        'rechnungen:read:own',
        'dokumente:read:own',
      ],
    },
  ],
  defaultRole: 'worker',
  
  auth: {
    providers: ['credentials', 'magic-link'],
    sessionMaxAge: 30 * 24 * 60 * 60,
    requireEmailVerification: false,
    allowRegistration: false,
    passwordMinLength: 8,
  },
  
  database: {
    provider: 'neon',
  },
  
  branche: {
    id: 'generic',
    name: 'Allgemein',
    auftragstypen: [
      'Service',
      'Wartung',
      'Installation',
      'Reparatur',
      'Beratung',
      'Sonstiges',
    ],
    leistungseinheiten: [
      'Stück',
      'Stunde',
      'Pauschal',
      'lfm',
      'm²',
      'm³',
    ],
    protokollFelder: ['arbeitsbeginn', 'arbeitsende', 'leistung', 'bericht'],
    lagerKategorien: ['Material', 'Werkzeug', 'Ersatzteile', 'Verbrauchsmaterial'],
  },
  
  labels: {
    auftrag: 'Auftrag',
    auftraege: 'Aufträge',
    protokoll: 'Tagesprotokoll',
    protokolle: 'Tagesprotokolle',
    mitarbeiter: 'Mitarbeiter',
    mitarbeiterPlural: 'Mitarbeiter',
    lager: 'Lager',
    fuhrpark: 'Fuhrpark',
    kunde: 'Kunde',
    kunden: 'Kunden',
    rechnung: 'Rechnung',
    rechnungen: 'Rechnungen',
    dokument: 'Dokument',
    dokumente: 'Dokumente',
    kontakt: 'Kontakt',
    kontakte: 'Kontakte',
    gruppe: 'Team',
    gruppen: 'Teams',
    saison: 'Saison',
    saisons: 'Saisons',
    neuerAuftrag: 'Neuer Auftrag',
    neuerMitarbeiter: 'Neuer Mitarbeiter',
    neuesProtokoll: 'Neues Protokoll',
    statusOffen: 'Offen',
    statusInBearbeitung: 'In Bearbeitung',
    statusAbgeschlossen: 'Abgeschlossen',
  },
  
  contact: {
    email: '${data.adminEmail}',
    phone: '',
    address: '',
    plz: '',
    city: '',
    country: 'Deutschland',
  },
  
  legal: {
    companyName: '${data.companyName.replace(/'/g, "\\'")}',
    companyType: 'GmbH',
    privacyUrl: '/datenschutz',
    imprintUrl: '/impressum',
  },
  
  banking: {
    bankName: '',
    iban: '',
    bic: '',
  },
  
  integrations: {
    nextcloud: { enabled: false },
    wordpress: { enabled: false },
    stripe: { enabled: false },
    smtp: { enabled: false },
    webhooks: { enabled: false },
    slack: { enabled: false },
  },
  
  features: {
    darkMode: ${data.features.darkMode},
    multiLanguage: false,
    pushNotifications: ${data.features.pushNotifications},
    twoFactorAuth: ${data.features.twoFactorAuth},
    auditLog: true,
    offlineMode: ${data.features.offlineMode},
    gpsTracking: ${data.features.gpsTracking},
    signaturCapture: true,
    photoUpload: true,
    pdfExport: true,
    excelExport: true,
    customerPortal: ${data.features.customerPortal},
    apiAccess: false,
    advancedReporting: ${data.features.advancedReporting},
    bulkOperations: true,
    customFields: false,
    autoBackup: true,
  },
  
  ui: {
    sidebarStyle: 'collapsible',
    tableRowsPerPage: 25,
    showWelcomeOnboarding: true,
    defaultDashboardWidgets: ['stats', 'auftraege', 'aktivitaet'],
    dateRangePresets: ['heute', 'woche', 'monat', 'quartal', 'jahr'],
  },
  
  numberFormats: {
    auftrag: 'AU-{YYYY}-{NNNN}',
    rechnung: 'RE-{YYYY}-{NNNN}',
    angebot: 'AN-{YYYY}-{NNNN}',
    protokoll: 'TP-{YYYY}-{NNNN}',
  },
};

// Registriere den Tenant beim Import
registerTenant(${data.tenantId.replace(/-/g, '_')}Tenant);

export default ${data.tenantId.replace(/-/g, '_')}Tenant;
`;
}

/**
 * Generiert SQL für Admin-User Seed (optional)
 */
function generateAdminSeedSQL(data: SetupData): string {
  // In production würde bcrypt verwendet werden
  // Dies ist nur ein Platzhalter für das Seed-Script
  return `-- Admin User Seed für ${data.tenantId}
-- Führe dies nach der ersten Migration aus (mit gehashtem Passwort)

-- INSERT INTO "User" (id, name, email, password_hash, role, tenant_id, created_at)
-- VALUES (
--   gen_random_uuid(),
--   '${data.adminName.replace(/'/g, "''")}',
--   '${data.adminEmail}',
--   '<bcrypt_hash_of_${data.adminPassword.slice(0, 3)}...>',
--   'admin',
--   '${data.tenantId}',
--   NOW()
-- );

-- Hinweis: Passwort mit bcrypt hashen vor dem Einfügen!
-- Node.js: await bcrypt.hash('${data.adminPassword.slice(0, 3)}...', 12)
`;
}

export async function POST(req: NextRequest) {
  try {
    // Check if setup is enabled
    const setupEnabled = process.env.SETUP_ENABLED === 'true' || process.env.NODE_ENV === 'development';
    if (!setupEnabled) {
      return NextResponse.json(
        { error: 'Setup ist deaktiviert' },
        { status: 403 }
      );
    }

    const body = await req.json();
    
    // Validate input
    const parseResult = SetupDataSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Validierungsfehler', details: parseResult.error.issues },
        { status: 400 }
      );
    }
    
    const data = parseResult.data;
    
    // Check if tenant already exists
    const tenantsDir = path.join(process.cwd(), 'src', 'config', 'tenants');
    const tenantFilePath = path.join(tenantsDir, `${data.tenantId}.ts`);
    
    if (existsSync(tenantFilePath)) {
      return NextResponse.json(
        { error: `Tenant "${data.tenantId}" existiert bereits` },
        { status: 409 }
      );
    }
    
    // Ensure tenants directory exists
    if (!existsSync(tenantsDir)) {
      await mkdir(tenantsDir, { recursive: true });
    }
    
    // Generate and write tenant config
    const tenantConfig = generateTenantConfig(data);
    await writeFile(tenantFilePath, tenantConfig, 'utf-8');
    
    // Update index.ts to include new tenant
    const indexPath = path.join(tenantsDir, 'index.ts');
    let indexContent = '';
    
    if (existsSync(indexPath)) {
      const { readFile } = await import('fs/promises');
      indexContent = await readFile(indexPath, 'utf-8');
    }
    
    // Add import if not present
    const importLine = `import './${data.tenantId}';`;
    if (!indexContent.includes(importLine)) {
      indexContent = indexContent.trim() + '\n' + importLine + '\n';
      await writeFile(indexPath, indexContent, 'utf-8');
    }
    
    // Generate admin seed SQL (optional output)
    const seedSQL = generateAdminSeedSQL(data);
    const seedPath = path.join(tenantsDir, `${data.tenantId}.seed.sql`);
    await writeFile(seedPath, seedSQL, 'utf-8');
    
    return NextResponse.json({
      success: true,
      tenantId: data.tenantId,
      files: {
        config: tenantFilePath,
        seed: seedPath,
      },
      nextSteps: [
        `ENV-Variable setzen: TENANT_ID=${data.tenantId}`,
        'Prisma Migration ausführen: npx prisma migrate deploy',
        'Admin-User mit gehashtem Passwort in DB einfügen',
        'Anwendung deployen',
      ],
    });
    
  } catch (error) {
    console.error('Setup error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Setup fehlgeschlagen' },
      { status: 500 }
    );
  }
}

// GET für Status-Check
export async function GET() {
  const setupEnabled = process.env.SETUP_ENABLED === 'true' || process.env.NODE_ENV === 'development';
  
  return NextResponse.json({
    enabled: setupEnabled,
    message: setupEnabled
      ? 'Setup-Wizard ist verfügbar unter /setup'
      : 'Setup ist deaktiviert. Setze SETUP_ENABLED=true um es zu aktivieren.',
  });
}
