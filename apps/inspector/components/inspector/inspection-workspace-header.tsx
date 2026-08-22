'use client';

import { Calendar, Hash, Home, Tag } from 'lucide-react';

import { propertyAddressLines } from '@/lib/property-address';
import { formatJobRefId } from '@/lib/job-cancellation';
import type { InspectionJob } from '@/lib/types';
import { formatScheduleWhen } from '@/lib/utils';
import { INSPECTION_PAY_LABEL } from '@/constants/inspection';

export function InspectionWorkspaceHeader({ job }: { job: InspectionJob }) {
  const { street, locality } = propertyAddressLines(job);

  return (
    <div className="border-border bg-card flex items-start gap-3 rounded-2xl border p-3">
      <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-emerald-950 ring-1 ring-emerald-500/40">
        <Home className="size-6 text-emerald-400" strokeWidth={1.75} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-foreground text-sm leading-snug font-semibold">{street}</p>
        {locality ? (
          <p className="text-muted-foreground mt-0.5 text-xs">{locality}</p>
        ) : null}
        <div className="text-muted-foreground mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
          <span className="inline-flex items-center gap-1">
            <Calendar className="size-3 text-emerald-400" />
            {formatScheduleWhen(job.scheduledTime || job.scheduledDate)}
          </span>
          <span className="inline-flex items-center gap-1">
            <Tag className="size-3 text-emerald-400" />
            {INSPECTION_PAY_LABEL[job.type] ?? job.type}
          </span>
          <span className="inline-flex items-center gap-1 font-mono">
            <Hash className="size-3 text-emerald-400" />
            Job #{formatJobRefId(job.id)}
          </span>
        </div>
      </div>
    </div>
  );
}
