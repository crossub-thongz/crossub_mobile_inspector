'use client';

import Link from 'next/link';
import { Calendar } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { jobDetail, jobHistory, jobWorkflow } from '@/constants/routes';
import { buildMapUrl } from '@/lib/navigation';
import { formatJobRefId } from '@/lib/job-cancellation';
import type { InspectionJob } from '@/lib/types';
import { buildGoogleCalendarUrl, formatDateSlash } from '@/lib/utils';

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
  const actionHref = completed
    ? jobHistory(job.id)
    : paymentBlocked
      ? jobDetail(job.id)
      : jobWorkflow(job.id, job.type);

  return (
    <article className="rounded-2xl border border-border bg-card p-4">
      <p className="text-muted-foreground mb-1 font-mono text-[10px]">
        Job {formatJobRefId(job.id)}
      </p>
      <p className="text-foreground line-clamp-2 text-sm font-semibold leading-snug">
        {job.propertyAddress}
      </p>

      <p className="text-muted-foreground mt-2 flex items-center gap-1.5 text-xs">
        <Calendar className="text-primary size-3.5 shrink-0" />
        {formatDateSlash(job.scheduledDate || job.scheduledTime)}
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
        {paymentBlocked && !completed ? (
          <Button
            size="sm"
            disabled
            className="h-8 min-w-[4.5rem] rounded-full px-4 text-xs font-medium"
          >
            Awaiting payment
          </Button>
        ) : (
          <Button
            size="sm"
            variant={completed ? 'outline' : 'default'}
            className={
              completed
                ? 'border-primary text-primary h-8 w-full rounded-full text-xs font-medium'
                : 'h-8 min-w-[4.5rem] rounded-full px-4 text-xs font-medium'
            }
            asChild
          >
            <Link href={actionHref}>{completed ? 'View report' : 'Start'}</Link>
          </Button>
        )}
      </div>
    </article>
  );
}
