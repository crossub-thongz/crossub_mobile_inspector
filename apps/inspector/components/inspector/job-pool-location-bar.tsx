'use client';

import { useEffect, useState } from 'react';
import { MapPin, Navigation, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  POOL_RADIUS_OPTIONS,
  reverseGeocodeLabel,
  searchPlaces,
  type GeocodeHit,
  type PoolOrigin,
  type PoolRadiusKm,
  type PoolSort,
} from '@/lib/pool-location';
import type { GeoPoint } from '@/lib/travel';
import { cn } from '@/lib/utils';

export function JobPoolLocationBar({
  origin,
  gps,
  radiusKm,
  sort,
  onOriginChange,
  onRadiusChange,
  onSortChange,
}: {
  origin: PoolOrigin | null;
  gps: GeoPoint | null;
  radiusKm: PoolRadiusKm;
  sort: PoolSort;
  onOriginChange: (origin: PoolOrigin) => void;
  onRadiusChange: (radiusKm: PoolRadiusKm) => void;
  onSortChange: (sort: PoolSort) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<GeocodeHit[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!editing) return;
    const q = query.trim();
    if (q.length < 2) {
      setHits([]);
      return;
    }
    const handle = window.setTimeout(() => {
      setSearching(true);
      void searchPlaces(q)
        .then((next) => setHits(next))
        .finally(() => setSearching(false));
    }, 350);
    return () => window.clearTimeout(handle);
  }, [editing, query]);

  useEffect(() => {
    if (!gps || origin?.source === 'custom') return;
    if (origin?.label && origin.label !== 'Current location') return;
    let cancelled = false;
    void reverseGeocodeLabel(gps).then((label) => {
      if (cancelled || !label) return;
      onOriginChange({
        latitude: gps.latitude,
        longitude: gps.longitude,
        label,
        source: 'gps',
      });
    });
    return () => {
      cancelled = true;
    };
    // Only reverse-geocode when GPS first arrives.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gps?.latitude, gps?.longitude]);

  const mapsHref = origin
    ? `https://www.google.com/maps/search/?api=1&query=${origin.latitude},${origin.longitude}`
    : 'https://www.google.com/maps';

  const applyGps = () => {
    if (!gps) return;
    onOriginChange({
      latitude: gps.latitude,
      longitude: gps.longitude,
      label: origin?.source === 'gps' ? origin.label : 'Current location',
      source: 'gps',
    });
    setEditing(false);
    setQuery('');
    setHits([]);
  };

  const applyHit = (hit: GeocodeHit) => {
    onOriginChange({
      latitude: hit.latitude,
      longitude: hit.longitude,
      label: hit.label,
      source: 'custom',
    });
    setEditing(false);
    setQuery('');
    setHits([]);
  };

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-2">
        <div className="col-span-2 rounded-2xl border border-border bg-card px-3 py-2.5">
          <p className="text-muted-foreground text-[10px] font-medium uppercase tracking-wide">
            Current location
          </p>
          <p className="text-foreground mt-0.5 truncate text-sm font-semibold">
            {origin?.label ?? (gps ? 'Current location' : 'Set a location')}
          </p>
          <div className="mt-1 flex items-center justify-between gap-2">
            <p className="text-muted-foreground truncate text-[11px]">
              {origin?.source === 'custom'
                ? 'Using the area you set'
                : 'Using your current location'}
            </p>
            <button
              type="button"
              className="text-primary shrink-0 text-xs font-medium"
              onClick={() => setEditing((open) => !open)}
            >
              Change
            </button>
          </div>
        </div>
        <a
          href={mapsHref}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card px-2 py-2.5 text-center"
        >
          <MapPin className="text-primary size-5" />
          <span className="text-primary mt-1 text-[11px] font-medium">View on map</span>
        </a>
      </div>

      {editing ? (
        <div className="space-y-2 rounded-2xl border border-border bg-card p-3">
          {gps ? (
            <Button type="button" variant="outline" size="sm" className="w-full" onClick={applyGps}>
              <Navigation className="size-3.5" />
              Use my current location
            </Button>
          ) : (
            <p className="text-muted-foreground text-xs">
              Allow location access, or search a suburb / postcode below.
            </p>
          )}
          <div className="relative">
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search suburb, postcode or address"
              className="h-9 pr-9"
            />
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 size-3.5 -translate-y-1/2" />
          </div>
          {searching ? (
            <p className="text-muted-foreground text-xs">Searching…</p>
          ) : null}
          {hits.length > 0 ? (
            <ul className="space-y-1">
              {hits.map((hit) => (
                <li key={`${hit.latitude},${hit.longitude},${hit.label}`}>
                  <button
                    type="button"
                    className="hover:bg-secondary w-full rounded-lg px-2 py-1.5 text-left text-xs"
                    onClick={() => applyHit(hit)}
                  >
                    {hit.label}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      <div className="flex gap-1.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {POOL_RADIUS_OPTIONS.map((km) => (
          <button
            key={km}
            type="button"
            onClick={() => onRadiusChange(km)}
            className={cn(
              'shrink-0 rounded-full border px-3 py-1 text-[11px] font-semibold',
              radiusKm === km
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-card text-muted-foreground',
            )}
          >
            {km} km
          </button>
        ))}
        <button
          type="button"
          onClick={() => onRadiusChange(null)}
          className={cn(
            'shrink-0 rounded-full border px-3 py-1 text-[11px] font-semibold',
            radiusKm == null
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-border bg-card text-muted-foreground',
          )}
        >
          Any
        </button>
        <label className="ml-auto flex shrink-0 items-center gap-1.5 text-[11px]">
          <span className="text-muted-foreground">Sort</span>
          <select
            value={sort}
            onChange={(event) => onSortChange(event.target.value as PoolSort)}
            className="border-border bg-card h-7 rounded-full border px-2 text-[11px] font-semibold"
          >
            <option value="nearest">Nearest</option>
            <option value="soonest">Soonest</option>
          </select>
        </label>
      </div>
    </div>
  );
}
