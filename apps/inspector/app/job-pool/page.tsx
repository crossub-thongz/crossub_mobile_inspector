'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Briefcase, ChevronRight, Route, Search } from 'lucide-react';

import { EmptyState } from '@/components/inspector/empty-state';
import {
  JobPoolTypeTags,
  type JobPoolFilter,
} from '@/components/inspector/inspection-type-tabs';
import { JobCard } from '@/components/inspector/job-card';
import { JobPoolLocationBar } from '@/components/inspector/job-pool-location-bar';
import { InspectorShell } from '@/components/layout/inspector-shell';
import { useInspectorData } from '@/components/providers/inspector-data-provider';
import { Input } from '@/components/ui/input';
import {
  CORE_INSPECTION_TYPES,
  INSPECTION_TYPE_LABEL,
  type CoreInspectionType,
} from '@/constants/inspection';
import { ROUTES } from '@/constants/routes';
import { fetchPoolInspections } from '@/lib/crossub-api/inspector-client';
import { mapPoolInspections } from '@/lib/crossub-api/inspector-mappers';
import {
  inspectorLevelAllows,
  poolTypesForInspectorLevel,
} from '@/lib/inspector-access-level';
import {
  loadPoolLocationPrefs,
  savePoolLocationPrefs,
  type PoolOrigin,
} from '@/lib/pool-location';
import { computeTravelEstimate } from '@/lib/travel';
import type { InspectionJob } from '@/lib/types';

function liveOrigin(
  saved: PoolOrigin | null,
  gps: { latitude: number; longitude: number } | null,
): PoolOrigin | null {
  if (saved?.source === 'custom') return saved;
  if (gps) {
    return {
      latitude: gps.latitude,
      longitude: gps.longitude,
      label: saved?.source === 'gps' ? saved.label : 'Current location',
      source: 'gps',
    };
  }
  return saved;
}

