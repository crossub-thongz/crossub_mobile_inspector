'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ChevronRight } from 'lucide-react';

import { JobDetailsSummaryCard } from '@/components/inspector/job-details-summary-card';
import { JobKeyDetailsCard } from '@/components/inspector/job-key-details-card';
import { JobLookupFallback } from '@/components/inspector/job-lookup-fallback';
import { JobSummaryCard } from '@/components/inspector/job-summary-card';
import { JobWorkspaceNav } from '@/components/inspector/job-workspace-nav';
import { InspectorShell } from '@/components/layout/inspector-shell';
import { useInspectorData } from '@/components/providers/inspector-data-provider';
import { Button } from '@/components/ui/button';
import { INSPECTION_PAY_LABEL } from '@/constants/inspection';
import {
  jobDetail,
  jobHistory,
  jobKeys,
  ROUTES,
} from '@/constants/routes';
import { isPoolJob } from '@/lib/inspector-job-filters';
import { jobLookupMiss } from '@/lib/job-lookup';
import {
  isInspectionWorkflowFinished,
  isKeyCollectComplete,
  isKeyReturnComplete,
} from '@/lib/key-access-workflow';
import { hasInspectionExecutionDraft } from '@/lib/inspection-execution-draft';
import { jobPrimaryAction } from '@/lib/inspection-job-cta';

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { getJob, acceptJob, declineJob, jobsHydrated } = useInspectorData();
  const job = getJob(id);

  if (!job) {
    return (
      <JobLookupFallback
        state={jobLookupMiss(jobsHydrated)}
        backHref={ROUTES.JOB_POOL}
      />
    );
  }

  const poolPreview = isPoolJob(job);
  const backHref = poolPreview ? ROUTES.JOB_POOL : ROUTES.INSPECTIONS;
  const workflowStarted =
    (job.workflowStep ?? 0) > 0 ||
    hasInspectionExecutionDraft(job) ||
    job.status === 'in_progress';
  const primaryAction = jobPrimaryAction(job, workflowStarted);
  const workflowHref = primaryAction.href;
  const keyCollectDone = isKeyCollectComplete(job);
  const keyReturnDone = isKeyReturnComplete(job);
  const inspectionFinished = isInspectionWorkflowFinished(job);
  const paymentBlocked = Boolean(job.awaitingAgentPayment);
  const keysBlocked = Boolean(job.keyAccess && !keyCollectDone);
  const returnPending =
    job.keyAccess && inspectionFinished && !keyReturnDone && job.status !== 'completed';

  const handleAccept = () => {
    void (async () => {
      const result = await acceptJob(id);
      if (result?.awaitingAgentPayment) return;
      router.push(workflowHref);
    })();
  };

  if (poolPreview) {
    return (
      <InspectorShell title="Job preview" backHref={backHref}>
        <div className="space-y-4">
          <p className="text-muted-foreground text-xs">
            Review scheduled date, address, payout, and job type. Accept to open
            the {job.type} inspection workflow.
          </p>
          <JobSummaryCard job={job} />
          {paymentBlocked ? (
            <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-400">
              Waiting for the agency to pay the platform fee. You can accept this
              job, but you cannot start until payment clears.
            </p>
          ) : null}
          <div className="space-y-2">
            <Button className="w-full" onClick={handleAccept}>
              Accept job
            </Button>
            <Button
              className="w-full"
              variant="outline"
              onClick={() => {
                declineJob(id);
                router.push(ROUTES.JOB_POOL);
              }}
            >
              Decline
            </Button>
          </div>
        </div>
      </InspectorShell>
    );
  }

  const workspaceTitle = `${INSPECTION_PAY_LABEL[job.type] ?? job.type} Inspection`;
  const handoverNext = Boolean(job.keyAccess && !keyCollectDone && !paymentBlocked);
  const ctaHref = paymentBlocked
    ? jobDetail(job.id)
    : returnPending
      ? jobKeys(job.id, 'return')
      : handoverNext
        ? jobKeys(job.id, 'collect')
        : workflowHref;
  const ctaLabel = paymentBlocked
    ? 'Waiting for agency payment'
    : job.status === 'awaiting_approval'
      ? 'Pending Approval'
      : job.status === 'completed'
        ? 'View inspection report'
        : returnPending
          ? 'Return keys'
          : handoverNext
            ? 'Continue to Handover'
            : primaryAction.label;
  const ctaDisabled =
    paymentBlocked ||
    job.status === 'awaiting_approval' ||
    (handoverNext ? false : keysBlocked);

  return (
    <InspectorShell title={workspaceTitle} backHref={backHref} variant="workspace">
      <JobWorkspaceNav job={job} active="details" />
      <div className="space-y-3">
        {paymentBlocked ? (
          <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-400">
            Waiting for the agency to pay the platform fee. You cannot start
            this job until payment clears.
          </p>
        ) : keysBlocked ? (
          <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-400">
            Complete handover before starting the inspection.
          </p>
        ) : null}

        {job.reportDeclineReason &&
        job.status !== 'completed' &&
        job.status !== 'awaiting_approval' ? (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            <span className="font-semibold">Report declined — </span>
            {job.reportDeclineReason} Redo the inspection and resubmit your report.
          </p>
        ) : null}

        {returnPending ? (
          <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-400">
            Inspection finished — return the keys to complete this task.
          </p>
        ) : null}

        <JobDetailsSummaryCard job={job} />
        <JobKeyDetailsCard job={job} />

        {job.status === 'completed' ? (
          <Button className="w-full" asChild>
            <Link href={jobHistory(job.id)}>
              View inspection report
              <ChevronRight className="ml-auto size-4" />
            </Link>
          </Button>
        ) : (
          <Button className="relative w-full" disabled={ctaDisabled} asChild={!ctaDisabled}>
            {ctaDisabled ? (
              ctaLabel
            ) : (
              <Link
                href={ctaHref}
                onClick={(event) => {
                  if (paymentBlocked) event.preventDefault();
                }}
              >
                {ctaLabel}
                <ChevronRight className="absolute right-3 size-4" />
              </Link>
            )}
          </Button>
        )}
      </div>
    </InspectorShell>
  );
}
