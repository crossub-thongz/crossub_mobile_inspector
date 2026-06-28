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
