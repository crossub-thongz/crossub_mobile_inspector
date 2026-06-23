'use client';

import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ClipboardCheck } from 'lucide-react';

import { EmptyState } from '@/components/inspector/empty-state';
import {
  InspectionTypeIntro,
  InspectionTypeTabs,
} from '@/components/inspector/inspection-type-tabs';
import { JobCard } from '@/components/inspector/job-card';
import { InspectorShell } from '@/components/layout/inspector-shell';
import { useInspectorData } from '@/components/providers/inspector-data-provider';
import {
  CORE_INSPECTION_TYPES,
  type CoreInspectionType,
} from '@/constants/inspection';
import type { InspectionJob } from '@/lib/types';
import { cn } from '@/lib/utils';

type StatusTab = 'today' | 'upcoming' | 'completed';

function parseType(value: string | null): CoreInspectionType {
  if (value && CORE_INSPECTION_TYPES.includes(value as CoreInspectionType)) {
    return value as CoreInspectionType;
  }
  return 'open';
}

export default function InspectionsPageClient() {
  const searchParams = useSearchParams();
  const initialType = parseType(searchParams.get('type'));
  const [type, setType] = useState<CoreInspectionType>(initialType);
  const [statusTab, setStatusTab] = useState<StatusTab>('today');
  const { todaysJobs, upcomingJobs, completedJobs, jobs } = useInspectorData();

  const counts = useMemo(() => {
    const active = jobs.filter(
      (j) =>
        j.status !== 'available' &&
        j.status !== 'declined' &&
        CORE_INSPECTION_TYPES.includes(j.type as CoreInspectionType),
    );
    return CORE_INSPECTION_TYPES.reduce(
      (acc, t) => {
        acc[t] = active.filter((j) => j.type === t).length;
        return acc;
      },
      {} as Record<CoreInspectionType, number>,
    );
  }, [jobs]);

  const statusBuckets: Record<StatusTab, InspectionJob[]> = {
    today: todaysJobs,
    upcoming: upcomingJobs,
    completed: completedJobs,
  };

  const filteredJobs = statusBuckets[statusTab].filter((j) => j.type === type);

  const statusTabs: { id: StatusTab; label: string }[] = [
    { id: 'today', label: 'Today' },
    { id: 'upcoming', label: 'Upcoming' },
    { id: 'completed', label: 'Completed' },
  ];

  return (
    <InspectorShell title="Inspections">
      <div className="space-y-4">
        <InspectionTypeTabs active={type} onChange={setType} counts={counts} />
        <InspectionTypeIntro type={type} />

        <div className="flex gap-1 overflow-x-auto rounded-lg border bg-secondary/30 p-1">
          {statusTabs.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setStatusTab(id)}
              className={cn(
                'shrink-0 rounded-md px-3 py-1.5 text-xs font-medium transition',
                statusTab === id
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {filteredJobs.length === 0 ? (
          <EmptyState
            icon={ClipboardCheck}
            title={`No ${type} inspections`}
            description={`No ${statusTab} ${type} inspections. Check another type or accept jobs from the pool.`}
          />
        ) : (
          <div className="space-y-3">
            {filteredJobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )}
      </div>
    </InspectorShell>
  );
}
