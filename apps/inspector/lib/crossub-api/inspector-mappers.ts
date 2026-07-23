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
  TRIBUNAL_TYPE_LABEL,
} from '@/constants/api-enums';
import {
  ESTIMATED_HOURS_BY_TYPE,
  INSPECTOR_HOURLY_RATE_AUD,
  TRIBUNAL_OUTCOMES,
} from '@/constants/inspection';
import type { LabeledPhoto } from '@/lib/job-history';
import type {
  EarningsRecord,
  InspectionJob,
  InspectionType,
  InspectorNotification,
  InspectorRegistration,
  JobStatus,
  MessageThread,
  PropertyInspectionSpec,
  RoomInspectionEntry,
  ServiceRegionKey,
  ThreadMessage,
  TribunalHearing,
  TribunalOutcome,
} from '@/lib/types';

import type {
  InspectorInspection,
  InspectorInspectionDetail,
  InspectorJob,
  InspectorMessageThread,
  InspectorNotificationDto,
  InspectorRegistrationStatusDto,
  InspectorTribunalCaseDto,
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
  const propertyLatitude = asNumber(
    (dto as { propertyLatitude?: unknown }).propertyLatitude,
  );
  const propertyLongitude = asNumber(
    (dto as { propertyLongitude?: unknown }).propertyLongitude,
  );
  const hasPropertyGeo =
    propertyLatitude != null && propertyLongitude != null;
  const availableInspectorCount = asNumber(
    (dto as { availableInspectorCount?: unknown }).availableInspectorCount,
  );
  return {
    id: dto.id,
    type,
    propertyAddress: asString(dto.propertyAddress) ?? 'Assigned property',
    suburb: asString(dto.propertySuburb) ?? '',
    ...(hasPropertyGeo
      ? { latitude: propertyLatitude, longitude: propertyLongitude }
      : {}),
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
    availableInspectorCount,
  };
}

export function mapInspections(dtos: InspectorInspection[]): InspectionJob[] {
  return dtos.map(toInspectionJob);
}

/** Map pool rows onto claimable jobs (`status: available`, `source: pool`). */
export function toPoolInspectionJob(dto: InspectorInspection): InspectionJob {
  return {
    ...toInspectionJob(dto),
    status: 'available',
    source: 'pool',
  };
}

