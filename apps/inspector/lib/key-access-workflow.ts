import type { InspectionJob } from '@/lib/types';

export interface KeyPhaseRecord {
  completedAt: string;
  stepsConfirmed: boolean;
  photoConfirmed?: boolean;
  /** Data URLs of snapped or uploaded proof photos (persisted in workflowData). */
  photoUrls?: string[];
  notes?: string;
}

export interface KeyWorkflowData {
  collect?: KeyPhaseRecord;
  return?: KeyPhaseRecord;
}

const KEY_WORKFLOW_KEY = 'keyWorkflow';
const INSPECTION_FINISHED_KEY = 'inspectionFinished';

export function getKeyWorkflow(job: InspectionJob): KeyWorkflowData | undefined {
  const raw = job.workflowData?.[KEY_WORKFLOW_KEY];
  if (!raw || typeof raw !== 'object') return undefined;
  return raw as KeyWorkflowData;
}

function hasServerKeyProof(record?: KeyPhaseRecord): boolean {
  return Boolean(
    record?.photoUrls?.some(
      (url) => url.startsWith('http://') || url.startsWith('https://'),
    ),
  );
}

export function isKeyCollectComplete(job: InspectionJob): boolean {
  if (!job.keyAccess) return true;
  const collect = getKeyWorkflow(job)?.collect;
  if (!collect?.stepsConfirmed) return false;
  if (job.keyAccess.photoRequired) {
    if (!collect.photoUrls?.length) return false;
    // Assigned API jobs must have server-hosted proof — not browser-only state.
    if (job.source === 'assigned' && !hasServerKeyProof(collect)) return false;
  }
  return true;
}

export function isKeyReturnComplete(job: InspectionJob): boolean {
  if (!job.keyAccess) return true;
  const ret = getKeyWorkflow(job)?.return;
  if (!ret?.stepsConfirmed) return false;
  if (job.keyAccess.photoRequired) {
    if (!ret.photoUrls?.length) return false;
    if (job.source === 'assigned' && !hasServerKeyProof(ret)) return false;
  }
  return true;
}

/** Inspection report/workflow submitted — required before the return-key step unlocks. */
export function isInspectionWorkflowFinished(job: InspectionJob): boolean {
  if (!job.keyAccess) return true;
  if (job.status === 'completed') return true;
  return Boolean(job.workflowData?.[INSPECTION_FINISHED_KEY]);
}

export function buildInspectionFinishedPatch(): Record<string, unknown> {
  return {
    [INSPECTION_FINISHED_KEY]: true,
    inspectionFinishedAt: new Date().toISOString(),
  };
}

export function canStartInspection(job: InspectionJob): boolean {
  if (job.keyAccess && !isKeyCollectComplete(job)) return false;
  return true;
}

export function canAccessKeyReturnTab(job: InspectionJob): boolean {
  if (!job.keyAccess) return false;
  if (!isKeyCollectComplete(job)) return false;
  return isInspectionWorkflowFinished(job);
}

export function buildKeyWorkflowPatch(
  job: InspectionJob,
  phase: 'collect' | 'return',
  record: KeyPhaseRecord,
): Record<string, unknown> {
  const existing = getKeyWorkflow(job) ?? {};
  return {
    [KEY_WORKFLOW_KEY]: {
      ...existing,
      [phase]: record,
    },
  };
}
