import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

import { JobTypeBadge } from '@/components/inspector/status-badge';
import { jobDetail } from '@/constants/routes';
import type { InspectionJob } from '@/lib/types';
import { formatCurrency, formatTime } from '@/lib/utils';

export function CompactJobRow({ job }: { job: InspectionJob }) {
  const agent = job.agentName ?? job.agentCompany;

  return (
    <Link
      href={jobDetail(job.id)}
      className="flex items-center gap-2 rounded-lg border border-border/70 bg-card px-2.5 py-2 transition hover:border-primary/30"
    >
      <JobTypeBadge type={job.type} />
      <span className="text-muted-foreground shrink-0 text-[10px] tabular-nums">
        {formatTime(job.scheduledTime)}
      </span>
      <p className="min-w-0 flex-1 truncate text-xs">
        <span className="font-medium">{job.propertyAddress}</span>
        {agent && (
          <span className="text-muted-foreground"> · {agent}</span>
        )}
      </p>
      <span className="text-primary shrink-0 text-xs font-semibold tabular-nums">
        {formatCurrency(job.laborAmount)}
      </span>
      <ChevronRight className="text-muted-foreground size-3.5 shrink-0" />
    </Link>
  );
}
