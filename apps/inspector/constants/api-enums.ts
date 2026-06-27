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
