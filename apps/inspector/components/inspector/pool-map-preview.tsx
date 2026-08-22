'use client';

import { ExternalLink } from 'lucide-react';

import { cn } from '@/lib/utils';

function lon2tile(lon: number, zoom: number) {
  return ((lon + 180) / 360) * 2 ** zoom;
}

function lat2tile(lat: number, zoom: number) {
  const rad = (lat * Math.PI) / 180;
  return (
    ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * 2 ** zoom
  );
}

export function PoolMapPreview({
  latitude,
  longitude,
  mapsHref,
  className,
}: {
  latitude?: number;
  longitude?: number;
  mapsHref: string;
  className?: string;
}) {
  const hasPoint =
    latitude != null &&
    longitude != null &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude);
  const zoom = 13;
  const tileXf = hasPoint ? lon2tile(longitude, zoom) : 0;
  const tileYf = hasPoint ? lat2tile(latitude, zoom) : 0;
  const tileX = Math.floor(tileXf);
  const tileY = Math.floor(tileYf);
  const markerLeft = hasPoint ? `${(tileXf - tileX) * 100}%` : '50%';
  const markerTop = hasPoint ? `${(tileYf - tileY) * 100}%` : '50%';
  const tileUrl = hasPoint
    ? `https://basemaps.cartocdn.com/dark_all/${zoom}/${tileX}/${tileY}@2x.png`
    : null;

  return (
    <a
      href={mapsHref}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'relative block overflow-hidden rounded-xl border border-border bg-secondary',
        className,
      )}
      onClick={(event) => event.stopPropagation()}
    >
      {tileUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={tileUrl}
          alt=""
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="bg-secondary h-full w-full" />
      )}
      {hasPoint ? (
        <span
          className="absolute size-3 -translate-x-1/2 -translate-y-1/2"
          style={{ left: markerLeft, top: markerTop }}
        >
          <span className="bg-primary/40 absolute inset-0 animate-ping rounded-full" />
          <span className="bg-primary absolute inset-[3px] rounded-full ring-2 ring-primary/80" />
        </span>
      ) : null}
      <span className="absolute right-1 bottom-1 inline-flex items-center gap-0.5 rounded-md bg-black/70 px-1.5 py-0.5 text-[9px] font-medium text-white">
        View on map
        <ExternalLink className="size-2.5" />
      </span>
    </a>
  );
}
