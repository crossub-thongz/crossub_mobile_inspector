'use client';

import Link from 'next/link';
import { ChevronRight, Clock, MapPin } from 'lucide-react';

import { AgentStrip } from '@/components/inspector/agent-strip';
import { PayBreakdown } from '@/components/inspector/pay-breakdown';
import {
  JobStatusBadge,
  JobTypeBadge,
  PriorityBadge,
} from '@/components/inspector/status-badge';
import { jobDetail, jobHistory } from '@/constants/routes';
import { formatJobRefId } from '@/lib/job-cancellation';
import { isPoolJob } from '@/lib/inspector-job-filters';
import type { InspectionJob } from '@/lib/types';
import { formatCurrency, formatDateSlash, formatTime } from '@/lib/utils';

export function JobCard({
  job,
  showActions,
}: {
  job: InspectionJob;
  /** Pool list — tap through to preview before accepting. */
  showActions?: boolean;
}) {
  const poolPreview = showActions && isPoolJob(job);
  const detailHref =
    job.status === 'completed' ? jobHistory(job.id) : jobDetail(job.id);

  return (
    <Link
      href={detailHref}
      className="block rounded-2xl border border-border/80 bg-card p-4 transition hover:border-primary/30"
    >
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <JobTypeBadge type={job.type} />
        <PriorityBadge priority={job.priority} />
        <JobStatusBadge status={job.status} />
        <span className="text-muted-foreground ml-auto font-mono text-[10px]">
          {formatJobRefId(job.id)}
        </span>
      </div>

      {(job.agentName || job.agentCompany) && (
        <div className="mb-2">
          <AgentStrip job={job} compact nestedInLink />
        </div>
      )}

      <p className="text-sm font-semibold leading-snug">{job.propertyAddress}</p>
      <p className="text-muted-foreground mt-1 text-xs">{job.durationLabel}</p>
      <p className="text-muted-foreground mt-1 flex items-center gap-1 text-xs">
        <MapPin className="size-3 shrink-0" />
        {job.suburb}
      </p>
      <p className="text-muted-foreground mt-1 flex items-center gap-1 text-xs">
        <Clock className="size-3 shrink-0" />
        {formatDateSlash(job.scheduledDate || job.scheduledTime)} ·{' '}
        {formatTime(job.scheduledTime)}
      </p>

      <div className="mt-3 border-t border-border/60 pt-3">
        <PayBreakdown
          compact
          hours={job.estimatedHours}
          laborAmount={job.laborAmount}
        />
      </div>

      {poolPreview && (
        <p className="text-primary mt-3 flex items-center justify-center gap-1 text-xs font-medium">
          View details
          <ChevronRight className="size-3.5" />
        </p>
      )}

      {job.status === 'completed' && (
        <p className="text-primary mt-3 flex items-center justify-center gap-1 text-xs font-medium">
          View inspection report
          <ChevronRight className="size-3.5" />
        </p>
      )}
    </Link>
  );
}
