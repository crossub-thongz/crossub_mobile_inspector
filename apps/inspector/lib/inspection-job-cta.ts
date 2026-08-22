import { jobAreas, jobInspect, jobDetail, jobHistory } from '@/constants/routes';
import { jobStartCta } from '@/lib/inspection-start-flow';
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

export type JobPrimaryAction = {
  label: string;
  href: string;
  disabled: boolean;
  muted?: boolean;
};

export function jobPrimaryAction(
  job: InspectionJob,
  started: boolean,
): JobPrimaryAction {
  if (job.status === 'completed') {
    return { label: 'View report', href: jobHistory(job.id), disabled: false };
  }
  if (isAwaitingApproval(job)) {
    return {
      label: 'Pending Approval',
      href: jobDetail(job.id),
      disabled: true,
      muted: true,
    };
  }
  if (canReopenInspection(job)) {
    return { label: 'Re-Open', href: jobInspect(job.id, job.type), disabled: false };
  }
  if (job.awaitingAgentPayment) {
    return {
      label: 'Awaiting payment',
      href: jobDetail(job.id),
      disabled: true,
      muted: true,
    };
  }
  return {
    label: started ? 'View' : jobStartCta(job.type, started),
    href: started ? jobInspect(job.id, job.type) : jobAreas(job.id, job.type),
    disabled: false,
  };
}
