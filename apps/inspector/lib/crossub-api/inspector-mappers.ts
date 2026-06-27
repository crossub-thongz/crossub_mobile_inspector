/**
 * Pure adapters from the typed CROSSUB inspector facade DTOs
 * (`@crossub-thongz/api-contract`) to the view-models the inspector screens already
 * render (`lib/types.ts`). Keeping the translation here means the screens stay agnostic
 * about where their data came from — the provider overlays these mapped results onto the
 * demo seeds with no component changes.
 *
 * Two facade surfaces map here:
 *   - `/inspector/inspections` (assigned work)  -> InspectionJob
 *   - `/inspector/jobs`        (billable ledger) -> EarningsRecord
 * Both are THIN projections of the real Prisma rows, so view-model fields the facade
 * does not carry (geo, contacts, key access, property spec) land on safe defaults — the
 * same shape the screens already tolerate for demo data.
 */
import {
  BILLING_SOURCE,
  INSPECTION_STATUS,
  INSPECTION_TYPE,
  INVOICE_STATUS,
} from '@/constants/api-enums';
import {
  ESTIMATED_HOURS_BY_TYPE,
  INSPECTOR_HOURLY_RATE_AUD,
} from '@/constants/inspection';
import type {
  EarningsRecord,
  InspectionJob,
  InspectionType,
  JobStatus,
  PropertyInspectionSpec,
  ServiceRegionKey,
} from '@/lib/types';

import type { InspectorInspection, InspectorJob } from './inspector-client';

/**
 * The generated contract types nullable columns inconsistently — some surface as
 * `T | Record<string, never>` rather than `T | null` (an openapi-typescript rendering of
 * a `nullable: true` schema with no explicit `type`). So every scalar we read is funnelled
 * through these guards to land a clean primitive or null, never a stray `{}`.
 */
function asString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}
function asNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

/** API InspectionType vocabulary -> the app's field-inspection types. */
const INSPECTION_TYPE_VIEW: Record<InspectorInspection['type'], InspectionType> = {
  [INSPECTION_TYPE.OPEN]: 'open',
  [INSPECTION_TYPE.INGOING]: 'ingoing',
  [INSPECTION_TYPE.OUTGOING]: 'outgoing',
  [INSPECTION_TYPE.ROUTINE]: 'routine',
  [INSPECTION_TYPE.CONDITION]: 'routine',
  [INSPECTION_TYPE.WARD_ROUND]: 'routine',
};

/**
 * API InspectionStatus -> the app's JobStatus. The persisted model has a review/publish
 * tail the mobile board collapses into "completed"; DRAFT reads as "assigned" so the
 * Accept action shows, and accept drives DRAFT→IN_PROGRESS on the real facade.
 */
const INSPECTION_STATUS_VIEW: Record<InspectorInspection['status'], JobStatus> = {
  [INSPECTION_STATUS.DRAFT]: 'assigned',
  [INSPECTION_STATUS.IN_PROGRESS]: 'in_progress',
  [INSPECTION_STATUS.FIRST_REVIEW]: 'completed',
  [INSPECTION_STATUS.SECOND_REVIEW]: 'completed',
  [INSPECTION_STATUS.COMPLETED]: 'completed',
  [INSPECTION_STATUS.PUBLISHED]: 'completed',
  [INSPECTION_STATUS.CANCELLED]: 'declined',
};

/** API BillingSource -> the app's InspectionType label for an earnings line. */
const BILLING_SOURCE_VIEW: Record<InspectorJob['source'], InspectionType> = {
  [BILLING_SOURCE.ROUTINE_INSPECTION]: 'routine',
  [BILLING_SOURCE.TRIBUNAL]: 'tribunal',
};

// The facade carries no geo, so default real assignments to Sydney CBD — the detail map
// then pins near the service area instead of at (0,0). Real coordinates are a backend
// follow-up.
const SYDNEY_CBD = { latitude: -33.8688, longitude: 151.2093 };
const DEFAULT_REGION: ServiceRegionKey = 'cbd_inner';
const DEFAULT_PROPERTY: PropertyInspectionSpec = {
  propertyKind: 'apartment',
  bedrooms: 2,
  bathrooms: 1,
};

/** Map one assigned inspection (thin facade DTO) onto the app's InspectionJob card. */
export function toInspectionJob(dto: InspectorInspection): InspectionJob {
  const type = INSPECTION_TYPE_VIEW[dto.type] ?? 'routine';
  const scheduled =
    asString(dto.scheduledDate) ??
    asString(dto.inspectionDate) ??
    asString(dto.createdAt) ??
    '';
  const estimatedHours = ESTIMATED_HOURS_BY_TYPE[type];
  const laborAmount = Math.round(estimatedHours * INSPECTOR_HOURLY_RATE_AUD);
  return {
    id: dto.id,
    type,
    propertyAddress: asString(dto.propertyAddress) ?? 'Assigned property',
    suburb: asString(dto.propertySuburb) ?? '',
    latitude: SYDNEY_CBD.latitude,
    longitude: SYDNEY_CBD.longitude,
    scheduledDate: scheduled,
    scheduledTime: scheduled,
    priority: dto.urgent ? 'urgent' : 'normal',
    distanceKm: 0,
    status: INSPECTION_STATUS_VIEW[dto.status] ?? 'assigned',
    source: 'assigned',
    serviceRegion: DEFAULT_REGION,
    property: DEFAULT_PROPERTY,
    durationLabel: `~${estimatedHours} hr${estimatedHours === 1 ? '' : 's'}`,
    travelKmOneWay: 0,
    estimatedHours,
    laborAmount,
    fuelAllowance: 0,
    payAmount: laborAmount,
  };
}

export function mapInspections(dtos: InspectorInspection[]): InspectionJob[] {
  return dtos.map(toInspectionJob);
}

/** Map one billable attendance (thin facade DTO) onto the app's EarningsRecord. */
export function toEarningsRecord(dto: InspectorJob): EarningsRecord {
  const amount = asNumber(dto.totalAmount) ?? 0;
  const hours = asNumber(dto.billableHours) ?? 0;
  const rate = asNumber(dto.hourlyRate) ?? INSPECTOR_HOURLY_RATE_AUD;
  return {
    id: dto.id,
    jobId: dto.id,
    type: BILLING_SOURCE_VIEW[dto.source] ?? 'routine',
    propertyAddress: asString(dto.propertyLabel) ?? dto.sourceLabel,
    completedAt: asString(dto.submittedAt) ?? asString(dto.endTime) ?? '',
    hoursWorked: hours,
    hourlyRate: rate,
    travelKmOneWay: 0,
    fuelAllowance: 0,
    laborAmount: amount,
    amount,
    // PENDING = not yet pushed to accounting; INVOICED/PAID = synced.
    accountingSynced: dto.invoiceStatus !== INVOICE_STATUS.PENDING,
  };
}

export function mapInspectorEarnings(dtos: InspectorJob[]): EarningsRecord[] {
  return dtos.map(toEarningsRecord);
}
