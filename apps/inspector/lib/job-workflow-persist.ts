import type { InspectionJob, JobStatus } from '@/lib/types';

const SESSION_PREFIX = 'crossub-inspector-job:';

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
  return STATUS_RANK[local] >= STATUS_RANK[incoming] ? local : incoming;
}

function hasWorkflowProgress(snapshot: JobProgressSnapshot | undefined): boolean {
  if (!snapshot) return false;
  if ((snapshot.workflowStep ?? 0) > 0) return true;
  return Boolean(
    snapshot.workflowData && Object.keys(snapshot.workflowData).length > 0,
  );
}

/** Load saved in-progress workflow for a job (session tab storage). */
export function loadPersistedJobProgress(
  jobId: string,
): JobProgressSnapshot | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(`${SESSION_PREFIX}${jobId}`);
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
  const key = `${SESSION_PREFIX}${job.id}`;

  if (job.status === 'completed' || job.status === 'declined') {
    sessionStorage.removeItem(key);
    return;
  }

  if (!hasWorkflowProgress(job)) return;

  const snapshot: JobProgressSnapshot = {
    workflowStep: job.workflowStep,
    workflowData: job.workflowData,
    status: job.status,
  };

  try {
    sessionStorage.setItem(key, JSON.stringify(snapshot));
  } catch {
    try {
      sessionStorage.setItem(
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
