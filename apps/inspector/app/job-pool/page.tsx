'use client';

import { Briefcase } from 'lucide-react';

import { EmptyState } from '@/components/inspector/empty-state';
import { JobCard } from '@/components/inspector/job-card';
import { PageIntro } from '@/components/inspector/page-intro';
import { InspectorShell } from '@/components/layout/inspector-shell';
import { useInspectorData } from '@/components/providers/inspector-data-provider';

export default function JobPoolPage() {
  const { poolJobs, acceptJob, declineJob, profile } = useInspectorData();

  return (
    <InspectorShell title="Job Pool">
      <div className="space-y-4">
        <PageIntro description="Browse available inspections. Accept jobs that fit your schedule and location. Tribunal jobs require qualification." />

        {poolJobs.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title="No jobs available"
            description="Check back later — new jobs are posted throughout the day."
          />
        ) : (
          <div className="space-y-3">
            {poolJobs.map((job) => {
              if (job.type === 'tribunal' && !profile.tribunalQualified) {
                return null;
              }
              return (
                <JobCard
                  key={job.id}
                  job={job}
                  showActions
                  onAccept={acceptJob}
                  onDecline={declineJob}
                />
              );
            })}
          </div>
        )}
      </div>
    </InspectorShell>
  );
}
