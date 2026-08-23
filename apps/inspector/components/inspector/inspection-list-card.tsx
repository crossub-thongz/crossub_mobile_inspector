'use client';

import Link from 'next/link';
import { Calendar } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { JobTypeBadge } from '@/components/inspector/status-badge';
import { jobHistory } from '@/constants/routes';
import { CORE_INSPECTION_TYPES, type CoreInspectionType } from '@/constants/inspection';
import { jobInspectionStarted, jobPrimaryAction } from '@/lib/inspection-job-cta';
import { writeLastInspectionsType } from '@/lib/inspections-list-prefs';
import { buildMapUrl } from '@/lib/navigation';
import { formatJobRefId } from '@/lib/job-cancellation';
import type { InspectionJob } from '@/lib/types';
import { buildGoogleCalendarUrl, formatDate } from '@/lib/utils';

export function InspectionListCard({
  job,
  completed = false,
}: {
  job: InspectionJob;
  completed?: boolean;
}) {
  const mapHref = buildMapUrl(
    'google',
    job.propertyAddress,
    job.latitude,
    job.longitude,
  );
  const calendarHref = buildGoogleCalendarUrl(
    `${job.type} inspection — ${job.propertyAddress}`,
    job.scheduledTime,
    job.estimatedHours,
    job.propertyAddress,
  );
  const paymentBlocked = Boolean(job.awaitingAgentPayment);
  const action = jobPrimaryAction(job, jobInspectionStarted(job));
  const actionHref = completed ? jobHistory(job.id) : action.href;

  return (
    <article className="rounded-2xl border border-border bg-card p-4">
      {/*
        CRS-0103 — the card says what kind of inspection it is. The pool card, the
        history row, the summary card and the earnings line all carry `JobTypeBadge`;
        this one, the card the Crossub Inspection list is built from, was the only
        place a job arrived with nothing but an address on it. Under “Assigned by
        CROSSUB”, where four kinds of work sit in the same list, that left the
        inspector opening jobs to find out what they were.
      */}
      <div className="mb-1.5 flex flex-wrap items-center gap-2">
        <JobTypeBadge type={job.type} />
        <span className="text-muted-foreground ml-auto font-mono text-[10px]">
          Job {formatJobRefId(job.id)}
        </span>
      </div>
      <p className="text-foreground line-clamp-2 text-sm font-semibold leading-snug">
        {job.propertyAddress}
      </p>

      <p className="text-muted-foreground mt-2 flex items-center gap-1.5 text-xs">
        <Calendar className="text-primary size-3.5 shrink-0" />
        {formatDate(job.scheduledDate || job.scheduledTime)}
      </p>

      {!completed && paymentBlocked ? (
        <p className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-700 dark:text-amber-300">
          Waiting for the agency to pay the platform fee before you can start.
        </p>
      ) : null}

      {!completed && (
        <Button
          variant="outline"
          size="sm"
          className="border-primary text-primary mt-3 h-8 w-full rounded-full text-xs font-medium"
          asChild
        >
          <a href={calendarHref} target="_blank" rel="noopener noreferrer">
            add to my calendar
          </a>
        </Button>
      )}

      <div className={completed ? 'mt-4' : 'mt-3 flex justify-end gap-2'}>
        {!completed && (
          <Button
            variant="outline"
            size="sm"
            className="border-primary text-primary h-8 min-w-[4.5rem] rounded-full px-4 text-xs font-medium"
            asChild
          >
            <a href={mapHref} target="_blank" rel="noopener noreferrer">
              Map
            </a>
          </Button>
        )}
        {completed ? (
          <Button
            size="sm"
            variant="outline"
            className="border-primary text-primary h-8 w-full rounded-full text-xs font-medium"
            asChild
          >
            <Link href={jobHistory(job.id)}>View report</Link>
          </Button>
        ) : action.disabled ? (
          <Button
            size="sm"
            disabled
            className="h-8 min-w-[4.5rem] rounded-full px-4 text-xs font-medium"
          >
            {action.label}
          </Button>
        ) : (
          <Button
            size="sm"
            className="h-8 min-w-[4.5rem] rounded-full px-4 text-xs font-medium"
            asChild
          >
            <Link
              href={actionHref}
              onClick={() => {
                if (
                  CORE_INSPECTION_TYPES.includes(job.type as CoreInspectionType)
                ) {
                  writeLastInspectionsType(job.type as CoreInspectionType);
                }
              }}
            >
              {action.label}
            </Link>
          </Button>
        )}
      </div>
    </article>
  );
}
