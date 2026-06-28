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
  CONDITION_RATING_LABEL,
  INSPECTION_STATUS,
  INSPECTION_TYPE,
  INSPECTOR_NOTIFICATION_TYPE,
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
  InspectorNotification,
  JobStatus,
  MessageThread,
  PropertyInspectionSpec,
  RoomInspectionEntry,
  ServiceRegionKey,
  ThreadMessage,
} from '@/lib/types';

import type {
  InspectorInspection,
  InspectorInspectionDetail,
  InspectorJob,
  InspectorMessageThread,
  InspectorNotificationDto,
} from './inspector-client';

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

/** Map the API's ConditionRating enum to its display label, falling back to the raw code. */
function conditionLabel(rating: string): string {
  return (
    CONDITION_RATING_LABEL[rating as keyof typeof CONDITION_RATING_LABEL] ??
    rating
  );
}

/**
 * Flatten the findings tree (areas → items → photos, plus inspection-level photos) onto
 * the flat per-room rows the read view renders. One row per area: its condition grade, a
 * joined digest of the item comments, and the total photo count (area-level + each item's
 * own). Inspection-level photos (areaId/itemId both null — the inspector's own evidence
 * uploads) collapse into a synthetic "Inspection photos" row so they surface too.
 */
export function mapInspectionDetail(
  dto: InspectorInspectionDetail,
): RoomInspectionEntry[] {
  const rooms: RoomInspectionEntry[] = dto.areas.map((area) => {
    const itemPhotoCount = area.items.reduce(
      (sum, item) => sum + item.photos.length,
      0,
    );
    const comments = area.items
      .map((item) => asString(item.comment))
      .filter((c): c is string => c !== null)
      .join(' · ');
    return {
      area: asString(area.name) ?? 'Unnamed area',
      condition: conditionLabel(area.rating),
      comments,
      photoCount: area.photos.length + itemPhotoCount,
    };
  });

  if (dto.photos.length > 0) {
    rooms.push({
      area: 'Inspection photos',
      condition: '',
      comments: '',
      photoCount: dto.photos.length,
    });
  }

  return rooms;
}

// ------------------------------- Messages --------------------------------

/** Map one API thread message onto the FE ThreadMessage (carrying the server `fromSelf`). */
function toThreadMessage(
  m: InspectorMessageThread['messages'][number],
): ThreadMessage {
  return {
    id: m.id,
    from: m.from,
    body: m.body,
    at: m.at,
    fromSelf: m.fromSelf,
  };
}

/** Map one API message thread onto the FE MessageThread card (no nested messages). */
export function toMessageThread(dto: InspectorMessageThread): MessageThread {
  return {
    id: dto.id,
    subject: dto.subject,
    participants: dto.participants,
    lastMessage: asString(dto.lastMessage) ?? '',
    lastAt: asString(dto.lastAt) ?? '',
    unread: asNumber(dto.unread) ?? 0,
    // A thread tagged to an inspection is an inspection conversation; a general enquiry
    // (no inspectionId) is grouped with the staff/agent bucket.
    category: asString(dto.inspectionId) ? 'inspection' : 'agent',
  };
}

/**
 * Split the API threads (each carrying its messages nested) into the two shapes the FE
 * holds separately: the thread cards (`MessageThread[]`) and the per-thread message map
 * (`Record<threadId, ThreadMessage[]>`) the detail screen reads.
 */
export function mapInspectorMessages(dtos: InspectorMessageThread[]): {
  threads: MessageThread[];
  messagesByThread: Record<string, ThreadMessage[]>;
} {
  const threads = dtos.map(toMessageThread);
  const messagesByThread: Record<string, ThreadMessage[]> = {};
  for (const dto of dtos) {
    messagesByThread[dto.id] = dto.messages.map(toThreadMessage);
  }
  return { threads, messagesByThread };
}

// ----------------------------- Notifications -----------------------------

/** API InspectorNotificationType (UPPER) -> the FE's lowercase notification union. */
const NOTIFICATION_TYPE_VIEW: Record<
  InspectorNotificationDto['type'],
  InspectorNotification['type']
> = {
  [INSPECTOR_NOTIFICATION_TYPE.JOB_ASSIGNED]: 'job_assigned',
  [INSPECTOR_NOTIFICATION_TYPE.JOB_AVAILABLE]: 'job_available',
  [INSPECTOR_NOTIFICATION_TYPE.TRIBUNAL]: 'tribunal',
  [INSPECTOR_NOTIFICATION_TYPE.MESSAGE]: 'message',
  [INSPECTOR_NOTIFICATION_TYPE.SYNC_COMPLETE]: 'sync_complete',
};

/** Map one API notification onto the FE InspectorNotification view-model. */
export function toInspectorNotification(
  dto: InspectorNotificationDto,
): InspectorNotification {
  return {
    id: dto.id,
    type: NOTIFICATION_TYPE_VIEW[dto.type] ?? 'message',
    title: dto.title,
    body: dto.body,
    href: dto.href,
    read: dto.read,
    createdAt: asString(dto.at) ?? '',
  };
}

export function mapInspectorNotifications(
  dtos: InspectorNotificationDto[],
): InspectorNotification[] {
  return dtos.map(toInspectorNotification);
}
