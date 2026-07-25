import type { InspectionJob } from '@/lib/types';
import type { CustomAreaDefinition } from '@/lib/custom-inspection-areas';

export const INSPECTION_DRAFT_KEY = 'inspectionDraft';

export type IngoingAreaEntryDraft = {
  available: boolean | null;
  condition: string;
  comments: string;
  activeSections: string[];
  photosBySection: Record<string, string[]>;
};

export type IngoingExecutionDraft = {
  kind: 'ingoing';
  areaIndex: number;
  entries: Record<string, IngoingAreaEntryDraft>;
  customAreas?: CustomAreaDefinition[];
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
};

export type RoutineExecutionDraft = {
  kind: 'routine';
  areaIndex: number;
  method: 'physical' | 'self';
  issues: Record<string, RoutineAreaIssueDraft>;
};

export type OutgoingAreaIssueDraft = {
  available: boolean | null;
  note: string;
  responsibility: string;
  activeSections: string[];
  photosBySection: Record<string, SectionBeforeAfterDraft>;
};

export type OutgoingExecutionDraft = {
  kind: 'outgoing';
  areaIndex: number;
  issues: Record<string, OutgoingAreaIssueDraft>;
  customAreas?: CustomAreaDefinition[];
};

export type InspectionExecutionDraft =
  | IngoingExecutionDraft
  | RoutineExecutionDraft
  | OutgoingExecutionDraft;

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
  return Boolean(getInspectionExecutionDraft(job, 'ingoing'))
    || Boolean(getInspectionExecutionDraft(job, 'routine'))
    || Boolean(getInspectionExecutionDraft(job, 'outgoing'));
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
