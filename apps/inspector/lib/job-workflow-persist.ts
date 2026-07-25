import type { InspectionJob, JobStatus } from '@/lib/types';

const STORAGE_PREFIX = 'crossub-inspector-job:';

const STATUS_RANK: Record<JobStatus, number> = {
  available: 0,
  assigned: 1,
  accepted: 2,
  on_the_way: 3,
  arrived: 4,
  in_progress: 5,
  completed: 6,
  declined: -1,
};

export interface JobProgressSnapshot {
  workflowStep?: number;
  workflowData?: Record<string, unknown>;
  status?: JobStatus;
}

function preferStatus(incoming: JobStatus, local?: JobStatus): JobStatus {
  if (!local) return incoming;
  // Server-cancelled jobs must not resurrect from device-local workflow progress.
  if (incoming === 'declined') return incoming;
  return STATUS_RANK[local] >= STATUS_RANK[incoming] ? local : incoming;
}

function hasWorkflowProgress(snapshot: JobProgressSnapshot | undefined): boolean {
  if (!snapshot) return false;
  if ((snapshot.workflowStep ?? 0) > 0) return true;
  if (snapshot.status === 'in_progress') return true;
  const data = snapshot.workflowData;
  if (!data || Object.keys(data).length === 0) return false;
  if ('inspectionDraft' in data && data.inspectionDraft) return true;
  return true;
}

function readStorageItem(key: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const fromLocal = localStorage.getItem(key);
    if (fromLocal) return fromLocal;
    const legacy = sessionStorage.getItem(key);
    if (!legacy) return null;
    // One-time migration so progress survives logout / new sessions.
    try {
      localStorage.setItem(key, legacy);
      sessionStorage.removeItem(key);
    } catch {
      // Keep legacy value for this read if localStorage is unavailable.
    }
    return legacy;
  } catch {
    return null;
  }
}

function writeStorageItem(key: string, value: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, value);
    sessionStorage.removeItem(key);
  } catch {
    // Fall back to session storage when quota is exceeded.
    try {
      sessionStorage.setItem(key, value);
    } catch {
      // Storage full — in-memory state still holds progress this session.
    }
  }
}

function removeStorageItem(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  } catch {
    // ignore
  }
}

/** Load saved in-progress workflow for a job (device-local storage). */
export function loadPersistedJobProgress(
  jobId: string,
): JobProgressSnapshot | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = readStorageItem(`${STORAGE_PREFIX}${jobId}`);
    if (!raw) return null;
    return JSON.parse(raw) as JobProgressSnapshot;
  } catch {
    return null;
  }
}

function stripPhotoFields(
  data: Record<string, unknown> | undefined,
): Record<string, unknown> | undefined {
  if (!data) return data;
  const next = { ...data };
  for (const key of ['readinessPhotos', 'finishPhotos', 'keyWorkflow']) {
    if (key in next) delete next[key];
  }
  return next;
}

/** Persist workflow progress so leaving the app mid-inspection can be resumed. */
export function persistJobProgress(job: InspectionJob): void {
  if (typeof window === 'undefined') return;
  const key = `${STORAGE_PREFIX}${job.id}`;

  if (job.status === 'completed' || job.status === 'declined') {
    removeStorageItem(key);
    return;
  }

  if (!hasWorkflowProgress(job)) return;

  const snapshot: JobProgressSnapshot = {
    workflowStep: job.workflowStep,
    workflowData: job.workflowData,
    status: job.status,
  };

  try {
    writeStorageItem(key, JSON.stringify(snapshot));
  } catch {
    try {
      writeStorageItem(
        key,
        JSON.stringify({
          ...snapshot,
          workflowData: stripPhotoFields(snapshot.workflowData),
        }),
      );
    } catch {
      // Storage full — in-memory state still holds progress this session.
    }
  }
}

/** Overlay local workflow progress onto a job row from the API or demo seeds. */
export function mergeJobWithLocalProgress(
  incoming: InspectionJob,
  local?: InspectionJob | JobProgressSnapshot | null,
): InspectionJob {
  if (!local || !hasWorkflowProgress(local)) return incoming;

  const localStep = local.workflowStep ?? 0;
  const incomingStep = incoming.workflowStep ?? 0;
  const workflowStep = Math.max(localStep, incomingStep) || localStep || undefined;

  return {
    ...incoming,
    workflowStep,
    workflowData: {
      ...incoming.workflowData,
      ...local.workflowData,
    },
    status: preferStatus(
      incoming.status,
      'status' in local ? local.status : incoming.status,
    ),
  };
}

export function clampOpenWorkflowStep(step: number | undefined): number {
  if (step == null || step < 1) return 1;
  if (step >= 99) return 5;
  return Math.min(step, 5);
}

/** Drop saved workflow progress for a job (e.g. after the user resets an inspection). */
export function clearPersistedJobProgress(jobId: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(`${STORAGE_PREFIX}${jobId}`);
    sessionStorage.removeItem(`${STORAGE_PREFIX}${jobId}`);
  } catch {
    // ignore
  }
}
