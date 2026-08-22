'use client';

import Link from 'next/link';
import { MoreVertical, User } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  CORE_INSPECTION_TYPES,
  INSPECTION_PAY_LABEL,
  type CoreInspectionType,
} from '@/constants/inspection';
import { jobDetail } from '@/constants/routes';
import { writeLastInspectionsType } from '@/lib/inspections-list-prefs';
import { jobPrimaryAction } from '@/lib/inspection-job-cta';
import type { InspectionJob } from '@/lib/types';

const TIME_FMT = new Intl.DateTimeFormat('en-AU', {
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
});

const SHORT_DATE_FMT = new Intl.DateTimeFormat('en-AU', {
  day: 'numeric',
  month: 'short',
});

function formatRowTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return TIME_FMT.format(date).replace(/\b(am|pm)\b/gi, (part) => part.toUpperCase());
}

function formatRowDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return SHORT_DATE_FMT.format(date);
}

function typeLabel(job: InspectionJob): string {
  const core = INSPECTION_PAY_LABEL[job.type] ?? job.type;
  return `${core} Inspection`;
}

function isStarted(job: InspectionJob): boolean {
  return (
    job.status === 'in_progress' ||
    job.status === 'arrived' ||
    job.status === 'on_the_way' ||
    (job.workflowStep ?? 0) > 0
  );
}

export function DashboardInspectionRow({ job }: { job: InspectionJob }) {
  const started = isStarted(job);
  const action = jobPrimaryAction(job, started);
  const agent = job.agentCompany || job.agentName || '—';

  return (
    <article className="flex items-stretch gap-3 border-b border-border py-3 last:border-b-0">
      <div className="flex w-[4.25rem] shrink-0 flex-col justify-center">
        <p className="text-foreground text-[13px] font-semibold leading-tight">
          {formatRowTime(job.scheduledTime)}
        </p>
        <p className="text-muted-foreground mt-0.5 text-[11px]">
          {formatRowDate(job.scheduledDate || job.scheduledTime)}
        </p>
      </div>

      <div className="bg-primary w-0.5 shrink-0 self-stretch rounded-full" />

      <div className="min-w-0 flex-1">
        <p className="text-foreground truncate text-sm font-semibold leading-snug">
          {job.propertyAddress}
        </p>
        <p className="text-muted-foreground mt-0.5 text-xs">{typeLabel(job)}</p>
        <p className="text-muted-foreground mt-1 flex items-center gap-1 text-[11px]">
          <User className="size-3 shrink-0" />
          <span className="truncate">Agent: {agent}</span>
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        {action.disabled ? (
          <Button
            size="sm"
            variant="outline"
            disabled
            className="text-muted-foreground h-8 rounded-full px-3 text-[11px] font-medium"
          >
            {action.label}
          </Button>
        ) : (
          <Button
            size="sm"
            variant="outline"
            className="border-primary text-primary h-8 rounded-full px-3 text-[11px] font-medium"
            asChild
          >
            <Link
              href={action.href}
              onClick={() => {
                if (CORE_INSPECTION_TYPES.includes(job.type as CoreInspectionType)) {
                  writeLastInspectionsType(job.type as CoreInspectionType);
                }
              }}
            >
              {action.label}
              <span className="ml-0.5">›</span>
            </Link>
          </Button>
        )}
        <Link
          href={jobDetail(job.id)}
          className="text-muted-foreground hover:text-foreground flex size-8 items-center justify-center rounded-full"
          aria-label={`Job details for ${job.propertyAddress}`}
        >
          <MoreVertical className="size-4" />
        </Link>
      </div>
    </article>
  );
}
