import type { components } from '@crossub-thongz/api-contract';

import { crossub } from './client';

export type InspectorJob = components['schemas']['InspectorJobResponseDto'];
export type InspectorInspection = components['schemas']['InspectorInspectionResponseDto'];
export type InspectorInspectionDetail =
  components['schemas']['InspectorInspectionDetailDto'];
export type CompleteInspectorInspection =
  components['schemas']['CompleteInspectorInspectionDto'];
export type FileInspectorReport = components['schemas']['FileInspectorReportDto'];
export type InspectorMessageThread =
  components['schemas']['InspectorMessageThreadResponseDto'];
// Aliased `...Dto` to avoid colliding with the FE view-model `InspectorNotification`.
export type InspectorNotificationDto =
  components['schemas']['InspectorNotificationResponseDto'];
export type InspectorPhoto = components['schemas']['InspectorPhotoDto'];
export type UploadInspectorPhoto =
  components['schemas']['UploadInspectorPhotoDto'];
export type InspectorKeyCollection =
  components['schemas']['InspectorKeyCollectionResponseDto'];
export type InspectorKeyCustody =
  components['schemas']['InspectorKeyCustodyDto'];
export type RecordKeyCustody = components['schemas']['RecordKeyCustodyDto'];
export type UploadKeyCustodyPhoto =
  components['schemas']['UploadKeyCustodyPhotoDto'];
export type SaveInspectorFindings =
  components['schemas']['SaveInspectorFindingsDto'];
export type ReleaseInspectorInspection =
  components['schemas']['ReleaseInspectorInspectionDto'];
export type InspectorTribunalCaseDto =
  components['schemas']['InspectorTribunalCaseDto'];
export type InspectorProfileDto =
  components['schemas']['InspectorProfileResponseDto'];
export type InspectorRegistrationStatusDto =
  components['schemas']['InspectorRegistrationStatusDto'];
export type SubmitInspectorRegistration =
  components['schemas']['SubmitInspectorRegistrationDto'];
/** One area of a findings submission (the screens build these from their entries). */
export type InspectorFindingAreaPayload =
  SaveInspectorFindings['areas'][number];

/** Billable inspection jobs ledger (`GET /api/v1/inspector/jobs`). */
export async function fetchJobs(): Promise<InspectorJob[]> {
  const { data, error } = await crossub.GET('/inspector/jobs');
  if (error || !data) throw new Error('Failed to load jobs');
  return data.items;
}

/** Assigned inspections (`GET /api/v1/inspector/inspections`). */
export async function fetchInspections(): Promise<InspectorInspection[]> {
  const { data, error } = await crossub.GET('/inspector/inspections');
  if (error || !data) throw new Error('Failed to load inspections');
  return data.items;
}

/** Unassigned pool inspections (`GET /api/v1/inspector/inspections/pool`). */
export async function fetchPoolInspections(): Promise<InspectorInspection[]> {
  const { data, error } = await crossub.GET('/inspector/inspections/pool');
  if (error || !data) throw new Error('Failed to load job pool');
  return data.items;
}

/** Claim a pool inspection (`POST /api/v1/inspector/inspections/{inspectionId}/claim`). */
export async function claimInspection(
  inspectionId: string,
): Promise<InspectorInspection> {
  const { data, error } = await crossub.POST(
    '/inspector/inspections/{inspectionId}/claim',
    { params: { path: { inspectionId } } },
  );
  if (error || !data) throw new Error('Failed to claim inspection');
  return data;
}

/** Findings tree for one inspection (`GET /api/v1/inspector/inspections/{inspectionId}/detail`). */
export async function fetchInspectionDetail(
  inspectionId: string,
): Promise<InspectorInspectionDetail> {
  const { data, error } = await crossub.GET(
    '/inspector/inspections/{inspectionId}/detail',
    { params: { path: { inspectionId } } },
  );
  if (error || !data) throw new Error('Failed to load inspection detail');
  return data;
}

