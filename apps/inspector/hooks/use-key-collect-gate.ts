'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { jobDetail, jobKeys } from '@/constants/routes';
import {
  canAccessKeyReturnTab,
  isKeyCollectComplete,
  isInspectionWorkflowFinished,
  isKeyReturnComplete,
} from '@/lib/key-access-workflow';
import type { InspectionJob, JobStatus } from '@/lib/types';

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

/** Keep return tab inaccessible until the inspection workflow is finished. */
export function useKeyReturnGate(
  job: InspectionJob | undefined,
  jobId: string,
  activeTab: 'collect' | 'return',
): void {
  const router = useRouter();

  useEffect(() => {
    if (!job?.keyAccess || activeTab !== 'return') return;
    if (!canAccessKeyReturnTab(job)) {
      router.replace(jobKeys(jobId, 'collect'));
    }
  }, [job, jobId, activeTab, router]);
}

/** Mark job in progress once the inspector enters the workflow (after key collect). */
export function useInspectionInProgress(
  job: InspectionJob | undefined,
  jobId: string,
  updateJobStatus: (id: string, status: JobStatus) => void,
): void {
  useEffect(() => {
    if (!job || job.status === 'completed') return;
    if (job.keyAccess && !isKeyCollectComplete(job)) return;
    if (job.status === 'in_progress') return;
    updateJobStatus(jobId, 'in_progress');
  }, [job, jobId, updateJobStatus]);
}

/** After inspection is submitted, send the inspector to key return (or job detail). */
export function useInspectionFinishedGate(
  job: InspectionJob | undefined,
  jobId: string,
): void {
  const router = useRouter();

  useEffect(() => {
    if (!job?.keyAccess) return;
    if (!isInspectionWorkflowFinished(job)) return;
    if (job.status === 'completed') return;
    if (!isKeyReturnComplete(job)) {
      router.replace(jobKeys(jobId, 'return'));
      return;
    }
    router.replace(jobDetail(jobId));
  }, [job, jobId, router]);
}
