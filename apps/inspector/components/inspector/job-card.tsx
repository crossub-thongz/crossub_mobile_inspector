'use client';

import Link from 'next/link';
import { Clock, MapPin, Navigation } from 'lucide-react';

import { AgentStrip } from '@/components/inspector/agent-strip';
import { PayBreakdown } from '@/components/inspector/pay-breakdown';
import {
  JobStatusBadge,
  JobTypeBadge,
  PriorityBadge,
} from '@/components/inspector/status-badge';
import { Button } from '@/components/ui/button';
import { jobDetail } from '@/constants/routes';
import type { InspectionJob } from '@/lib/types';
import { formatDateTime } from '@/lib/utils';

export function JobCard({
  job,
  onAccept,
  onDecline,
  showActions,
}: {
  job: InspectionJob;
  onAccept?: (id: string) => void;
  onDecline?: (id: string) => void;
  showActions?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border/80 bg-card p-4">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <JobTypeBadge type={job.type} />
        <PriorityBadge priority={job.priority} />
        <JobStatusBadge status={job.status} />
      </div>

      {(job.agentName || job.agentCompany) && (
        <div className="mb-2">
          <AgentStrip job={job} compact />
        </div>
      )}

      <Link href={jobDetail(job.id)} className="block">
        <p className="text-sm font-semibold leading-snug">{job.propertyAddress}</p>
        <p className="text-muted-foreground mt-1 text-xs">{job.durationLabel}</p>
        <p className="text-muted-foreground mt-1 flex items-center gap-1 text-xs">
          <MapPin className="size-3 shrink-0" />
          {job.suburb}
        </p>
        <p className="text-muted-foreground mt-1 flex items-center gap-1 text-xs">
          <Clock className="size-3 shrink-0" />
          {formatDateTime(job.scheduledTime)} · {job.estimatedHours}h allocated
        </p>
      </Link>

      <div className="mt-3 border-t border-border/60 pt-3">
        <PayBreakdown
          compact
          hours={job.estimatedHours}
          laborAmount={job.laborAmount}
        />
      </div>

      {showActions && job.status === 'available' && (
        <div className="mt-3 flex gap-2">
          <Button
            className="flex-1"
            size="sm"
            onClick={() => onAccept?.(job.id)}
          >
            Accept Job
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            size="sm"
            onClick={() => onDecline?.(job.id)}
          >
            Decline
          </Button>
        </div>
      )}

      {job.status !== 'available' && job.status !== 'completed' && (
        <Link href={jobDetail(job.id)} className="mt-3 block">
          <Button variant="secondary" className="w-full" size="sm">
            <Navigation className="size-3.5" />
            Open Job
          </Button>
        </Link>
      )}
    </div>
  );
}
