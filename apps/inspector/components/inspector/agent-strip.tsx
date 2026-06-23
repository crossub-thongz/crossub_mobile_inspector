import { Mail, Phone, User } from 'lucide-react';

import type { InspectionJob } from '@/lib/types';
import { cn } from '@/lib/utils';

export function AgentStrip({
  job,
  compact,
}: {
  job: InspectionJob;
  compact?: boolean;
}) {
  if (!job.agentName && !job.agentCompany) return null;

  return (
    <div
      className={cn(
        'rounded-lg border border-primary/25 bg-primary/5',
        compact ? 'px-2 py-1' : 'px-2.5 py-2',
      )}
    >
      <div className="flex items-start gap-2">
        <User className="text-primary mt-0.5 size-3.5 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className={cn('font-semibold', compact ? 'text-[10px]' : 'text-xs')}>
            {job.agentName}
            {job.agentCompany && (
              <span className="text-muted-foreground font-normal">
                {' '}
                · {job.agentCompany}
              </span>
            )}
          </p>
          <div
            className={cn(
              'mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5',
              compact ? 'text-[9px]' : 'text-[10px]',
            )}
          >
            {job.agentEmail && (
              <a
                href={`mailto:${job.agentEmail}`}
                className="text-primary inline-flex items-center gap-1 hover:underline"
              >
                <Mail className="size-2.5 shrink-0" />
                <span className="truncate">{job.agentEmail}</span>
              </a>
            )}
            {job.agentPhone && (
              <a
                href={`tel:${job.agentPhone}`}
                className="text-primary inline-flex items-center gap-1 hover:underline"
              >
                <Phone className="size-2.5 shrink-0" />
                <span>{job.agentPhone}</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