/** Leasing key-collection arrangement (`GET /inspector/inspections/{inspectionId}/key-collection`). */
export async function fetchKeyCollection(
  inspectionId: string,
): Promise<InspectorKeyCollection | null> {
  const { data, error, response } = await crossub.GET(
    '/inspector/inspections/{inspectionId}/key-collection',
    { params: { path: { inspectionId } } },
  );
  if (response.status === 404) return null;
  if (error || !data) throw new Error('Failed to load key collection');
  return data;
}

/**
 * Record physical key collection or return on the server
 * (`POST /inspector/inspections/{inspectionId}/key-custody/{collect|return}`).
 * The server enforces the key rules — return requires the inspection to be
 * completed first, and (when required) a proof photo already uploaded.
 */
export async function recordKeyCustody(
  inspectionId: string,
  phase: 'collect' | 'return',
  body: RecordKeyCustody = {},
): Promise<InspectorKeyCustody> {
  if (phase === 'collect') {
    const { data, error } = await crossub.POST(
      '/inspector/inspections/{inspectionId}/key-custody/collect',
      { params: { path: { inspectionId } }, body },
    );
    if (error || !data) throw new Error('Failed to record key collection');
    return data;
  }
  const { data, error } = await crossub.POST(
    '/inspector/inspections/{inspectionId}/key-custody/return',
    { params: { path: { inspectionId } }, body },
  );
  if (error || !data) throw new Error('Failed to record key return');
  return data;
}

/**
 * Upload a key-custody proof photo, base64 → R2, appended to the collect or
 * return proof array (`POST /inspector/inspections/{inspectionId}/key-custody/photos/upload`).
 */
export async function uploadKeyCustodyPhoto(
  inspectionId: string,
  body: UploadKeyCustodyPhoto,
): Promise<InspectorKeyCustody> {
  const { data, error } = await crossub.POST(
    '/inspector/inspections/{inspectionId}/key-custody/photos/upload',
    { params: { path: { inspectionId } }, body },
  );
  if (error || !data) throw new Error('Failed to upload key proof photo');
  return data;
}

/** Accept an inspection (`POST /api/v1/inspector/inspections/{inspectionId}/accept`). */
export async function acceptInspection(
  inspectionId: string,
): Promise<InspectorInspection> {
  const { data, error } = await crossub.POST(
    '/inspector/inspections/{inspectionId}/accept',
    { params: { path: { inspectionId } } },
  );
  if (error || !data) throw new Error('Failed to accept inspection');
  return data;
}

/** Complete an inspection (`POST /api/v1/inspector/inspections/{inspectionId}/complete`). */
export async function completeInspection(
  inspectionId: string,
  body: CompleteInspectorInspection,
): Promise<InspectorInspection> {
  const { data, error } = await crossub.POST(
    '/inspector/inspections/{inspectionId}/complete',
    { params: { path: { inspectionId } }, body },
  );
  if (error || !data) throw new Error('Failed to complete inspection');
  return data;
}

/** File the report for an inspection (`POST /api/v1/inspector/inspections/{inspectionId}/report`). */
export async function fileReport(
  inspectionId: string,
  body: FileInspectorReport,
): Promise<InspectorInspection> {
  const { data, error } = await crossub.POST(
    '/inspector/inspections/{inspectionId}/report',
    { params: { path: { inspectionId } }, body },
  );
  if (error || !data) throw new Error('Failed to file report');
  return data;
}

/** Upload an inspection-level evidence photo (`POST /inspector/inspections/{inspectionId}/photos/upload`). */
export async function uploadInspectionPhoto(
  inspectionId: string,
  body: UploadInspectorPhoto,
): Promise<InspectorPhoto> {
  const { data, error } = await crossub.POST(
    '/inspector/inspections/{inspectionId}/photos/upload',
    { params: { path: { inspectionId } }, body },
  );
  if (error || !data) throw new Error('Failed to upload photo');
  return data;
}

/**
 * Persist the findings tree gathered on site
 * (`POST /inspector/inspections/{inspectionId}/findings`). Areas upsert by name
 * within the app's own authorship; items are replaced per area.
 */
