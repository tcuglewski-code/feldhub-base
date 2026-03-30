/**
 * Demo-Tenant Konfiguration für AppFabrik Live-Demo
 * Zweck: Interessenten und potenzielle Kunden können die Plattform live erleben
 * URL: https://demo.appfabrik.de (oder Vercel-Preview)
 */

import { TenantConfig } from './tenant';

export const DEMO_TENANT_CONFIG: TenantConfig = {
  id: 'demo',
  name: 'DemoFirma GmbH',
  slug: 'demo',
  industry: 'fieldservice',
  locale: 'de',
  timezone: 'Europe/Berlin',
  currency: 'EUR',

  branding: {
    primaryColor: '#2563EB',
    secondaryColor: '#16A34A',
    logoUrl: '/demo/logo-demo.svg',
    favicon: '/demo/favicon.ico',
    appName: 'AppFabrik Demo',
    tagline: 'Ihr digitales Betriebssystem für den Außendienst',
  },

  features: {
    // Alle Features aktiviert für vollständige Demo
    orders: true,
    employees: true,
    customers: true,
    invoicing: true,
    timeTracking: true,
    gpsTracking: true,
    photos: true,
    reports: true,
    notifications: true,
    offlineMode: true,
    mobileApp: true,
    // Demo-spezifisch: Daten werden stündlich zurückgesetzt
    demoMode: true,
    demoResetInterval: 60, // Minuten
  },

  modules: [
    'core',
    'orders',
    'employees',
    'customers',
    'invoicing',
    'reports',
  ],

  limits: {
    maxUsers: 10,
    maxOrders: 100,
    maxCustomers: 50,
    storageGb: 1,
  },

  contact: {
    email: 'demo@appfabrik.de',
    phone: '+49 30 12345678',
    website: 'https://appfabrik.de',
  },

  // Demo-Zugänge (nur für Demo-Environment!)
  demoAccounts: [
    {
      role: 'admin',
      email: 'admin@demo.appfabrik.de',
      password: 'Demo2026!',
      name: 'Max Mustermann (Admin)',
    },
    {
      role: 'manager',
      email: 'manager@demo.appfabrik.de',
      password: 'Demo2026!',
      name: 'Maria Muster (Manager)',
    },
    {
      role: 'employee',
      email: 'mitarbeiter@demo.appfabrik.de',
      password: 'Demo2026!',
      name: 'Klaus Beispiel (Mitarbeiter)',
    },
  ],
};

export default DEMO_TENANT_CONFIG;
