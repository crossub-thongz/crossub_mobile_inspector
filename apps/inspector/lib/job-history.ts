import {
  getKeyWorkflow,
  type KeyPhaseRecord,
  type KeyWorkflowData,
} from '@/lib/key-access-workflow';
import type { InspectionJob } from '@/lib/types';

const HISTORY_STORAGE_KEY = 'crossub-inspector-completed-history';

export interface CompletedJobHistory {
  jobId: string;
  workflowStep?: number;
  workflowData?: Record<string, unknown>;
  savedAt: string;
}

export interface LabeledPhoto {
  label: string;
  url: string;
}

export interface JobHistoryReport {
  hasReport: boolean;
  completedAt?: string;
  comments?: string;
  readyToLease?: boolean | null;
  keyCollect?: KeyPhaseRecord;
  keyReturn?: KeyPhaseRecord;
  readinessPhotos: LabeledPhoto[];
  finishPhotos: LabeledPhoto[];
}

function loadHistoryStore(): Record<string, CompletedJobHistory> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = sessionStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, CompletedJobHistory>;
  } catch {
    return {};
  }
}

function saveHistoryStore(store: Record<string, CompletedJobHistory>): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(store));
  } catch {
    // Ignore quota errors — in-memory job state still holds the report.
  }
}

export function saveCompletedJobHistory(job: InspectionJob): void {
  if (typeof window === 'undefined' || job.status !== 'completed') return;
  const store = loadHistoryStore();
  store[job.id] = {
    jobId: job.id,
    workflowStep: job.workflowStep,
    workflowData: job.workflowData,
    savedAt: new Date().toISOString(),
  };
  saveHistoryStore(store);
}

export function loadCompletedJobHistory(
  jobId: string,
): CompletedJobHistory | null {
  return loadHistoryStore()[jobId] ?? null;
}

function hasServerProofPhotos(record?: KeyPhaseRecord): boolean {
  return Boolean(record?.photoUrls?.some((url) => url.startsWith('https://')));
}

/** Prefer server-synced key phases (R2 URLs) over device-local history. */
function preferKeyWorkflow(
  server?: KeyWorkflowData,
  local?: KeyWorkflowData,
): KeyWorkflowData | undefined {
  if (!server && !local) return undefined;
  if (!server) return local;
  if (!local) return server;
  return {
    collect: hasServerProofPhotos(server.collect)
      ? server.collect
      : (server.collect ?? local.collect),
    return: hasServerProofPhotos(server.return)
      ? server.return
      : (server.return ?? local.return),
  };
}

/**
 * Restore saved proof photos and workflow data onto a completed job row.
 * For API-backed jobs (`serverBacked`), the server-enriched row wins and
 * local session history only fills gaps — so key custody + findings survive
 * a new device or cleared browser storage.
 */
export function mergeJobWithHistory(
  job: InspectionJob,
  options?: { serverBacked?: boolean },
): InspectionJob {
  const history = loadCompletedJobHistory(job.id);
  if (!history?.workflowData) return job;

  if (options?.serverBacked) {
    const localKey = getKeyWorkflow({
      ...job,
      workflowData: history.workflowData,
    });
    const serverKey = getKeyWorkflow(job);
    const keyWorkflow = preferKeyWorkflow(serverKey, localKey);
    return {
      ...job,
      workflowStep: history.workflowStep ?? job.workflowStep,
      workflowData: {
        ...history.workflowData,
        ...job.workflowData,
        ...(keyWorkflow ? { keyWorkflow } : {}),
      },
    };
  }

  return {
    ...job,
    workflowStep: history.workflowStep ?? job.workflowStep,
    workflowData: {
      ...job.workflowData,
      ...history.workflowData,
    },
  };
}

function photosFromRecord(
  record: Record<string, unknown> | undefined,
): LabeledPhoto[] {
  if (!record || typeof record !== 'object' || Array.isArray(record)) return [];
  return Object.entries(record)
    .filter(([, url]) => typeof url === 'string' && url.length > 0)
    .map(([label, url]) => ({ label, url: url as string }));
}

export function buildJobHistoryReport(job: InspectionJob): JobHistoryReport {
  const data = job.workflowData ?? {};
  const keyWorkflow = getKeyWorkflow(job);
  const readinessPhotos = photosFromRecord(
    data.readinessPhotos as Record<string, unknown> | undefined,
  );
  const finishPhotos = photosFromRecord(
    data.finishPhotos as Record<string, unknown> | undefined,
  );

  const hasReport = Boolean(
    keyWorkflow?.collect ||
      keyWorkflow?.return ||
      readinessPhotos.length > 0 ||
      finishPhotos.length > 0 ||
      data.comments,
  );

  return {
    hasReport,
    completedAt:
      typeof data.inspectionFinishedAt === 'string'
        ? data.inspectionFinishedAt
        : loadCompletedJobHistory(job.id)?.savedAt,
    comments: typeof data.comments === 'string' ? data.comments : undefined,
    readyToLease:
      typeof data.readyToLease === 'boolean' ? data.readyToLease : null,
    keyCollect: keyWorkflow?.collect,
    keyReturn: keyWorkflow?.return,
    readinessPhotos,
    finishPhotos,
  };
}

export function sortJobsByHistoryDate(jobs: InspectionJob[]): InspectionJob[] {
  return [...jobs].sort((a, b) => {
    const aAt =
      loadCompletedJobHistory(a.id)?.savedAt ??
      buildJobHistoryReport(a).completedAt ??
      a.scheduledDate;
    const bAt =
      loadCompletedJobHistory(b.id)?.savedAt ??
      buildJobHistoryReport(b).completedAt ??
      b.scheduledDate;
    return new Date(bAt).getTime() - new Date(aAt).getTime();
  });
}
