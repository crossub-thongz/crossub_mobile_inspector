'use client';

import { Briefcase } from 'lucide-react';

import { EmptyState } from '@/components/inspector/empty-state';
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

  const jobsByType = CORE_INSPECTION_TYPES.reduce(
    (acc, type) => {
      acc[type] = poolJobs.filter((j) => j.type === type);
      return acc;
    },
    {} as Record<CoreInspectionType, typeof poolJobs>,
  );

  const totalAvailable = CORE_INSPECTION_TYPES.reduce(
    (sum, type) => sum + jobsByType[type].length,
    0,
  );

  return (
    <InspectorShell title="Job Pool">
      <div className="space-y-5">
        <PageIntro description="Available inspections grouped by type. Accept jobs that fit your schedule and location." />

        {totalAvailable === 0 ? (
          <EmptyState
            icon={Briefcase}
            title="No jobs available"
            description="Check back later — new jobs are posted throughout the day."
          />
        ) : (
          CORE_INSPECTION_TYPES.map((type) => {
            const typeJobs = jobsByType[type];
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
          })
        )}
      </div>
    </InspectorShell>
  );
}
