import SetupWizard from '@/components/setup/SetupWizard';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Setup | AppFabrik',
  description: 'Neuen Tenant einrichten',
  robots: 'noindex, nofollow',
};

/**
 * Setup-Seite für neue Tenants
 * Außerhalb des Dashboards, kein Login erforderlich
 * 
 * SECURITY: Diese Seite sollte in Produktion geschützt werden:
 * - Via SETUP_ENABLED=true ENV Variable
 * - Oder IP-Whitelist
 * - Oder einmaligem Setup-Token
 */
export default function SetupPage() {
  // Optional: Check if setup is enabled via ENV
  const setupEnabled = process.env.SETUP_ENABLED === 'true' || process.env.NODE_ENV === 'development';
  
  if (!setupEnabled) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Setup deaktiviert</h1>
          <p className="text-gray-600 mb-4">
            Die Setup-Seite ist in der Produktionsumgebung deaktiviert.
          </p>
          <p className="text-sm text-gray-500">
            Setzen Sie <code className="bg-gray-100 px-1 rounded">SETUP_ENABLED=true</code> um das Setup zu aktivieren.
          </p>
        </div>
      </div>
    );
  }

  return <SetupWizard />;
}
