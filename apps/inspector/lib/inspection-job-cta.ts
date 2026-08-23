import { jobAreas, jobInspect, jobDetail, jobHistory } from '@/constants/routes';
import { hasInspectionExecutionDraft } from '@/lib/inspection-execution-draft';
import { jobStartCta } from '@/lib/inspection-start-flow';
import { isKeyCollectComplete } from '@/lib/key-access-workflow';
import type { InspectionJob } from '@/lib/types';

export function needsAgentReportApproval(job: Pick<InspectionJob, 'type'>): boolean {
  return job.type === 'ingoing' || job.type === 'outgoing';
}

export function isAwaitingApproval(job: Pick<InspectionJob, 'status'>): boolean {
  return job.status === 'awaiting_approval';
}

export function canReopenInspection(job: InspectionJob): boolean {
  return Boolean(job.reportDeclineReason) && job.status !== 'completed';
}

/** Field work has begun — accept alone maps to in_progress on the API. */
export function jobInspectionStarted(job: InspectionJob): boolean {
  return (job.workflowStep ?? 0) > 0 || hasInspectionExecutionDraft(job);
}

/** Handover or inspection notes/photos already on the job — resume, don't start over. */
export function jobInspectionContinuing(job: InspectionJob): boolean {
  if (jobInspectionStarted(job)) return true;
  return Boolean(job.keyAccess && isKeyCollectComplete(job));
}

export type JobPrimaryAction = {
  label: string;
  href: string;
  disabled: boolean;
  muted?: boolean;
};

export function inspectListCtaLabel(
  job: InspectionJob,
  action: JobPrimaryAction,
  compact = false,
): string {
  if (action.disabled || action.label === 'Re-Open') return action.label;
  if (jobInspectionContinuing(job)) {
    return compact ? 'Continue' : 'Continue Inspection';
  }
  return compact ? 'Start' : 'Start Inspection';
}

export function jobPrimaryAction(
  job: InspectionJob,
  started: boolean,
): JobPrimaryAction {
  if (job.status === 'completed') {
    return { label: 'View report', href: jobHistory(job.id), disabled: false };
  }
  if (canReopenInspection(job)) {
    return { label: 'Re-Open', href: jobInspect(job.id, job.type), disabled: false };
  }
  if (isAwaitingApproval(job)) {
    return {
      label: 'Pending Approval',
      href: jobDetail(job.id),
      disabled: true,
      muted: true,
    };
  }
  if (job.awaitingAgentPayment) {
    return {
      label: 'Awaiting payment',
      href: jobDetail(job.id),
      disabled: true,
      muted: true,
    };
  }
  // First Start Inspection after accept must open Job Details. Accept sets
  // IN_PROGRESS on the API, which used to skip details and land on Handover
  // via the key-collect gate on Areas/Inspect.
  const continuing = started || jobInspectionContinuing(job);
  const href =
    job.type === 'open'
      ? jobInspect(job.id, job.type)
      : job.keyAccess && !isKeyCollectComplete(job)
        ? jobDetail(job.id)
        : started
          ? jobInspect(job.id, job.type)
          : jobAreas(job.id, job.type);
  return {
    label: jobStartCta(job.type, continuing),
    href,
    disabled: false,
  };
}
