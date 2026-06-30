'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { jobKeys } from '@/constants/routes';
import { isKeyCollectComplete } from '@/lib/key-access-workflow';
import type { InspectionJob } from '@/lib/types';

/** Redirect to key collect if required and not yet completed. */
export function useKeyCollectGate(
  job: InspectionJob | undefined,
  jobId: string,
): void {
  const router = useRouter();

  useEffect(() => {
    if (!job?.keyAccess) return;
    if (!isKeyCollectComplete(job)) {
      router.replace(jobKeys(jobId, 'collect'));
    }
  }, [job, jobId, router]);
}

/** Mark inspection workflow as started so key return tab unlocks. */
export function useInspectionWorkflowStart(
  job: InspectionJob | undefined,
  jobId: string,
  updateJobWorkflow: (
    id: string,
    step: number,
    data?: Record<string, unknown>,
  ) => void,
): void {
  useEffect(() => {
    if (!job || job.status === 'completed') return;
    if ((job.workflowStep ?? 0) === 0) {
      updateJobWorkflow(jobId, 1, {});
    }
  }, [job, jobId, updateJobWorkflow]);
}