export async function saveInspectionFindings(
  inspectionId: string,
  body: SaveInspectorFindings,
): Promise<InspectorInspectionDetail> {
  const { data, error } = await crossub.POST(
    '/inspector/inspections/{inspectionId}/findings',
    { params: { path: { inspectionId } }, body },
  );
  if (error || !data) throw new Error('Failed to save findings');
  return data;
}

/** Decline a pool job (`POST /inspector/inspections/{inspectionId}/decline`). */
export async function declineInspection(
  inspectionId: string,
): Promise<InspectorInspection> {
  const { data, error } = await crossub.POST(
    '/inspector/inspections/{inspectionId}/decline',
    { params: { path: { inspectionId } } },
  );
  if (error || !data) throw new Error('Failed to decline inspection');
  return data;
}

/**
 * Release a claimed/accepted job back to the pool
 * (`POST /inspector/inspections/{inspectionId}/release`).
 */
export async function releaseInspection(
  inspectionId: string,
  body: ReleaseInspectorInspection,
): Promise<InspectorInspection> {
  const { data, error } = await crossub.POST(
    '/inspector/inspections/{inspectionId}/release',
    { params: { path: { inspectionId } }, body },
  );
  if (error || !data) throw new Error('Failed to release inspection');
  return data;
}

/** Tribunal cases assigned to the inspector (`GET /api/v1/inspector/tribunal-cases`). */
export async function fetchInspectorTribunalCases(): Promise<
  InspectorTribunalCaseDto[]
> {
  const { data, error } = await crossub.GET('/inspector/tribunal-cases');
  if (error || !data) throw new Error('Failed to load tribunal cases');
  return data;
}

/** The inspector's own profile + registration status (`GET /api/v1/inspector/profile`). */
export async function fetchInspectorProfile(): Promise<InspectorProfileDto> {
  const { data, error } = await crossub.GET('/inspector/profile');
  if (error || !data) throw new Error('Failed to load profile');
  return data;
}

/**
 * Submit (or resubmit) the inspector's own registration application
 * (`POST /api/v1/inspector/registration`) — lands in the staff review queue.
 */
export async function submitInspectorRegistration(
  body: SubmitInspectorRegistration,
): Promise<InspectorRegistrationStatusDto> {
  const { data, error } = await crossub.POST('/inspector/registration', {
    body,
  });
  if (error || !data) throw new Error('Failed to submit registration');
  return data;
}

/** The inspector's message threads (`GET /api/v1/inspector/messages`). */
export async function fetchInspectorMessages(): Promise<InspectorMessageThread[]> {
  const { data, error } = await crossub.GET('/inspector/messages');
  if (error || !data) throw new Error('Failed to load messages');
  return data;
}

/** Reply to a thread (`POST /api/v1/inspector/messages/{threadId}/reply`). */
export async function replyInspectorMessage(
  threadId: string,
  body: string,
): Promise<InspectorMessageThread> {
  const { data, error } = await crossub.POST(
    '/inspector/messages/{threadId}/reply',
    { params: { path: { threadId } }, body: { body } },
  );
  if (error || !data) throw new Error('Failed to send message');
  return data;
}

/** The inspector's notifications (`GET /api/v1/inspector/notifications`). */
export async function fetchInspectorNotifications(): Promise<
  InspectorNotificationDto[]
> {
  const { data, error } = await crossub.GET('/inspector/notifications');
  if (error || !data) throw new Error('Failed to load notifications');
  return data;
}

/** Mark one notification read (`PATCH /api/v1/inspector/notifications/{notificationId}/read`). */
export async function markInspectorNotificationRead(
  notificationId: string,
): Promise<InspectorNotificationDto> {
  const { data, error } = await crossub.PATCH(
    '/inspector/notifications/{notificationId}/read',
    { params: { path: { notificationId } } },
  );
  if (error || !data) throw new Error('Failed to mark notification read');
  return data;
}

/** Mark all notifications read (`POST /api/v1/inspector/notifications/read-all`). */
export async function markAllInspectorNotificationsRead(): Promise<{
  updated: number;
}> {
  const { data, error } = await crossub.POST(
    '/inspector/notifications/read-all',
  );
  if (error || !data) throw new Error('Failed to mark all notifications read');
  return data;
}
