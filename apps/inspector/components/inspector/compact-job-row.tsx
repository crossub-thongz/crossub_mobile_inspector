import Link from 'next/link';
import { ChevronRight, Clock } from 'lucide-react';

import { AgentStrip } from '@/components/inspector/agent-strip';
import { JobTypeBadge } from '@/components/inspector/status-badge';
import { jobDetail } from '@/constants/routes';
import type { InspectionJob } from '@/lib/types';
import { formatCurrency, formatTime } from '@/lib/utils';

export function CompactJobRow({ job }: { job: InspectionJob }) {
  return (
    <div className="space-y-1 rounded-lg border border-border/70 bg-card px-2.5 py-2">
      <Link
        href={jobDetail(job.id)}
        className="flex items-center gap-2 transition hover:opacity-90"
      >
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-1.5">
            <JobTypeBadge type={job.type} />
            <span className="text-muted-foreground flex items-center gap-0.5 text-[10px]">
              <Clock className="size-2.5" />
              {formatTime(job.scheduledTime)}
            </span>
          </div>
          <p className="truncate text-xs font-medium">{job.propertyAddress}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-primary text-xs font-semibold tabular-nums">
            {formatCurrency(job.laborAmount)}
          </p>
          <p className="text-muted-foreground text-[9px]">{job.estimatedHours}h</p>
          <ChevronRight className="text-muted-foreground ml-auto size-3.5" />
        </div>
      </Link>
      {(job.agentName || job.agentCompany) && (
        <AgentStrip job={job} compact />
      )}
    </div>
  );
}
