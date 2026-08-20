'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { useInspectorData } from '@/components/providers/inspector-data-provider';
import type { InspectionJob } from '@/lib/types';
import {
  type InspectionExecutionDraft,
  buildInspectionDraftPatch,
  clearInspectionDraftPatch,
  getInspectionExecutionDraft,
  getOrCreateInspectionDeviceId,
  sanitizeDraftForSync,
  stampDraftUpdatedAt,
} from '@/lib/inspection-execution-draft';
import { clearPersistedJobProgress } from '@/lib/job-workflow-persist';
import {
  fetchInspectionDetail,
  saveInspectionExecutionDraft,
  type InspectorDeviceDraftOverlay,
} from '@/lib/crossub-api/inspector-client';
import {
  mergeDeviceExecutionDrafts,
  mergeIngoingExecutionDraft,
  mergeOutgoingExecutionDraft,
  mergeRoutineExecutionDraft,
} from '@/lib/inspection-execution-hydration';

function mergeByKind<T extends InspectionExecutionDraft>(
  kind: T['kind'],
  baseline: T,
  overlays: InspectorDeviceDraftOverlay[],
): T {
  if (kind === 'ingoing') {
    return mergeDeviceExecutionDrafts(
      'ingoing',
      baseline as InspectionExecutionDraft & { kind: 'ingoing' },
      overlays,
      mergeIngoingExecutionDraft,
    ) as T;
  }
  if (kind === 'outgoing') {
    return mergeDeviceExecutionDrafts(
      'outgoing',
      baseline as InspectionExecutionDraft & { kind: 'outgoing' },
      overlays,
      mergeOutgoingExecutionDraft,
    ) as T;
  }
  return mergeDeviceExecutionDrafts(
    'routine',
    baseline as InspectionExecutionDraft & { kind: 'routine' },
    overlays,
    mergeRoutineExecutionDraft,
  ) as T;
}

export function useInspectionExecutionDraft<T extends InspectionExecutionDraft>(
  jobId: string,
  job: InspectionJob | undefined,
  kind: T['kind'],
  createEmpty: () => T,
) {
  const { updateJobWorkflow, apiConnected } = useInspectorData();
  const [draft, setDraftState] = useState<T>(createEmpty);
  const persistTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const localDraftLoaded = useRef(false);
  const remoteMerged = useRef(false);
  const draftRef = useRef(draft);
  draftRef.current = draft;
  const deviceIdRef = useRef(getOrCreateInspectionDeviceId());

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

  useEffect(() => {
    if (!apiConnected || !jobId || !localDraftLoaded.current || remoteMerged.current) {
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const detail = await fetchInspectionDetail(jobId);
        if (cancelled) return;
        const overlays =
          ((detail as { executionDrafts?: InspectorDeviceDraftOverlay[] })
            .executionDrafts ?? []) as InspectorDeviceDraftOverlay[];
        const others = overlays.filter(
          (overlay) => overlay.deviceId !== deviceIdRef.current,
        );
        if (others.length === 0) {
          remoteMerged.current = true;
          return;
        }
        setDraftState((prev) => {
          const merged = mergeByKind(kind, prev, others);
          return { ...merged, kind, updatedAt: prev.updatedAt ?? merged.updatedAt };
        });
        toast.message(
          others.length === 1
            ? 'Merged progress from another device'
            : `Merged progress from ${others.length} other devices`,
        );
      } catch {
        // Offline / unassigned — keep the local draft.
      } finally {
        if (!cancelled) remoteMerged.current = true;
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [apiConnected, jobId, kind]);

  const persistDraft = useCallback(
    (next: T) => {
      if (!job) return;
      const stamped = stampDraftUpdatedAt(next);
      updateJobWorkflow(
        jobId,
        Math.max(stamped.areaIndex + 1, 1),
        buildInspectionDraftPatch(job, stamped),
      );
      if (!apiConnected) return;
      void saveInspectionExecutionDraft(jobId, {
        deviceId: deviceIdRef.current,
        kind,
        updatedAt: stamped.updatedAt,
        draft: sanitizeDraftForSync(stamped),
      }).catch(() => {
        // Local persist still holds the walk; retry on the next edit.
      });
    },
    [apiConnected, job, jobId, kind, updateJobWorkflow],
  );

  const setDraft = useCallback(
    (updater: T | ((prev: T) => T)) => {
      setDraftState((prev) => {
        const next = stampDraftUpdatedAt(
          typeof updater === 'function' ? updater(prev) : updater,
        );
        if (persistTimer.current) clearTimeout(persistTimer.current);
        persistTimer.current = setTimeout(() => persistDraft(next), 350);
        return next;
      });
    },
    [persistDraft],
  );

  const replaceDraft = useCallback(
    (next: T) => {
      const stamped = stampDraftUpdatedAt(next);
      setDraftState(stamped);
      persistDraft(stamped);
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

  useEffect(() => {
    const flush = () => {
      if (!job) return;
      if (persistTimer.current) {
        clearTimeout(persistTimer.current);
        persistTimer.current = null;
      }
      persistDraft(draftRef.current);
    };
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') flush();
    };
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('pagehide', flush);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [job, persistDraft]);

  return {
    draft,
    setDraft,
    replaceDraft,
    clearDraft,
    resetDraft,
    localDraftLoaded,
  };
}
