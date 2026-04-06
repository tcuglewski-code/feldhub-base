'use client';

/**
 * PlausibleProvider - DSGVO-konforme Analytics Integration
 * 
 * Integriert Plausible Analytics ohne Cookies, ohne Consent-Banner.
 * Konfiguration erfolgt über tenant.ts (analytics.plausible).
 * 
 * @see https://plausible.io/docs
 * @see https://github.com/4lejandrito/next-plausible
 */

import { useEffect, useCallback } from 'react';
import Script from 'next/script';
import type { TenantConfig } from '@/config/tenant';

interface PlausibleProviderProps {
  config?: TenantConfig | null;
  children: React.ReactNode;
}

// Globale Plausible-Funktion für Custom Events
declare global {
  interface Window {
    plausible?: (
      eventName: string,
      options?: { props?: Record<string, string | number | boolean> }
    ) => void;
  }
}

/**
 * Hook für Custom Event Tracking
 * 
 * @example
 * const { trackEvent } = usePlausible();
 * trackEvent('Login', { method: 'credentials' });
 */
export function usePlausible() {
  const trackEvent = useCallback(
    (eventName: string, props?: Record<string, string | number | boolean>) => {
      if (typeof window !== 'undefined' && window.plausible) {
        window.plausible(eventName, { props });
      }
    },
    []
  );

  return { trackEvent };
}

/**
 * PlausibleProvider Component
 * 
 * Lädt das Plausible-Script nur wenn analytics.plausible.enabled = true
 * und eine Domain konfiguriert ist.
 */
export function PlausibleProvider({ config, children }: PlausibleProviderProps) {
  const plausibleConfig = config?.analytics?.plausible;
  
  // Skip wenn nicht aktiviert oder keine Domain
  const isEnabled = plausibleConfig?.enabled && plausibleConfig?.domain;
  const domain = plausibleConfig?.domain;
  const apiHost = plausibleConfig?.apiHost || 'https://plausible.io';
  const trackLocalhost = plausibleConfig?.trackLocalhost ?? false;

  // In Development nur tracken wenn explizit aktiviert
  const shouldTrack = isEnabled && (
    typeof window === 'undefined' || // SSR
    window.location.hostname !== 'localhost' ||
    trackLocalhost
  );

  useEffect(() => {
    // Plausible Queue für Events vor Script-Load
    if (typeof window !== 'undefined' && !window.plausible) {
      window.plausible = function (...args) {
        (window.plausible as unknown as { q?: unknown[] }).q = 
          (window.plausible as unknown as { q?: unknown[] }).q || [];
        (window.plausible as unknown as { q: unknown[] }).q.push(args);
      };
    }
  }, []);

  return (
    <>
      {shouldTrack && domain && (
        <Script
          defer
          data-domain={domain}
          src={`${apiHost}/js/script.js`}
          strategy="afterInteractive"
        />
      )}
      {children}
    </>
  );
}

/**
 * Tracked Events für Feldhub (Standard-Set)
 * 
 * Diese Events werden von verschiedenen Komponenten getrackt:
 */
export const PLAUSIBLE_EVENTS = {
  // Auth Events
  LOGIN: 'Login',
  LOGOUT: 'Logout',
  SIGNUP: 'Signup',
  
  // Feature Usage
  TASK_CREATED: 'Task Created',
  TASK_COMPLETED: 'Task Completed',
  REPORT_GENERATED: 'Report Generated',
  DOCUMENT_UPLOADED: 'Document Uploaded',
  PDF_EXPORTED: 'PDF Exported',
  
  // Onboarding
  ONBOARDING_STARTED: 'Onboarding Started',
  ONBOARDING_COMPLETED: 'Onboarding Completed',
  ONBOARDING_STEP: 'Onboarding Step',
  
  // Navigation
  SEARCH_USED: 'Search Used',
  FILTER_APPLIED: 'Filter Applied',
  
  // Integrations
  ZIPAYO_PAYMENT_INITIATED: 'Zipayo Payment Initiated',
  NEXTCLOUD_SYNC: 'Nextcloud Sync',
} as const;

export type PlausibleEvent = typeof PLAUSIBLE_EVENTS[keyof typeof PLAUSIBLE_EVENTS];

/**
 * Re-export für einfachen Import
 */
export default PlausibleProvider;
