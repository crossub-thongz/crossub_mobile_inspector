'use client';

import { useMemo, useState } from 'react';
import { Briefcase } from 'lucide-react';

import { EmptyState } from '@/components/inspector/empty-state';
import {
  JobPoolTypeTags,
  type JobPoolFilter,
} from '@/components/inspector/inspection-type-tabs';
import { JobCard } from '@/components/inspector/job-card';
import { PageIntro } from '@/components/inspector/page-intro';
import { InspectorShell } from '@/components/layout/inspector-shell';
import { useInspectorData } from '@/components/providers/inspector-data-provider';
import {
  CORE_INSPECTION_TYPES,
  INSPECTION_TYPE_LABEL,
  type CoreInspectionType,
} from '@/constants/inspection';

export default function JobPoolPage() {
  const { poolJobs, acceptJob, declineJob } = useInspectorData();
  const [filter, setFilter] = useState<JobPoolFilter>('all');

  const counts = useMemo(
    () =>
      CORE_INSPECTION_TYPES.reduce(
        (acc, type) => {
          acc[type] = poolJobs.filter((j) => j.type === type).length;
          return acc;
        },
        {} as Record<CoreInspectionType, number>,
      ),
    [poolJobs],
  );

  const filteredJobs = useMemo(() => {
    if (filter === 'all') return poolJobs;
    return poolJobs.filter((j) => j.type === filter);
  }, [poolJobs, filter]);

  const totalAvailable = poolJobs.length;

  return (
    <InspectorShell title="Job Pool">
      <div className="space-y-4">
        <PageIntro description="Filter available jobs by inspection type. Tap a tag to narrow the list." />

        <JobPoolTypeTags active={filter} onChange={setFilter} counts={counts} />

        {totalAvailable === 0 ? (
          <EmptyState
            icon={Briefcase}
            title="No jobs available"
            description="Check back later — new jobs are posted throughout the day."
          />
        ) : filteredJobs.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title={
              filter === 'all'
                ? 'No jobs in this filter'
                : `No ${INSPECTION_TYPE_LABEL[filter]} jobs`
            }
            description="Try another type tag or check back later."
          />
        ) : filter === 'all' ? (
          <div className="space-y-5">
            {CORE_INSPECTION_TYPES.map((type) => {
              const typeJobs = poolJobs.filter((j) => j.type === type);
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
                      <JobCard
                        key={job.id}
                        job={job}
                        showActions
                        onAccept={acceptJob}
                        onDecline={declineJob}
                      />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredJobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                showActions
                onAccept={acceptJob}
                onDecline={declineJob}
              />
            ))}
          </div>
        )}
      </div>
    </InspectorShell>
  );
}
