import { ROUTES } from '@/constants/routes';

/**
 * Agency mode — a Self-Manage agency's own team member signed in as an inspector.
 *
 * They work only their agency's jobs: no CROSSUB job pool, no claim, no open batch, no
 * pool availability, no payout and no inspector registration. The API already refuses
 * those (empty lists / 403); these screens are hidden so the app never offers them.
 */
export const AGENCY_HIDDEN_ROUTES = [
  ROUTES.JOB_POOL,
  ROUTES.OPEN_BATCH,
  ROUTES.EARNINGS,
  ROUTES.WEEKLY_AVAILABILITY,
  ROUTES.TRIBUNAL,
  ROUTES.REGISTER,
  ROUTES.SIGNUP,
] as const;

/** Where an agency inspector lands when they open a hidden screen. */
export const AGENCY_FALLBACK_ROUTE = ROUTES.DASHBOARD;

/** Where pool-bound back links and releases go instead in agency mode. */
export const AGENCY_POOL_REPLACEMENT_ROUTE = ROUTES.INSPECTIONS;

/** Profile status label for an agency inspector (no CROSSUB registration). */
export const AGENCY_INSPECTOR_STATUS_LABEL = 'Agency inspector';

/** Shown when the API marks the inspector as agency staff but sends no agency name. */
export const AGENCY_NAME_FALLBACK = 'Your agency';
