'use client';

import { useState } from 'react';
import { Building2, Palette, Image, UserPlus, Settings, ChevronLeft, ChevronRight, Check, Loader2 } from 'lucide-react';

/**
 * Setup Wizard für neue Tenants
 * 5 Schritte: Firmenname → Farben → Logo → Admin-User → Features
 */

interface WizardData {
  // Step 1: Firma
  companyName: string;
  shortName: string;
  tagline: string;
  tenantId: string;
  
  // Step 2: Farben
  primaryColor: string;
  secondaryColor: string;
  
  // Step 3: Branding
  logoUrl: string;
  
  // Step 4: Admin
  adminName: string;
  adminEmail: string;
  adminPassword: string;
  adminPasswordConfirm: string;
  
  // Step 5: Features
  features: {
    darkMode: boolean;
    pushNotifications: boolean;
    twoFactorAuth: boolean;
    offlineMode: boolean;
    gpsTracking: boolean;
    customerPortal: boolean;
    advancedReporting: boolean;
  };
}

const initialData: WizardData = {
  companyName: '',
  shortName: '',
  tagline: '',
  tenantId: '',
  primaryColor: '#2D5016',
  secondaryColor: '#8B4513',
  logoUrl: '/logo.svg',
  adminName: '',
  adminEmail: '',
  adminPassword: '',
  adminPasswordConfirm: '',
  features: {
    darkMode: true,
    pushNotifications: true,
    twoFactorAuth: true,
    offlineMode: false,
    gpsTracking: true,
    customerPortal: false,
    advancedReporting: false,
  },
};

const steps = [
  { id: 1, name: 'Firma', icon: Building2, description: 'Firmendaten eingeben' },
  { id: 2, name: 'Farben', icon: Palette, description: 'Brand-Farben wählen' },
  { id: 3, name: 'Logo', icon: Image, description: 'Logo konfigurieren' },
  { id: 4, name: 'Admin', icon: UserPlus, description: 'Admin-Benutzer anlegen' },
  { id: 5, name: 'Features', icon: Settings, description: 'Module aktivieren' },
];

// Color presets für einfache Auswahl
const colorPresets = {
  forest: { primary: '#2D5016', secondary: '#8B4513', name: 'Wald' },
  ocean: { primary: '#0369a1', secondary: '#0891b2', name: 'Ozean' },
  sunset: { primary: '#c2410c', secondary: '#a16207', name: 'Sonnenuntergang' },
  lavender: { primary: '#7c3aed', secondary: '#a855f7', name: 'Lavendel' },
  slate: { primary: '#334155', secondary: '#64748b', name: 'Schiefer' },
  emerald: { primary: '#047857', secondary: '#10b981', name: 'Smaragd' },
};

