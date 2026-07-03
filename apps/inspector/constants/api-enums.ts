/**
 * Runtime mirrors of the CROSSUB API's Prisma enums. The typed contract
 * (`@crossub-thongz/api-contract`) ships these as string-literal *types* only — there
 * are no runtime values to compare against — so the mappers import these constants
 * instead of hard-coding raw strings (per the repo's "no raw string comparisons" rule).
 *
 * Keep in sync with `apps/api/prisma/schema.prisma`.
 */

/** InspectionStatus — the real persisted lifecycle of an Inspection. */
export const INSPECTION_STATUS = {
  DRAFT: 'DRAFT',
  IN_PROGRESS: 'IN_PROGRESS',
  FIRST_REVIEW: 'FIRST_REVIEW',
  SECOND_REVIEW: 'SECOND_REVIEW',
  COMPLETED: 'COMPLETED',
  PUBLISHED: 'PUBLISHED',
  CANCELLED: 'CANCELLED',
} as const;

/** InspectionType — what kind of inspection (API vocabulary). */
export const INSPECTION_TYPE = {
  CONDITION: 'CONDITION',
  ROUTINE: 'ROUTINE',
  INGOING: 'INGOING',
  OUTGOING: 'OUTGOING',
  WARD_ROUND: 'WARD_ROUND',
  OPEN: 'OPEN',
} as const;

/** BillingSource — what produced a billable attendance line. */
export const BILLING_SOURCE = {
  ROUTINE_INSPECTION: 'ROUTINE_INSPECTION',
  TRIBUNAL: 'TRIBUNAL',
} as const;

/** Invoice lifecycle of a billable attendance line. */
export const INVOICE_STATUS = {
  PENDING: 'PENDING',
  INVOICED: 'INVOICED',
  PAID: 'PAID',
} as const;

/**
 * ConditionRating — the per-area condition grade carried by the inspection findings
 * tree (`InspectorAreaDto.rating`). Mirrors `apps/api/prisma/schema.prisma`'s
 * `ConditionRating` enum; the findings mapper labels each area from these.
 */
export const CONDITION_RATING = {
  CLEAN_TIDY: 'CLEAN_TIDY',
  GOOD: 'GOOD',
  ABOVE_SATISFACTORY: 'ABOVE_SATISFACTORY',
  SATISFACTORY: 'SATISFACTORY',
  FAIR: 'FAIR',
  AS_INDICATED: 'AS_INDICATED',
  MESSY: 'MESSY',
  POOR: 'POOR',
  UNRATED: 'UNRATED',
} as const;

/**
 * InspectorNotificationType — the API's per-inspector notification kind. Mirrors the
 * Prisma enum; the mapper lowercases each to the FE's `InspectorNotification.type` union.
 */
export const INSPECTOR_NOTIFICATION_TYPE = {
  JOB_ASSIGNED: 'JOB_ASSIGNED',
  JOB_AVAILABLE: 'JOB_AVAILABLE',
  TRIBUNAL: 'TRIBUNAL',
  MESSAGE: 'MESSAGE',
  SYNC_COMPLETE: 'SYNC_COMPLETE',
} as const;

/** Human-readable labels for each ConditionRating (used by the findings read view). */
export const CONDITION_RATING_LABEL: Record<
  keyof typeof CONDITION_RATING,
  string
> = {
  CLEAN_TIDY: 'Clean & Tidy',
  GOOD: 'Good',
  ABOVE_SATISFACTORY: 'Above Satisfactory',
  SATISFACTORY: 'Satisfactory',
  FAIR: 'Fair',
  AS_INDICATED: 'As Indicated',
  MESSY: 'Messy',
  POOR: 'Poor',
  UNRATED: 'Unrated',
};

/** TribunalType — what kind of tribunal case (API vocabulary). */
export const TRIBUNAL_TYPE = {
  RENTAL_ARREARS: 'RENTAL_ARREARS',
  BOND_CLAIM: 'BOND_CLAIM',
  PROPERTY_DAMAGE: 'PROPERTY_DAMAGE',
  LEASE_TERMINATION: 'LEASE_TERMINATION',
  LEASE_BREACH: 'LEASE_BREACH',
  MAINTENANCE_DISPUTE: 'MAINTENANCE_DISPUTE',
} as const;

/** Human-readable labels for each TribunalType (the tribunal screens render these). */
export const TRIBUNAL_TYPE_LABEL: Record<keyof typeof TRIBUNAL_TYPE, string> = {
  RENTAL_ARREARS: 'Rental Arrears',
  BOND_CLAIM: 'Bond Claim',
  PROPERTY_DAMAGE: 'Property Damage',
  LEASE_TERMINATION: 'Lease Termination',
  LEASE_BREACH: 'Lease Breach',
  MAINTENANCE_DISPUTE: 'Maintenance Dispute',
};