export function mapPoolInspections(dtos: InspectorInspection[]): InspectionJob[] {
  return dtos.map(toPoolInspectionJob);
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

const INGOING_AREA_SUFFIX = / \(Ingoing\)$/;
const OUTGOING_AREA_SUFFIX = / \(Outgoing\)$/;

function isPersistedPhotoUrl(url: string): boolean {
  return /^https?:\/\//i.test(url.trim());
}

function areaComments(area: InspectorInspectionDetail['areas'][number]): string {
  return area.items
    .map((item) => asString(item.comment))
    .filter((c): c is string => c !== null)
    .join(' · ');
}

function areaPhotoUrls(area: InspectorInspectionDetail['areas'][number]): string[] {
  return [
    ...area.photos.map((photo) => photo.url),
    ...area.items.flatMap((item) => item.photos.map((photo) => photo.url)),
  ].filter(isPersistedPhotoUrl);
}

function mapSingleArea(
  area: InspectorInspectionDetail['areas'][number],
): RoomInspectionEntry {
  const photoUrls = areaPhotoUrls(area);
  return {
    area: asString(area.name) ?? 'Unnamed area',
    condition: asString(area.ratingRaw) ?? conditionLabel(area.rating),
    comments: areaComments(area),
    photoCount: photoUrls.length,
    photoUrls,
  };
}

function mapOutgoingInspectionDetail(
  dto: InspectorInspectionDetail,
): RoomInspectionEntry[] {
  type Bucket = {
    ingoingPhotoUrls: string[];
    outgoingPhotoUrls: string[];
    comments: string;
  };

  const grouped = new Map<string, Bucket>();

  const bucketFor = (room: string): Bucket =>
    grouped.get(room) ?? {
      ingoingPhotoUrls: [],
      outgoingPhotoUrls: [],
      comments: '',
    };

  for (const area of dto.areas) {
    const name = asString(area.name) ?? '';
    const photos = areaPhotoUrls(area);
    const comments = areaComments(area);

    if (INGOING_AREA_SUFFIX.test(name)) {
      const room = name.replace(INGOING_AREA_SUFFIX, '');
      const bucket = bucketFor(room);
      bucket.ingoingPhotoUrls.push(...photos);
      grouped.set(room, bucket);
      continue;
    }

    if (OUTGOING_AREA_SUFFIX.test(name)) {
      const room = name.replace(OUTGOING_AREA_SUFFIX, '');
      const bucket = bucketFor(room);
      bucket.outgoingPhotoUrls.push(...photos);
      if (comments) bucket.comments = comments;
      grouped.set(room, bucket);
      continue;
    }

    const bucket = bucketFor(name);
    if (comments) bucket.comments = comments;
    if (photos.length > 0) {
      bucket.outgoingPhotoUrls.push(...photos);
    }
    grouped.set(name, bucket);
  }

  return [...grouped.entries()]
    .map(([area, bucket]) => ({
      area,
      condition: '',
      comments: bucket.comments,
      photoCount: bucket.ingoingPhotoUrls.length + bucket.outgoingPhotoUrls.length,
      photoUrls: [...bucket.ingoingPhotoUrls, ...bucket.outgoingPhotoUrls],
      ingoingPhotoUrls: bucket.ingoingPhotoUrls,
      outgoingPhotoUrls: bucket.outgoingPhotoUrls,
    }))
    .filter(
      (row) =>
        row.ingoingPhotoUrls.length > 0 ||
        row.outgoingPhotoUrls.length > 0 ||
        Boolean(row.comments),
    );
}

/**
 * Flatten the findings tree (areas → items → photos, plus inspection-level photos) onto
 * the flat per-room rows the read view renders. Outgoing jobs merge `Entry (Ingoing)` /
 * `Entry (Outgoing)` into one side-by-side row and drop empty duplicate bare area names.
 */
export function mapInspectionDetail(
  dto: InspectorInspectionDetail,
): RoomInspectionEntry[] {
  const hasOutgoingStyle = dto.areas.some((area) => {
    const name = asString(area.name) ?? '';
    return INGOING_AREA_SUFFIX.test(name) || OUTGOING_AREA_SUFFIX.test(name);
  });

  if (hasOutgoingStyle) {
    return mapOutgoingInspectionDetail(dto);
  }

  return dto.areas
    .map(mapSingleArea)
    .filter(
      (row) =>
        row.photoUrls.length > 0 ||
        Boolean(row.comments) ||
        (row.condition && row.condition !== 'Unrated'),
    );
}

/** Flatten the findings tree into labeled proof photos for the history report. */
export function mapInspectionDetailPhotos(
  dto: InspectorInspectionDetail,
): LabeledPhoto[] {
  const photos: LabeledPhoto[] = [];
  for (const area of dto.areas) {
    const areaName = asString(area.name) ?? 'Unnamed area';
    for (const [index, photo] of area.photos.entries()) {
      photos.push({ label: `${areaName} · ${index + 1}`, url: photo.url });
    }
    for (const item of area.items) {
      const itemName = asString(item.name) ?? 'Item';
      for (const [index, photo] of item.photos.entries()) {
        photos.push({
          label: `${areaName} · ${itemName} · ${index + 1}`,
          url: photo.url,
        });
      }
    }
  }
  for (const [index, photo] of dto.photos.entries()) {
    photos.push({ label: `Inspection · ${index + 1}`, url: photo.url });
  }
  return photos;
}

// -------------------------------- Tribunal -------------------------------

/**
 * Map one assigned tribunal case (the inspector's hearing brief) onto the FE
 * TribunalHearing view-model. The server derives what it faithfully can — evidence
 * completeness (staff pre-hearing review), hearing scheduled, attendance billed —
 * and the FE-only checklist keys (documentsDownloaded) start unchecked. Package
 * documents render from the present evidence titles (no file URLs exist server-side
 * yet, matching the seed's placeholder links).
 */
export function toTribunalHearing(dto: InspectorTribunalCaseDto): TribunalHearing {
  const outcomeResult = asString(dto.outcomeResult);
  const outcome = (TRIBUNAL_OUTCOMES as readonly string[]).includes(
    outcomeResult ?? '',
  )
    ? (outcomeResult as TribunalOutcome)
    : undefined;
  return {
    id: dto.id,
    hearingDate: asString(dto.hearingDate)?.slice(0, 10) ?? '',
    hearingTime: asString(dto.hearingTime) ?? '',
    tribunalType: TRIBUNAL_TYPE_LABEL[dto.tribunalType] ?? dto.tribunalType,
    location:
      asString(dto.hearingLocation) ??
      asString(dto.tribunalBody) ??
      'To be advised',
    propertyAddress: dto.propertyAddress,
    caseSummary: dto.caseSummary,
    rentalArrears: asNumber(dto.outstandingRent) ?? undefined,
    bondClaimAmount: asNumber(dto.bondAmount) ?? undefined,
    checklist: {
      evidenceComplete: dto.evidenceComplete,
      hearingConfirmed: asString(dto.hearingDate) !== null,
      documentsDownloaded: false,
      attendanceConfirmed: dto.attendanceRecorded,
    },
    packageDocuments: dto.evidence
      .filter((e) => e.present)
      .map((e) => ({ name: e.title, url: '#' })),
    outcome,
    status: dto.closed ? 'completed' : 'upcoming',
  };
}

export function mapTribunalCases(
  dtos: InspectorTribunalCaseDto[],
): TribunalHearing[] {
  return dtos.map(toTribunalHearing);
}

// ------------------------- Profile & registration ------------------------

/**
 * Merge the server's registration record (status truth: pending/approved/rejected,
 * review timestamps) over the locally saved form. The server NEVER echoes PII or
 * full bank details, so those fields keep the local copy — with the account
 * number's last 4 digits as the display fallback when no local value exists.
 */
export function mapInspectorRegistration(
  dto: InspectorRegistrationStatusDto,
  local: InspectorRegistration | null,
): InspectorRegistration {
  const toDateInput = (value: unknown): string =>
    asString(value)?.slice(0, 10) ?? '';
  return {
    firstName: dto.firstName,
    lastName: dto.lastName,
    email: dto.email,
    mobile: asString(dto.mobile) ?? local?.mobile ?? '',
    dateOfBirth: local?.dateOfBirth ?? '',
    residentialAddress: local?.residentialAddress ?? '',
    abn: asString(dto.abn) ?? local?.abn,
    licenceNumber: asString(dto.licenceNumber) ?? local?.licenceNumber,
    licenceType: asString(dto.licenceType) ?? local?.licenceType ?? '',
    licenceExpiry: toDateInput(dto.licenceExpiry) || local?.licenceExpiry,
    serviceRegions: dto.serviceRegions,
    tribunalQualified: dto.tribunalQualified,
    bankAccountName: local?.bankAccountName ?? '',
    bankBsb: local?.bankBsb ?? '',
    bankAccountNumber:
      local?.bankAccountNumber ?? asString(dto.bankAccountLast4) ?? '',
    registrationStatus:
      dto.registrationStatus as InspectorRegistration['registrationStatus'],
    submittedAt: asString(dto.submittedAt) ?? undefined,
    reviewedAt: asString(dto.reviewedAt) ?? undefined,
  };
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
