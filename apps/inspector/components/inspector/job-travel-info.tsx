'use client';

import { Clock, MapPin, Navigation } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { buildGoogleDirectionsUrl } from '@/lib/navigation';
import type { InspectionJob } from '@/lib/types';
import type { GeoPoint } from '@/lib/travel';
import {
  computeTravelEstimate,
  formatDistanceKm,
  formatTravelSummary,
} from '@/lib/travel';
import { cn } from '@/lib/utils';

function DirectionsControl({
  mapsHref,
  nestedInLink,
  compact,
}: {
  mapsHref: string;
  nestedInLink?: boolean;
  compact?: boolean;
}) {
  const label = compact ? (
    <>
      <Navigation className="size-3" />
      Directions
    </>
  ) : (
    <>
      <Navigation className="size-3.5" />
      Google Maps
    </>
  );

  if (nestedInLink) {
    return (
      <Button
        type="button"
        variant={compact ? 'link' : 'outline'}
        size="sm"
        className={compact ? 'h-auto px-0 text-xs' : undefined}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          window.open(mapsHref, '_blank', 'noopener,noreferrer');
        }}
      >
        {label}
      </Button>
    );
  }

  return (
    <Button variant={compact ? 'link' : 'outline'} size="sm" className={compact ? 'h-auto px-0 text-xs' : undefined} asChild>
      <a href={mapsHref} target="_blank" rel="noopener noreferrer">
        {label}
      </a>
    </Button>
  );
}

export function JobTravelInfo({
  job,
  deviceLocation,
  compact = false,
  nestedInLink = false,
  className,
}: {
  job: InspectionJob;
  deviceLocation: GeoPoint | null;
  compact?: boolean;
  /** When rendered inside a card link, use a button so we do not nest `<a>` tags. */
  nestedInLink?: boolean;
  className?: string;
}) {
  const destination =
    job.latitude != null && job.longitude != null
      ? { latitude: job.latitude, longitude: job.longitude }
      : null;
  const travel = computeTravelEstimate(deviceLocation, destination);
  const mapsHref = buildGoogleDirectionsUrl(
    deviceLocation ?? { address: 'My location' },
    {
      latitude: job.latitude,
      longitude: job.longitude,
      address: job.propertyAddress,
    },
  );

  if (compact) {
    return (
      <div className={cn('flex flex-wrap items-center gap-x-2 gap-y-1 text-xs', className)}>
        <span className="text-muted-foreground inline-flex items-center gap-1">
          <MapPin className="size-3 shrink-0" />
          {travel ? formatTravelSummary(travel) : 'Distance unavailable'}
        </span>
        <DirectionsControl mapsHref={mapsHref} nestedInLink={nestedInLink} compact />
      </div>
    );
  }

  return (
    <div className={cn('space-y-3 rounded-xl border border-border bg-card p-4', className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-muted-foreground text-[10px] font-medium uppercase tracking-wide">
            Travel to site
          </p>
          {travel ? (
            <p className="text-foreground mt-1 text-sm font-semibold tabular-nums">
              {formatDistanceKm(travel.distanceKm)}
              <span className="text-muted-foreground font-normal"> · </span>
              <span className="inline-flex items-center gap-1 font-normal">
                <Clock className="size-3.5" />~{travel.travelMinutes} min ETA
              </span>
            </p>
          ) : (
            <p className="text-muted-foreground mt-1 text-sm">
              {deviceLocation
                ? 'Site coordinates unavailable — open directions by address.'
                : 'Allow location access to see live distance and ETA.'}
            </p>
          )}
        </div>
        <DirectionsControl mapsHref={mapsHref} nestedInLink={nestedInLink} />
      </div>
      <p className="text-muted-foreground text-[10px] leading-relaxed">
        From your live location
        {deviceLocation
          ? ` (${deviceLocation.latitude.toFixed(4)}, ${deviceLocation.longitude.toFixed(4)})`
          : ''}{' '}
        to {job.propertyAddress}.
      </p>
    </div>
  );
}
