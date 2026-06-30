import type { InspectionJob } from '@/lib/types';

export interface KeyPhaseRecord {
  completedAt: string;
  stepsConfirmed: boolean;
  photoConfirmed?: boolean;
  notes?: string;
}

export interface KeyWorkflowData {
  collect?: KeyPhaseRecord;
  return?: KeyPhaseRecord;
}

const KEY_WORKFLOW_KEY = 'keyWorkflow';

export function getKeyWorkflow(job: InspectionJob): KeyWorkflowData | undefined {
  const raw = job.workflowData?.[KEY_WORKFLOW_KEY];
  if (!raw || typeof raw !== 'object') return undefined;
  return raw as KeyWorkflowData;
}

export function isKeyCollectComplete(job: InspectionJob): boolean {
  if (!job.keyAccess) return true;
  const collect = getKeyWorkflow(job)?.collect;
  if (!collect?.stepsConfirmed) return false;
  if (job.keyAccess.photoRequired && !collect.photoConfirmed) return false;
  return true;
}

export function isKeyReturnComplete(job: InspectionJob): boolean {
  if (!job.keyAccess) return true;
  const ret = getKeyWorkflow(job)?.return;
  if (!ret?.stepsConfirmed) return false;
  if (job.keyAccess.photoRequired && !ret.photoConfirmed) return false;
  return true;
}

export function canAccessKeyReturnTab(job: InspectionJob): boolean {
  if (!job.keyAccess) return false;
  if (!isKeyCollectComplete(job)) return false;
  return (
    job.status === 'in_progress' ||
    job.status === 'completed' ||
    (job.workflowStep ?? 0) > 0
  );
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
