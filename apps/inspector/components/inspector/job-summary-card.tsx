'use client';

import { Calendar, Hash, MapPin } from 'lucide-react';

import { JobTravelInfo } from '@/components/inspector/job-travel-info';
import { PayBreakdown } from '@/components/inspector/pay-breakdown';
import { JobTypeBadge } from '@/components/inspector/status-badge';
import { useInspectorData } from '@/components/providers/inspector-data-provider';
import { formatJobRefId } from '@/lib/job-cancellation';
import type { InspectionJob } from '@/lib/types';
import { formatDateSlash, formatTime } from '@/lib/utils';

export function JobSummaryCard({
  job,
  showPayout = true,
}: {
  job: InspectionJob;
  showPayout?: boolean;
}) {
  const { deviceLocation } = useInspectorData();

  return (
    <div className="border-border bg-card space-y-3 rounded-2xl border p-4">
      <div className="flex items-start justify-between gap-2">
        <JobTypeBadge type={job.type} />
        <span className="text-muted-foreground flex items-center gap-1 font-mono text-[10px]">
          <Hash className="size-3 shrink-0" />
          {formatJobRefId(job.id)}
        </span>
      </div>

      <div>
        <p className="text-muted-foreground text-[10px] font-medium uppercase tracking-wide">
          Scheduled
        </p>
        <p className="text-foreground mt-0.5 flex items-center gap-1.5 text-sm font-medium">
          <Calendar className="text-primary size-3.5 shrink-0" />
          {formatDateSlash(job.scheduledDate || job.scheduledTime)}
          <span className="text-muted-foreground font-normal">
            · {formatTime(job.scheduledTime)}
          </span>
        </p>
      </div>

      <div>
        <p className="text-muted-foreground text-[10px] font-medium uppercase tracking-wide">
          Address
        </p>
        <p className="text-foreground mt-0.5 flex items-start gap-1.5 text-sm leading-snug font-semibold">
          <MapPin className="text-primary mt-0.5 size-3.5 shrink-0" />
          {job.propertyAddress}
        </p>
      </div>

      <JobTravelInfo job={job} deviceLocation={deviceLocation} />

      {showPayout && (
        <div className="border-border border-t pt-3">
          <p className="text-muted-foreground mb-1 text-[10px] font-medium uppercase tracking-wide">
            Job payout
          </p>
          <PayBreakdown
            hours={job.estimatedHours}
            laborAmount={job.laborAmount}
            durationLabel={job.durationLabel}
          />
        </div>
      )}
    </div>
  );
}
