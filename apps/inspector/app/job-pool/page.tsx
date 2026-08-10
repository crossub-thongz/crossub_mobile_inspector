'use client';

import { useMemo, useState } from 'react';
import { Briefcase, Search } from 'lucide-react';

import { EmptyState } from '@/components/inspector/empty-state';
import {
  JobPoolTypeTags,
  type JobPoolFilter,
} from '@/components/inspector/inspection-type-tabs';
import { JobCard } from '@/components/inspector/job-card';
import { InspectorShell } from '@/components/layout/inspector-shell';
import { useInspectorData } from '@/components/providers/inspector-data-provider';
import { Input } from '@/components/ui/input';
import {
  CORE_INSPECTION_TYPES,
  INSPECTION_TYPE_LABEL,
  type CoreInspectionType,
} from '@/constants/inspection';

export default function JobPoolPage() {
  const { poolJobs, receivingJobs, loading, rosterLinked, poolError } =
    useInspectorData();
  const [filter, setFilter] = useState<JobPoolFilter>('all');
  const [query, setQuery] = useState('');

  const searchedJobs = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return poolJobs;
    return poolJobs.filter((j) => {
      const address = (j.propertyAddress ?? '').toLowerCase();
      const suburb = (j.suburb ?? '').toLowerCase();
      const haystack = `${address} ${suburb}`.trim();
      return haystack.includes(q);
    });
  }, [poolJobs, query]);

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

  const filteredJobs = useMemo(() => {
    if (filter === 'all') return searchedJobs;
    return searchedJobs.filter((j) => j.type === filter);
  }, [searchedJobs, filter]);

  const totalAvailable = poolJobs.length;
  const searchActive = query.trim().length > 0;

  return (
    <InspectorShell title="Job Pool">
      <div className="space-y-3">
        <div className="relative">
          <Input
            placeholder="Search address or suburb"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="border-border bg-card h-10 rounded-full pr-10"
            aria-label="Search job pool by property"
          />
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2" />
        </div>

        <JobPoolTypeTags active={filter} onChange={setFilter} counts={counts} />

        {!receivingJobs ? (
          <EmptyState
            icon={Briefcase}
            title="You're on break"
            description="Tap the red bubble above the footer to start receiving open inspection jobs from the pool."
          />
        ) : !loading && !rosterLinked ? (
          <EmptyState
            icon={Briefcase}
            title="Roster not approved yet"
            description="Complete your registration in Profile and ask ops to approve your inspector roster. Pool jobs appear here once you're on the live roster."
          />
        ) : poolError ? (
          <EmptyState
            icon={Briefcase}
            title="Could not load the pool"
            description={poolError}
          />
        ) : totalAvailable === 0 ? (
          <EmptyState
            icon={Briefcase}
            title="No jobs available"
            description="Check back later — new jobs are posted throughout the day."
          />
        ) : filteredJobs.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title={
              searchActive
                ? 'No matching properties'
                : filter === 'all'
                  ? 'No jobs in this filter'
                  : `No ${INSPECTION_TYPE_LABEL[filter]} jobs`
            }
            description={
              searchActive
                ? 'Try a different street name or suburb.'
                : 'Try another type tag or check back later.'
            }
          />
        ) : filter === 'all' ? (
          <div className="space-y-5">
            {CORE_INSPECTION_TYPES.map((type) => {
              const typeJobs = searchedJobs.filter((j) => j.type === type);
              if (typeJobs.length === 0) return null;

              return (
                <section key={type} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xs font-bold tracking-widest text-primary">
                      {INSPECTION_TYPE_LABEL[type]}
                    </h2>
                    <span className="text-muted-foreground text-[10px] tabular-nums">
                      {typeJobs.length} available
                    </span>
                  </div>
                  <div className="space-y-3">
                    {typeJobs.map((job) => (
                      <JobCard key={job.id} job={job} showActions />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredJobs.map((job) => (
              <JobCard key={job.id} job={job} showActions />
            ))}
          </div>
        )}
      </div>
    </InspectorShell>
  );
}
