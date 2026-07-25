'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { useInspectorData } from '@/components/providers/inspector-data-provider';
import type { InspectionJob } from '@/lib/types';
import {
  type InspectionExecutionDraft,
  buildInspectionDraftPatch,
  clearInspectionDraftPatch,
  getInspectionExecutionDraft,
} from '@/lib/inspection-execution-draft';
import { clearPersistedJobProgress } from '@/lib/job-workflow-persist';

export function useInspectionExecutionDraft<T extends InspectionExecutionDraft>(
  jobId: string,
  job: InspectionJob | undefined,
  kind: T['kind'],
  createEmpty: () => T,
) {
  const { updateJobWorkflow } = useInspectorData();
  const [draft, setDraftState] = useState<T>(createEmpty);
  const persistTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const localDraftLoaded = useRef(false);
  const draftRef = useRef(draft);
  draftRef.current = draft;

  const createEmptyRef = useRef(createEmpty);
  createEmptyRef.current = createEmpty;

  useEffect(() => {
    if (!job || localDraftLoaded.current) return;
    const saved = getInspectionExecutionDraft(job, kind) as T | null;
    if (saved) {
      setDraftState((prev) => ({
        ...prev,
        ...saved,
        kind,
      }));
    }
    localDraftLoaded.current = true;
  }, [job, kind]);

  const persistDraft = useCallback(
    (next: T) => {
      if (!job) return;
      updateJobWorkflow(
        jobId,
        Math.max(next.areaIndex + 1, 1),
        buildInspectionDraftPatch(job, next),
      );
    },
    [job, jobId, updateJobWorkflow],
  );

  const setDraft = useCallback(
    (updater: T | ((prev: T) => T)) => {
      setDraftState((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater;
        if (persistTimer.current) clearTimeout(persistTimer.current);
        persistTimer.current = setTimeout(() => persistDraft(next), 350);
        return next;
      });
    },
    [persistDraft],
  );

  const replaceDraft = useCallback(
    (next: T) => {
      setDraftState(next);
      persistDraft(next);
    },
    [persistDraft],
  );

  const clearDraft = useCallback(() => {
    if (!job) return;
    updateJobWorkflow(jobId, job.workflowStep ?? 99, clearInspectionDraftPatch());
  }, [job, jobId, updateJobWorkflow]);

  const resetDraft = useCallback(() => {
    if (persistTimer.current) clearTimeout(persistTimer.current);
    setDraftState(createEmptyRef.current());
    if (!job) return;
    updateJobWorkflow(jobId, 1, clearInspectionDraftPatch());
    clearPersistedJobProgress(jobId);
  }, [job, jobId, updateJobWorkflow]);

  useEffect(
    () => () => {
      if (persistTimer.current) {
        clearTimeout(persistTimer.current);
        if (job) persistDraft(draftRef.current);
      }
    },
    [job, persistDraft],
  );

  return {
    draft,
    setDraft,
    replaceDraft,
    clearDraft,
    resetDraft,
    localDraftLoaded,
  };
}
