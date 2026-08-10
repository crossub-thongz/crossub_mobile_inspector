'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';

import { jobDetail, jobKeys, ROUTES } from '@/constants/routes';
import {
  canAccessKeyReturnTab,
  isKeyCollectComplete,
  isInspectionWorkflowFinished,
  isKeyReturnComplete,
} from '@/lib/key-access-workflow';
import type { InspectionJob, JobStatus } from '@/lib/types';

const WORKFLOW_PATH =
  /^\/jobs\/[^/]+\/(ingoing|routine|outgoing|open)\/?$/;

/**
 * Guard a workflow screen that must not start before the keys are in hand.
 *
 * Returns whether the workflow may render. **The redirect is not the gate** — callers
 * must render a blocking panel when this is `false`. `router.replace` is asynchronous,
 * so the screen keeps rendering until the navigation lands, and if the navigation
 * fails it never lands at all: an inspector could set up areas, upload a whole
 * property's photos and write notes into a screen whose every write the API rejects,
 * with nothing but a generic connection banner to show for it.
 *
 * The redirect is latched because `job` is a fresh object on every 5s poll. Unlatched,
 * the effect re-issued `router.replace` twelve times a minute, and each failed RSC
 * fetch queued another — one blocked screen produced a thousand console errors and
 * looked exactly like the API being down.
 */
export function useKeyCollectGate(
  job: InspectionJob | undefined,
  jobId: string,
): boolean {
  const router = useRouter();
  const redirected = useRef(false);
  // Undecided while the job list is still loading — the screen renders its own
  // loading state, and gating on "not yet known" would bounce the inspector out.
  const allowed = !job || !job.keyAccess || isKeyCollectComplete(job);

  useEffect(() => {
    if (allowed) {
      redirected.current = false;
      return;
    }
    if (redirected.current) return;
    redirected.current = true;
    router.replace(jobKeys(jobId, 'collect'));
  }, [allowed, jobId, router]);

  return allowed;
}

/**
 * Level 1 prepaid: block workflow screens until the agency pays.
 * Accept is allowed; Start / findings / complete are not.
 */
export function useAwaitingAgentPaymentGate(
  job: InspectionJob | undefined,
  jobId: string,
): boolean {
  const router = useRouter();
  const redirected = useRef(false);
  const allowed = !job?.awaitingAgentPayment;

  useEffect(() => {
    if (allowed) {
      redirected.current = false;
      return;
    }
    if (redirected.current) return;
    redirected.current = true;
    router.replace(jobDetail(jobId));
  }, [allowed, jobId, router]);

  return allowed;
}

/** Keep return tab inaccessible until the inspection workflow is finished. */
export function useKeyReturnGate(
  job: InspectionJob | undefined,
  jobId: string,
  activeTab: 'collect' | 'return',
): void {
  const router = useRouter();

  const redirected = useRef(false);

  useEffect(() => {
    if (!job?.keyAccess || activeTab !== 'return') return;
    if (canAccessKeyReturnTab(job)) {
      redirected.current = false;
      return;
    }
    // Latched — see useKeyCollectGate. The 5s poll re-runs this effect with a new
    // `job` object, and re-issuing a replace on each pass is what storms the router.
    if (redirected.current) return;
    redirected.current = true;
    router.replace(jobKeys(jobId, 'collect'));
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
    if (job.awaitingAgentPayment) return;
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
  const pathname = usePathname();
  const redirected = useRef(false);

  useEffect(() => {
    if (!job) return;

    if (job.status === 'completed') {
      if (redirected.current) return;
      redirected.current = true;
      router.replace(ROUTES.DASHBOARD);
      return;
    }

    if (!job.keyAccess) return;
    if (!isInspectionWorkflowFinished(job)) {
      redirected.current = false;
      return;
    }

    // The post-report celebration overlay on workflow screens owns the first hop
    // to key return — racing router.replace here left the overlay stuck on Continue.
    if (WORKFLOW_PATH.test(pathname)) {
      redirected.current = false;
      return;
    }

    // Latched — see useKeyCollectGate.
    if (redirected.current) return;
    redirected.current = true;
    if (!isKeyReturnComplete(job)) {
      window.location.assign(jobKeys(jobId, 'return'));
      return;
    }
    router.replace(jobDetail(jobId));
  }, [job, jobId, pathname, router]);
}
