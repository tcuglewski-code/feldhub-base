/**
 * PlausibleProvider — Wrapper für Next.js App Router
 * Bindet Plausible Analytics script DSGVO-konform ein.
 *
 * Sprint IY | 30.03.2026
 */

'use client';

import NextPlausibleProvider from 'next-plausible';
import { ReactNode } from 'react';
import { getCurrentTenant as getTenantConfig } from '@/config/tenant';

interface PlausibleProviderProps {
  children: ReactNode;
}

export function PlausibleProvider({ children }: PlausibleProviderProps) {
  const tenant = getTenantConfig();
  const domain = tenant.analytics?.plausible?.domain ?? process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
  const enabled = tenant.analytics?.plausible?.enabled ?? process.env.NEXT_PUBLIC_PLAUSIBLE_ENABLED === 'true';
  const apiHost = tenant.analytics?.plausible?.apiHost ?? 'https://plausible.io';

  if (!enabled || !domain) {
    return <>{children}</>;
  }

  return (
    <NextPlausibleProvider
      domain={domain}
      customDomain={apiHost}
      selfHosted={apiHost !== 'https://plausible.io'}
      trackOutboundLinks
      trackFileDownloads
    >
      {children}
    </NextPlausibleProvider>
  );
}