export default function JobPoolPage() {
  const {
    poolJobs,
    receivingJobs,
    loading,
    rosterLinked,
    poolError,
    refresh,
    profile,
    deviceLocation,
  } = useInspectorData();
  const allowedPoolTypes = useMemo(
    () => poolTypesForInspectorLevel(profile.accessLevel),
    [profile.accessLevel],
  );
  const showOpenBatch = inspectorLevelAllows(profile.accessLevel, 'open');
  const [filter, setFilter] = useState<JobPoolFilter>('all');
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [searchJobs, setSearchJobs] = useState<InspectionJob[] | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [prefs, setPrefs] = useState(loadPoolLocationPrefs);

  const origin = liveOrigin(prefs.origin, deviceLocation);

  useEffect(() => {
    savePoolLocationPrefs({ ...prefs, origin });
  }, [origin, prefs]);

  useEffect(() => {
    if (!receivingJobs) return;
    void refresh({ background: true, includePool: true });
  }, [receivingJobs, refresh]);

  useEffect(() => {
    if (filter !== 'all' && !allowedPoolTypes.includes(filter)) {
      setFilter('all');
    }
  }, [allowedPoolTypes, filter]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 300);
    return () => window.clearTimeout(handle);
  }, [query]);

  useEffect(() => {
    if (!receivingJobs) {
      setSearchJobs(null);
      setSearchError(null);
      return;
    }
    if (debouncedQuery.length < 2) {
      setSearchJobs(null);
      setSearchError(null);
      setSearchLoading(false);
      return;
    }

    let cancelled = false;
    setSearchLoading(true);
    setSearchError(null);
    void (async () => {
      try {
        const items = await fetchPoolInspections(debouncedQuery);
        if (cancelled) return;
        setSearchJobs(mapPoolInspections(items));
      } catch (err) {
        if (cancelled) return;
        setSearchJobs([]);
        setSearchError(
          err instanceof Error ? err.message : 'Could not search the job pool.',
        );
      } finally {
        if (!cancelled) setSearchLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, receivingJobs]);

  const sourceJobs = searchJobs ?? poolJobs;

  const searchedJobs = useMemo(() => {
    if (searchJobs) return searchJobs;
    const q = debouncedQuery.toLowerCase();
    if (q.length < 2) return poolJobs;
    return poolJobs.filter((j) => {
      const address = (j.propertyAddress ?? '').toLowerCase();
      const suburb = (j.suburb ?? '').toLowerCase();
      return `${address} ${suburb}`.includes(q);
    });
  }, [poolJobs, searchJobs, debouncedQuery]);

  const counts = useMemo(
    () =>
      CORE_INSPECTION_TYPES.reduce(
        (acc, type) => {
          acc[type] = searchedJobs.filter((j) => j.type === type).length;
          return acc;
        },
        {} as Record<CoreInspectionType, number>,
      ),
    [searchedJobs],
  );

  const typedJobs = useMemo(() => {
    if (filter === 'all') return searchedJobs;
    return searchedJobs.filter((j) => j.type === filter);
  }, [searchedJobs, filter]);

  const filteredJobs = useMemo(() => {
    const withDistance = typedJobs.map((job) => {
      const travel = computeTravelEstimate(
        origin,
        job.latitude != null && job.longitude != null
          ? { latitude: job.latitude, longitude: job.longitude }
          : null,
      );
      return { job, distanceKm: travel?.distanceKm ?? Number.POSITIVE_INFINITY };
    });
    const inRadius =
      prefs.radiusKm == null
        ? withDistance
        : withDistance.filter((row) => row.distanceKm <= (prefs.radiusKm ?? 0));
    inRadius.sort((a, b) => {
      if (prefs.sort === 'soonest') {
        return (
          new Date(a.job.scheduledTime).getTime() -
          new Date(b.job.scheduledTime).getTime()
        );
      }
      if (a.distanceKm !== b.distanceKm) return a.distanceKm - b.distanceKm;
      return (
        new Date(a.job.scheduledTime).getTime() -
        new Date(b.job.scheduledTime).getTime()
      );
    });
    return inRadius.map((row) => row.job);
  }, [origin, prefs.radiusKm, prefs.sort, typedJobs]);

  const totalAvailable = sourceJobs.length;
  const searchActive = debouncedQuery.length >= 2;
  const showLoading = loading || searchLoading;
  const radiusLabel =
    prefs.radiusKm == null ? 'any distance' : `${prefs.radiusKm}km`;

  return (
    <InspectorShell title="Job Pool">
      <div className="space-y-3">
        <JobPoolLocationBar
          origin={origin}
          gps={deviceLocation}
          radiusKm={prefs.radiusKm}
          sort={prefs.sort}
          onOriginChange={(next) => setPrefs((prev) => ({ ...prev, origin: next }))}
          onRadiusChange={(radiusKm) => setPrefs((prev) => ({ ...prev, radiusKm }))}
          onSortChange={(sort) => setPrefs((prev) => ({ ...prev, sort }))}
        />

        <div className="relative">
          <Input
            placeholder="Search another area, suburb, postcode or address"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="border-border bg-card h-10 rounded-full pr-10"
            aria-label="Search job pool by property"
          />
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2" />
        </div>

        {showOpenBatch ? (
        <Link
          href={ROUTES.OPEN_BATCH}
          className="border-border bg-card hover:border-primary/40 flex items-center gap-3 rounded-xl border p-3 transition-colors"
        >
          <div className="bg-secondary text-primary flex size-9 shrink-0 items-center justify-center rounded-lg">
            <Route className="size-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">Open task pool</p>
            <p className="text-muted-foreground text-[11px]">
              Saturday opens are picked as a set — select yours and the route sets the
              times.
            </p>
          </div>
          <ChevronRight className="text-muted-foreground size-4 shrink-0" />
        </Link>
        ) : null}

        <JobPoolTypeTags
          active={filter}
          onChange={setFilter}
          counts={counts}
          types={allowedPoolTypes}
        />

        {!receivingJobs ? (
          <EmptyState
            icon={Briefcase}
            title="You're on break"
            description="Tap the red bubble above the footer to start receiving open inspection jobs from the pool."
          />
        ) : !showLoading && !rosterLinked ? (
          <EmptyState
            icon={Briefcase}
            title="Roster not approved yet"
            description="Complete your registration in Profile and ask ops to approve your inspector roster. Pool jobs appear here once you're on the live roster."
          />
        ) : poolError && !searchActive ? (
          <EmptyState
            icon={Briefcase}
            title="Could not load the pool"
            description={poolError}
          />
        ) : searchError ? (
          <EmptyState
            icon={Briefcase}
            title="Could not search the pool"
            description={searchError}
          />
        ) : showLoading && totalAvailable === 0 ? (
          <EmptyState
            icon={Briefcase}
            title="Loading jobs…"
            description="Fetching the latest pool listings."
          />
        ) : totalAvailable === 0 ? (
          <EmptyState
            icon={Briefcase}
            title={searchActive ? 'No matching properties' : 'No jobs available'}
            description={
              searchActive
                ? 'Try a different street name or suburb.'
                : 'Check back later — new jobs are posted throughout the day.'
            }
          />
        ) : filteredJobs.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title={
              searchActive
                ? 'No matching properties'
                : filter === 'all'
                  ? 'No jobs in this area'
                  : `No ${INSPECTION_TYPE_LABEL[filter]} jobs`
            }
            description={
              searchActive
                ? 'Try a different street name or suburb.'
                : `Nothing within ${radiusLabel}. Widen the radius or set another location.`
            }
          />
        ) : (
          <div className="space-y-3">
            <div className="flex items-end justify-between gap-2">
              <div>
                <p className="text-sm font-semibold">
                  {filteredJobs.length} job{filteredJobs.length === 1 ? '' : 's'}{' '}
                  within {radiusLabel}
                </p>
                <p className="text-muted-foreground text-[11px]">
                  Sorted by {prefs.sort === 'soonest' ? 'Soonest' : 'Nearest'}
                </p>
              </div>
            </div>
            {filteredJobs.map((job) => (
              <JobCard key={job.id} job={job} showActions />
            ))}
          </div>
        )}
      </div>
    </InspectorShell>
  );
}
