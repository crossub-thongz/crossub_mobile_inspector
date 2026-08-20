import type { InspectionJob } from '@/lib/types';
import type { CustomAreaDefinition } from '@/lib/custom-inspection-areas';
import type { ItemConditionMarks } from '@/lib/item-condition-marks';
import { loadPersistedJobProgress } from '@/lib/job-workflow-persist';

export const INSPECTION_DRAFT_KEY = 'inspectionDraft';
export const INSPECTION_DEVICE_ID_KEY = 'crossub-inspector-device-id';

export type IngoingAreaEntryDraft = {
  available: boolean | null;
  condition: string;
  comments: string;
  activeSections: string[];
  photosBySection: Record<string, string[]>;
  areaPhotos?: string[];
  itemMarks?: Record<string, ItemConditionMarks>;
  itemComments?: Record<string, string>;
};

export type IngoingExecutionDraft = {
  kind: 'ingoing';
  areaIndex: number;
  entries: Record<string, IngoingAreaEntryDraft>;
  customAreas?: CustomAreaDefinition[];
  selectedAreaNames?: string[];
  areaSetupComplete?: boolean;
  updatedAt?: string;
};

export type SectionBeforeAfterDraft = {
  ingoingPhotoUrls: string[];
  outgoingPhotoUrls: string[];
};

export type RoutineAreaIssueDraft = {
  available: boolean | null;
  notes: string;
  activeSections: string[];
  photosBySection: Record<string, SectionBeforeAfterDraft>;
  areaPhotos?: string[];
  itemMarks?: Record<string, ItemConditionMarks>;
  itemComments?: Record<string, string>;
};

export type RoutineExecutionDraft = {
  kind: 'routine';
  areaIndex: number;
  method: 'physical' | 'self';
  issues: Record<string, RoutineAreaIssueDraft>;
  customAreas?: CustomAreaDefinition[];
  selectedAreaNames?: string[];
  areaSetupComplete?: boolean;
  updatedAt?: string;
};

export type OutgoingAreaIssueDraft = {
  available: boolean | null;
  note: string;
  responsibility: string;
  activeSections: string[];
  photosBySection: Record<string, SectionBeforeAfterDraft>;
  areaPhotos?: string[];
  itemMarks?: Record<string, ItemConditionMarks>;
  itemComments?: Record<string, string>;
};

export type OutgoingExecutionDraft = {
  kind: 'outgoing';
  areaIndex: number;
  issues: Record<string, OutgoingAreaIssueDraft>;
  customAreas?: CustomAreaDefinition[];
  selectedAreaNames?: string[];
  areaSetupComplete?: boolean;
  updatedAt?: string;
};

export type InspectionExecutionDraft =
  | IngoingExecutionDraft
  | RoutineExecutionDraft
  | OutgoingExecutionDraft;

export type DeviceDraftOverlay = {
  deviceId: string;
  kind: InspectionExecutionDraft['kind'];
  updatedAt: string;
  draft: InspectionExecutionDraft;
};

export function getInspectionExecutionDraft(
  job: InspectionJob | undefined,
  kind: InspectionExecutionDraft['kind'],
): InspectionExecutionDraft | null {
  const raw = job?.workflowData?.[INSPECTION_DRAFT_KEY];
  if (!raw || typeof raw !== 'object') return null;
  const draft = raw as InspectionExecutionDraft;
  return draft.kind === kind ? draft : null;
}

export function hasInspectionExecutionDraft(job: InspectionJob | undefined): boolean {
  if (!job) return false;
  if (
    Boolean(getInspectionExecutionDraft(job, 'ingoing')) ||
    Boolean(getInspectionExecutionDraft(job, 'routine')) ||
    Boolean(getInspectionExecutionDraft(job, 'outgoing'))
  ) {
    return true;
  }
  const persisted = loadPersistedJobProgress(job.id);
  const raw = persisted?.workflowData?.[INSPECTION_DRAFT_KEY];
  return Boolean(raw && typeof raw === 'object');
}

export function buildInspectionDraftPatch(
  job: InspectionJob,
  draft: InspectionExecutionDraft,
): Record<string, unknown> {
  return {
    [INSPECTION_DRAFT_KEY]: draft,
  };
}

export function clearInspectionDraftPatch(): Record<string, unknown> {
  return { [INSPECTION_DRAFT_KEY]: undefined };
}

export function mergePhotoUrlLists(...lists: Array<string[] | undefined>): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const list of lists) {
    for (const url of list ?? []) {
      const trimmed = url.trim();
      if (!trimmed || seen.has(trimmed)) continue;
      seen.add(trimmed);
      out.push(trimmed);
    }
  }
  return out;
}

export function stampDraftUpdatedAt<T extends InspectionExecutionDraft>(draft: T): T {
  return { ...draft, updatedAt: new Date().toISOString() };
}

export function getOrCreateInspectionDeviceId(): string {
  if (typeof window === 'undefined') return 'server';
  try {
    const existing = localStorage.getItem(INSPECTION_DEVICE_ID_KEY);
    if (existing?.trim()) return existing.trim();
    const created = `dev-${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
    localStorage.setItem(INSPECTION_DEVICE_ID_KEY, created);
    return created;
  } catch {
    return `dev-${Date.now().toString(36)}`;
  }
}

export function sanitizeDraftForSync(draft: InspectionExecutionDraft): Record<string, unknown> {
  return stripDataUrlLeaves(draft) as Record<string, unknown>;
}

function stripDataUrlLeaves(value: unknown): unknown {
  if (typeof value === 'string') {
    return value.startsWith('data:') ? undefined : value;
  }
  if (Array.isArray(value)) {
    return value
      .map((item) => stripDataUrlLeaves(item))
      .filter((item) => item != null && item !== '');
  }
  if (value && typeof value === 'object') {
    const next: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value)) {
      const cleaned = stripDataUrlLeaves(nested);
      if (cleaned !== undefined) next[key] = cleaned;
    }
    return next;
  }
  return value;
}

export function computeResumeAreaIndex(
  catalogLength: number,
  records: Array<{ available: boolean | null; complete?: boolean }>,
  savedIndex: number,
): number {
  if (savedIndex >= 0 && savedIndex < catalogLength) return savedIndex;
  const firstIncomplete = records.findIndex(
    (rec) => rec.available == null || (rec.available === true && !rec.complete),
  );
  if (firstIncomplete >= 0) return firstIncomplete;
  return Math.max(0, Math.min(savedIndex, catalogLength - 1));
}
