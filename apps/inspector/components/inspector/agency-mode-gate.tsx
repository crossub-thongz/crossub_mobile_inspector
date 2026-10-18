'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { useAuth } from '@/components/providers/auth-provider';
import { useInspectorData } from '@/components/providers/inspector-data-provider';
import { AGENCY_FALLBACK_ROUTE } from '@/constants/agency-mode';
import { isAgencyHiddenRoute } from '@/lib/agency-mode';

/**
 * Keeps an agency inspector off the CROSSUB-only screens (pool, open batch, payouts,
 * availability, tribunal, registration) — a deep link lands them on the dashboard.
 */
export function AgencyModeGate({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const { agencyMode, registrationResolved } = useInspectorData();
  const pathname = usePathname();
  const router = useRouter();
  const blocked =
    status === 'authed' &&
    registrationResolved &&
    agencyMode &&
    isAgencyHiddenRoute(pathname);

  useEffect(() => {
    if (blocked) router.replace(AGENCY_FALLBACK_ROUTE);
  }, [blocked, router]);

  if (blocked) return null;
  return <>{children}</>;
}
