'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown, MapPin, Navigation, Search } from 'lucide-react';

import { PoolMapPreview } from '@/components/inspector/pool-map-preview';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  POOL_RADIUS_OPTIONS,
  POOL_SORT_LABEL,
  reverseGeocodeLabel,
  searchPlaces,
  type GeocodeHit,
  type PoolOrigin,
  type PoolRadiusKm,
  type PoolSort,
} from '@/lib/pool-location';
import type { GeoPoint } from '@/lib/travel';

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
  const searchRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<GeocodeHit[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
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
  }, [query]);

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
    setQuery('');
    setHits([]);
  };

  return (
    <div className="border-border bg-card overflow-hidden rounded-2xl border">
      <div className="flex items-start gap-3 p-3">
        <div className="min-w-0 flex-1">
          <p className="text-muted-foreground flex items-center gap-1 text-[11px]">
            <MapPin className="text-primary size-3.5" />
            Current location
          </p>
          <p className="text-foreground mt-0.5 truncate text-lg font-semibold leading-tight">
            {origin?.label ?? (gps ? 'Current location' : 'Set a location')}
          </p>
          <p className="text-muted-foreground mt-1 text-[11px]">
            {origin?.source === 'custom'
              ? 'Using the area you set'
              : 'Using your current location'}{' '}
            <button
              type="button"
              className="text-primary font-semibold"
              onClick={() => searchRef.current?.focus()}
            >
              Change
            </button>
          </p>
        </div>

        <label className="shrink-0 pt-0.5 text-right">
          <span className="text-muted-foreground block text-[11px]">
            Show jobs within
          </span>
          <span className="relative mt-0.5 inline-flex items-center">
            <select
              value={radiusKm == null ? 'any' : String(radiusKm)}
              onChange={(event) => {
                const value = event.target.value;
                onRadiusChange(
                  value === 'any' ? null : (Number(value) as PoolRadiusKm),
                );
              }}
              className="text-foreground appearance-none bg-transparent pr-4 text-sm font-semibold"
              aria-label="Show jobs within"
            >
              {POOL_RADIUS_OPTIONS.map((km) => (
                <option key={km} value={km}>
                  {km} km
                </option>
              ))}
              <option value="any">Any</option>
            </select>
            <ChevronDown className="text-muted-foreground pointer-events-none absolute right-0 size-3.5" />
          </span>
        </label>

        <PoolMapPreview
          latitude={origin?.latitude ?? gps?.latitude}
          longitude={origin?.longitude ?? gps?.longitude}
          mapsHref={mapsHref}
          className="h-[5.5rem] w-[7.25rem] shrink-0"
        />
      </div>

      <div className="space-y-2 px-3 pb-3">
        {gps && origin?.source === 'custom' ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-primary h-7 px-0 text-xs"
            onClick={applyGps}
          >
            <Navigation className="size-3.5" />
            Use my current location
          </Button>
        ) : null}
        <div className="relative">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            ref={searchRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search another area, suburb, postcode or address"
            className="border-border bg-secondary/60 h-11 rounded-xl pl-9"
            aria-label="Search another area"
          />
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
        <div className="flex items-center justify-end">
          <label className="flex items-center gap-1.5 text-[11px]">
            <span className="text-muted-foreground">Sort</span>
            <select
              value={sort}
              onChange={(event) => onSortChange(event.target.value as PoolSort)}
              className="border-border bg-card h-7 rounded-full border px-2 text-[11px] font-semibold"
            >
              {(Object.keys(POOL_SORT_LABEL) as PoolSort[]).map((value) => (
                <option key={value} value={value}>
                  {POOL_SORT_LABEL[value]}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
    </div>
  );
}
