'use client';

import Link from 'next/link';
import { Car, ChevronRight, Clock, MapPin, Play } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  CORE_INSPECTION_TYPES,
  type CoreInspectionType,
} from '@/constants/inspection';
import { jobDetail } from '@/constants/routes';
import { jobInspectionStarted, jobPrimaryAction } from '@/lib/inspection-job-cta';
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

export function InspectNextCard({
  job,
  origin,
}: {
  job: InspectionJob;
  origin?: GeoPoint | null;
}) {
  const visual = INSPECT_TYPE_VISUAL[job.type];
  const { street, locality } = propertyAddressLines(job);
  const destination =
    job.latitude != null && job.longitude != null
      ? { latitude: job.latitude, longitude: job.longitude }
      : null;
  const travel = computeTravelEstimate(origin, destination);
  const action = jobPrimaryAction(job, jobInspectionStarted(job));
  const rememberType = () => {
    if (CORE_INSPECTION_TYPES.includes(job.type as CoreInspectionType)) {
      writeLastInspectionsType(job.type as CoreInspectionType);
    }
  };

  return (
    <article className="border-border bg-card overflow-hidden rounded-2xl border">
      <Link
        href={jobDetail(job.id)}
        onClick={rememberType}
        className="flex items-start gap-3 p-4 pb-3"
      >
        <div className="shrink-0">
          <p className="text-primary text-[10px] font-bold tracking-wide uppercase">
            Next inspection
          </p>
          <p className="text-primary mt-1 text-2xl leading-none font-bold">
            {formatInspectTime(job.scheduledTime || job.scheduledDate)}
          </p>
          <p className="text-muted-foreground mt-1 text-xs">Today</p>
        </div>
        <div className="min-w-0 flex-1">
          <span
            className={cn(
              'inline-flex rounded-md px-1.5 py-0.5 text-[9px] font-bold tracking-wide',
              visual.badge,
            )}
          >
            {inspectTypeLabel(job.type)}
          </span>
          <p className="text-foreground mt-1.5 text-sm font-semibold leading-snug">
            {street}
          </p>
          {locality ? (
            <p className="text-muted-foreground text-xs">{locality}</p>
          ) : null}
          <div className="text-muted-foreground mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3" />
              {formatInspectDuration(job.estimatedHours)}
            </span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3" />
              {travel ? formatDistanceKm(travel.distanceKm) : '—'}
            </span>
            {travel ? (
              <span className="inline-flex items-center gap-1">
                <Car className="size-3" />
                {travel.travelMinutes} min
              </span>
            ) : null}
          </div>
        </div>
        <ChevronRight className="text-muted-foreground mt-1 size-5 shrink-0" />
      </Link>
      <div className="px-4 pb-4">
        {action.disabled ? (
          <Button className="w-full" disabled>
            {action.label}
          </Button>
        ) : (
          <Button className="w-full" asChild>
            <Link href={action.href} onClick={rememberType}>
              {action.label === 'Re-Open' ? null : (
                <Play className="size-4 fill-current" />
              )}
              {action.label === 'Re-Open' ? 'Re-Open' : 'Start Inspection'}
            </Link>
          </Button>
        )}
      </div>
    </article>
  );
}
