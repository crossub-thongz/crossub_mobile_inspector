'use client';

import { useState } from 'react';
import { ClipboardCheck } from 'lucide-react';

import { EmptyState } from '@/components/inspector/empty-state';
import { JobCard } from '@/components/inspector/job-card';
import { PageIntro } from '@/components/inspector/page-intro';
import { InspectorShell } from '@/components/layout/inspector-shell';
import { useInspectorData } from '@/components/providers/inspector-data-provider';
import { cn } from '@/lib/utils';

type Tab = 'today' | 'upcoming' | 'assigned' | 'completed';

export default function JobsPage() {
  const { todaysJobs, upcomingJobs, assignedJobs, completedJobs } =
    useInspectorData();
  const [tab, setTab] = useState<Tab>('today');

  const tabs: { id: Tab; label: string; jobs: typeof todaysJobs }[] = [
    { id: 'today', label: 'Today', jobs: todaysJobs },
    { id: 'upcoming', label: 'Upcoming', jobs: upcomingJobs },
    { id: 'assigned', label: 'Assigned', jobs: assignedJobs },
    { id: 'completed', label: 'Completed', jobs: completedJobs },
  ];

  const activeJobs = tabs.find((t) => t.id === tab)?.jobs ?? [];

  return (
    <InspectorShell title="My Jobs">
      <div className="space-y-4">
        <PageIntro description="Assigned and accepted jobs. Manager assignments appear with a push notification." />

        <div className="flex gap-1 overflow-x-auto rounded-lg border bg-secondary/30 p-1">
          {tabs.map(({ id, label, jobs }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={cn(
                'shrink-0 rounded-md px-3 py-1.5 text-xs font-medium transition',
                tab === id
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {label} ({jobs.length})
            </button>
          ))}
        </div>

        {activeJobs.length === 0 ? (
          <EmptyState
            icon={ClipboardCheck}
            title="No jobs in this view"
            description="Accept jobs from the pool or wait for manager assignment."
          />
        ) : (
          <div className="space-y-3">
            {activeJobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )}
      </div>
    </InspectorShell>
  );
}
