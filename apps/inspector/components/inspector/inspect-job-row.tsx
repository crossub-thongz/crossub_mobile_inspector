'use client';

import Link from 'next/link';
import { ChevronRight, Clock, MapPin, Play } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  CORE_INSPECTION_TYPES,
  type CoreInspectionType,
} from '@/constants/inspection';
import { jobDetail, jobHistory } from '@/constants/routes';
import { jobPrimaryAction } from '@/lib/inspection-job-cta';
import { writeLastInspectionsType } from '@/lib/inspections-list-prefs';
import {
  formatInspectDuration,
  formatInspectTime,
  inspectTypeLabel,
  INSPECT_TYPE_VISUAL,
} from '@/lib/inspect-type-visual';
import { propertyAddressLines } from '@/lib/property-address';
import { computeTravelEstimate, formatDistanceKm } from '@/lib/travel';
import type { GeoPoint } from '@/lib/travel';
import type { InspectionJob } from '@/lib/types';
import { cn } from '@/lib/utils';

export function InspectJobRow({
  job,
  completed = false,
  origin,
}: {
  job: InspectionJob;
  completed?: boolean;
  origin?: GeoPoint | null;
}) {
  const visual = INSPECT_TYPE_VISUAL[job.type];
  const TypeIcon = visual.icon;
  const { street, locality } = propertyAddressLines(job);
  const destination =
    job.latitude != null && job.longitude != null
      ? { latitude: job.latitude, longitude: job.longitude }
      : null;
  const travel = computeTravelEstimate(origin, destination);
  const action = jobPrimaryAction(job, job.status === 'in_progress');
  const href = completed ? jobHistory(job.id) : jobDetail(job.id);
  const rememberType = () => {
    if (CORE_INSPECTION_TYPES.includes(job.type as CoreInspectionType)) {
      writeLastInspectionsType(job.type as CoreInspectionType);
    }
  };

  return (
    <article className="border-border bg-card flex items-stretch gap-2 rounded-2xl border p-3">
      <Link
        href={href}
        onClick={rememberType}
        className="flex min-w-0 flex-1 items-stretch gap-2.5"
      >
        <div className="flex w-[3.5rem] shrink-0 flex-col justify-center">
          <p className={cn('text-[13px] leading-tight font-bold', visual.time)}>
            {formatInspectTime(job.scheduledTime || job.scheduledDate)}
          </p>
        </div>
        <div className={cn('w-0.5 shrink-0 self-stretch rounded-full', visual.bar)} />
        <div className="flex w-10 shrink-0 flex-col items-center justify-center gap-0.5">
          <TypeIcon className={cn('size-4', visual.iconWrap)} />
          <span className={cn('text-[8px] font-bold tracking-wide', visual.iconWrap)}>
            {inspectTypeLabel(job.type)}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-foreground truncate text-sm font-semibold leading-snug">
            {street}
          </p>
          {locality ? (
            <p className="text-muted-foreground truncate text-[11px]">{locality}</p>
          ) : null}
        </div>
        <div className="text-muted-foreground flex shrink-0 flex-col items-end justify-center gap-1 text-[11px]">
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3" />
            {formatInspectDuration(job.estimatedHours)}
          </span>
          <span className="inline-flex items-center gap-1">
            <MapPin className="size-3" />
            {travel ? formatDistanceKm(travel.distanceKm) : '—'}
          </span>
        </div>
      </Link>

      {!completed && !action.disabled ? (
        <Button size="sm" className="h-7 self-center px-2.5 text-[11px]" asChild>
          <Link href={action.href} onClick={rememberType}>
            <Play className="size-3 fill-current" />
            Start
          </Link>
        </Button>
      ) : null}

      <Link
        href={href}
        onClick={rememberType}
        className="text-muted-foreground flex items-center self-stretch"
        aria-label="Open job"
      >
        <ChevronRight className="size-4" />
      </Link>
    </article>
  );
}
