import {
  AGENCY_HIDDEN_ROUTES,
  AGENCY_NAME_FALLBACK,
  AGENCY_POOL_REPLACEMENT_ROUTE,
} from '@/constants/agency-mode';
import { ROUTES } from '@/constants/routes';
import type { InspectorProfileDto } from '@/lib/crossub-api/inspector-client';
import type { InspectorProfile } from '@/lib/types';

type ProfileWithRoster = Pick<InspectorProfileDto, 'roster'> | null | undefined;

/** True when the signed-in inspector is a Self-Manage agency's own team member. */
export function isAgencyInspector(profile: ProfileWithRoster): boolean {
  return Boolean(profile?.roster?.agencyId);
}

/** The agency an agency inspector works for; null for a CROSSUB inspector. */
export function agencyFromProfile(
  profile: ProfileWithRoster,
): InspectorProfile['agency'] {
  const roster = profile?.roster;
  if (!roster?.agencyId) return null;
  return { id: roster.agencyId, name: roster.agencyName ?? AGENCY_NAME_FALLBACK };
}

/** Screens an agency inspector never sees (pool, payouts, registration). */
export function isAgencyHiddenRoute(pathname: string): boolean {
  return AGENCY_HIDDEN_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

/** Job Pool for a CROSSUB inspector; the task list for an agency inspector. */
export function poolReturnRoute(agencyMode: boolean): string {
  return agencyMode ? AGENCY_POOL_REPLACEMENT_ROUTE : ROUTES.JOB_POOL;
}