export default function SetupWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<WizardData>(initialData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const updateData = (updates: Partial<WizardData>) => {
    setData(prev => ({ ...prev, ...updates }));
  };

  const updateFeature = (feature: keyof WizardData['features'], value: boolean) => {
    setData(prev => ({
      ...prev,
      features: { ...prev.features, [feature]: value },
    }));
  };

  // Auto-generate tenantId from shortName
  const generateTenantId = (shortName: string) => {
    return shortName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const validateStep = (step: number): string | null => {
    switch (step) {
      case 1:
        if (!data.companyName.trim()) return 'Firmenname ist erforderlich';
        if (!data.shortName.trim()) return 'Kurzname ist erforderlich';
        if (data.shortName.length > 20) return 'Kurzname darf max. 20 Zeichen haben';
        break;
      case 2:
        if (!/^#[0-9A-Fa-f]{6}$/.test(data.primaryColor)) return 'Ungültige Primärfarbe';
        if (!/^#[0-9A-Fa-f]{6}$/.test(data.secondaryColor)) return 'Ungültige Sekundärfarbe';
        break;
      case 3:
        // Logo URL optional
        break;
      case 4:
        if (!data.adminName.trim()) return 'Admin-Name ist erforderlich';
        if (!data.adminEmail.trim()) return 'Admin-Email ist erforderlich';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.adminEmail)) return 'Ungültige Email-Adresse';
        if (data.adminPassword.length < 8) return 'Passwort muss mind. 8 Zeichen haben';
        if (data.adminPassword !== data.adminPasswordConfirm) return 'Passwörter stimmen nicht überein';
        break;
    }
    return null;
  };

  const nextStep = () => {
    const validationError = validateStep(currentStep);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    
    // Auto-generate tenantId when leaving step 1
    if (currentStep === 1 && !data.tenantId) {
      updateData({ tenantId: generateTenantId(data.shortName) });
    }
    
    setCurrentStep(prev => Math.min(prev + 1, 5));
  };

  const prevStep = () => {
    setError(null);
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    const validationError = validateStep(currentStep);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          tenantId: data.tenantId || generateTenantId(data.shortName),
        }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Setup fehlgeschlagen');
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Setup abgeschlossen!</h2>
          <p className="text-gray-600 mb-6">
            Tenant <span className="font-mono font-semibold">{data.tenantId}</span> wurde erfolgreich eingerichtet.
          </p>
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-semibold text-gray-900 mb-2">Nächste Schritte:</h3>
            <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
              <li>ENV-Variable <code className="bg-gray-200 px-1 rounded">TENANT_ID={data.tenantId}</code> setzen</li>
              <li>Database-Migrations ausführen</li>
              <li>Anwendung neu deployen</li>
            </ol>
          </div>
          <a
            href="/login"
            className="inline-flex items-center justify-center px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
          >
            Zum Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">AppFabrik Setup</h1>
          <p className="text-gray-600">Neuen Tenant in 5 einfachen Schritten einrichten</p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-between mb-8 relative">
          <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200" />
          <div
            className="absolute top-5 left-0 h-0.5 bg-green-600 transition-all duration-500"
            style={{ width: `${((currentStep - 1) / 4) * 100}%` }}
          />
          {steps.map((step) => {
            const StepIcon = step.icon;
            const isActive = step.id === currentStep;
            const isCompleted = step.id < currentStep;
            
            return (
              <div key={step.id} className="relative z-10 flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                    isCompleted
                      ? 'bg-green-600 text-white'
                      : isActive
                      ? 'bg-green-600 text-white ring-4 ring-green-100'
                      : 'bg-white text-gray-400 border-2 border-gray-200'
                  }`}
                >
                  {isCompleted ? <Check className="w-5 h-5" /> : <StepIcon className="w-5 h-5" />}
                </div>
                <span
                  className={`mt-2 text-xs font-medium ${
                    isActive ? 'text-green-600' : 'text-gray-500'
                  }`}
                >
                  {step.name}
                </span>
              </div>
            );
          })}
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Step Content */}
          <div className="min-h-[320px]">
            {/* Step 1: Firma */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-1">Firmendaten</h2>
                  <p className="text-gray-500 text-sm">Grundinformationen über Ihr Unternehmen</p>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Firmenname *
                    </label>
                    <input
                      type="text"
                      value={data.companyName}
                      onChange={(e) => updateData({ companyName: e.target.value })}
                      placeholder="Mustermann Landschaftsbau GmbH"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Kurzname * <span className="text-gray-400 font-normal">(max. 20 Zeichen)</span>
                    </label>
                    <input
                      type="text"
                      value={data.shortName}
                      onChange={(e) => updateData({ shortName: e.target.value.slice(0, 20) })}
                      placeholder="Mustermann"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Wird in der Navigation und als Tenant-ID verwendet
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Slogan/Tagline
                    </label>
                    <input
                      type="text"
                      value={data.tagline}
                      onChange={(e) => updateData({ tagline: e.target.value })}
                      placeholder="Professionelle Grünpflege seit 1990"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Farben */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-1">Brand-Farben</h2>
                  <p className="text-gray-500 text-sm">Wählen Sie Ihre Unternehmensfarben</p>
                </div>

                {/* Color Presets */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Farbpalette wählen
                  </label>
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                    {Object.entries(colorPresets).map(([key, preset]) => (
                      <button
                        key={key}
                        onClick={() =>
                          updateData({ primaryColor: preset.primary, secondaryColor: preset.secondary })
                        }
                        className={`p-2 rounded-lg border-2 transition-all ${
                          data.primaryColor === preset.primary
                            ? 'border-green-500 ring-2 ring-green-200'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex gap-1 mb-1">
                          <div
                            className="w-6 h-6 rounded"
                            style={{ backgroundColor: preset.primary }}
                          />
                          <div
                            className="w-6 h-6 rounded"
                            style={{ backgroundColor: preset.secondary }}
                          />
                        </div>
                        <span className="text-xs text-gray-600">{preset.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Colors */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Primärfarbe
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={data.primaryColor}
                        onChange={(e) => updateData({ primaryColor: e.target.value })}
                        className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={data.primaryColor}
                        onChange={(e) => updateData({ primaryColor: e.target.value })}
                        placeholder="#2D5016"
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sekundärfarbe
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={data.secondaryColor}
                        onChange={(e) => updateData({ secondaryColor: e.target.value })}
                        className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={data.secondaryColor}
                        onChange={(e) => updateData({ secondaryColor: e.target.value })}
                        placeholder="#8B4513"
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Preview */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vorschau
                  </label>
                  <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                    <div className="flex gap-2 items-center mb-3">
                      <button
                        className="px-4 py-2 rounded-lg text-white font-medium"
                        style={{ backgroundColor: data.primaryColor }}
                      >
                        Primär-Button
                      </button>
                      <button
                        className="px-4 py-2 rounded-lg text-white font-medium"
                        style={{ backgroundColor: data.secondaryColor }}
                      >
                        Sekundär
                      </button>
                    </div>
                    <div
                      className="h-2 rounded-full"
                      style={{
                        background: `linear-gradient(to right, ${data.primaryColor}, ${data.secondaryColor})`,
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Logo */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-1">Logo & Branding</h2>
                  <p className="text-gray-500 text-sm">Logo-URL eingeben (später im CMS änderbar)</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Logo-URL
                  </label>
                  <input
                    type="text"
                    value={data.logoUrl}
                    onChange={(e) => updateData({ logoUrl: e.target.value })}
                    placeholder="/logo.svg oder https://..."
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    SVG oder PNG empfohlen. Kann später im Admin-Bereich geändert werden.
                  </p>
                </div>

                {/* Preview */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vorschau (Sidebar)
                  </label>
                  <div
                    className="p-4 rounded-lg"
                    style={{ backgroundColor: data.primaryColor }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                        {data.logoUrl && data.logoUrl !== '/logo.svg' ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={data.logoUrl}
                            alt="Logo"
                            className="w-8 h-8 object-contain"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <Building2 className="w-6 h-6 text-white/80" />
                        )}
                      </div>
                      <div>
                        <div className="text-white font-semibold">{data.shortName || 'Kurzname'}</div>
                        <div className="text-white/70 text-xs">{data.tagline || 'Tagline'}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Admin */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-1">Administrator</h2>
                  <p className="text-gray-500 text-sm">Ersten Admin-Benutzer anlegen</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name *
                    </label>
                    <input
                      type="text"
                      value={data.adminName}
                      onChange={(e) => updateData({ adminName: e.target.value })}
                      placeholder="Max Mustermann"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      E-Mail *
                    </label>
                    <input
                      type="email"
                      value={data.adminEmail}
                      onChange={(e) => updateData({ adminEmail: e.target.value })}
                      placeholder="admin@firma.de"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Passwort * <span className="text-gray-400 font-normal">(min. 8 Zeichen)</span>
                      </label>
                      <input
                        type="password"
                        value={data.adminPassword}
                        onChange={(e) => updateData({ adminPassword: e.target.value })}
                        placeholder="••••••••"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Passwort bestätigen *
                      </label>
                      <input
                        type="password"
                        value={data.adminPasswordConfirm}
                        onChange={(e) => updateData({ adminPasswordConfirm: e.target.value })}
                        placeholder="••••••••"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-sm text-amber-800">
                    <strong>Hinweis:</strong> Der Admin erhält vollen Zugriff auf alle Module und kann weitere Benutzer anlegen.
                  </p>
                </div>
              </div>
            )}

            {/* Step 5: Features */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-1">Features & Module</h2>
                  <p className="text-gray-500 text-sm">Welche Funktionen sollen aktiviert sein?</p>
                </div>

                <div className="grid md:grid-cols-2 gap-3">
                  {[
                    { key: 'darkMode', label: 'Dark Mode', desc: 'Dunkles Design verfügbar' },
                    { key: 'pushNotifications', label: 'Push-Benachrichtigungen', desc: 'Mobile Alerts' },
                    { key: 'twoFactorAuth', label: '2-Faktor-Auth', desc: 'Erhöhte Sicherheit' },
                    { key: 'offlineMode', label: 'Offline-Modus', desc: 'Arbeiten ohne Internet' },
                    { key: 'gpsTracking', label: 'GPS-Tracking', desc: 'Standortverfolgung' },
                    { key: 'customerPortal', label: 'Kundenportal', desc: 'Kunden-Zugang' },
                    { key: 'advancedReporting', label: 'Erweiterte Reports', desc: 'Detaillierte Analysen' },
                  ].map((feature) => (
                    <label
                      key={feature.key}
                      className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                        data.features[feature.key as keyof WizardData['features']]
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={data.features[feature.key as keyof WizardData['features']]}
                        onChange={(e) =>
                          updateFeature(feature.key as keyof WizardData['features'], e.target.checked)
                        }
                        className="mt-1 w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                      />
                      <div>
                        <div className="font-medium text-gray-900">{feature.label}</div>
                        <div className="text-xs text-gray-500">{feature.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>

                {/* Summary */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Zusammenfassung</h3>
                  <dl className="grid grid-cols-2 gap-2 text-sm">
                    <dt className="text-gray-500">Firma:</dt>
                    <dd className="text-gray-900 font-medium">{data.companyName}</dd>
                    <dt className="text-gray-500">Tenant-ID:</dt>
                    <dd className="text-gray-900 font-mono">{data.tenantId || generateTenantId(data.shortName)}</dd>
                    <dt className="text-gray-500">Admin:</dt>
                    <dd className="text-gray-900">{data.adminEmail}</dd>
                    <dt className="text-gray-500">Aktive Features:</dt>
                    <dd className="text-gray-900">
                      {Object.values(data.features).filter(Boolean).length} von {Object.keys(data.features).length}
                    </dd>
                  </dl>
                </div>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={prevStep}
              disabled={currentStep === 1}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-colors ${
                currentStep === 1
                  ? 'text-gray-300 cursor-not-allowed'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <ChevronLeft className="w-5 h-5" />
              Zurück
            </button>

            {currentStep < 5 ? (
              <button
                onClick={nextStep}
                className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
              >
                Weiter
                <ChevronRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Einrichten...
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    Abschließen
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-400 text-sm mt-6">
          AppFabrik — White-Label Field Service Management
        </p>
      </div>
    </div>
  );
}
