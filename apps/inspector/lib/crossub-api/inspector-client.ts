import type { components } from '@crossub-thongz/api-contract';

import { crossub } from './client';

export type InspectorJob = components['schemas']['InspectorJobResponseDto'];
export type InspectorInspection = components['schemas']['InspectorInspectionResponseDto'];
export type InspectorInspectionDetail =
  components['schemas']['InspectorInspectionDetailDto'];
export type CompleteInspectorInspection =
  components['schemas']['CompleteInspectorInspectionDto'];
export type FileInspectorReport = components['schemas']['FileInspectorReportDto'];

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
