'use client';

import Link from 'next/link';
import { ArrowLeft, ClipboardCheck, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';

import { EmptyState } from '@/components/inspector/empty-state';
import { InspectionListCard } from '@/components/inspector/inspection-list-card';
import {
  INSPECTION_LIST_TAB_ORDER,
  InspectionTypeStrip,
} from '@/components/inspector/inspection-type-strip';
import { InspectorShell } from '@/components/layout/inspector-shell';
import { Input } from '@/components/ui/input';
import { useInspectorData } from '@/components/providers/inspector-data-provider';
import { ROUTES } from '@/constants/routes';
import {
  CORE_INSPECTION_TYPES,
  type CoreInspectionType,
} from '@/constants/inspection';
import type { InspectionJob } from '@/lib/types';
import { cn } from '@/lib/utils';

type StatusFilter = 'pending' | 'completed';

function parseType(value: string | null): CoreInspectionType {
  if (
    value &&
    INSPECTION_LIST_TAB_ORDER.includes(value as CoreInspectionType)
  ) {
    return value as CoreInspectionType;
  }
  return 'outgoing';
}

function isAssignedInspection(job: InspectionJob): boolean {
  return (
    job.status !== 'available' &&
    job.status !== 'declined' &&
    CORE_INSPECTION_TYPES.includes(job.type as CoreInspectionType)
  );
}

export default function InspectionsPageClient() {
  const searchParams = useSearchParams();
  const initialType = parseType(searchParams.get('type'));
  const [type, setType] = useState<CoreInspectionType>(initialType);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending');
  const [query, setQuery] = useState('');
  const { jobs, completedJobs } = useInspectorData();

  const pendingJobs = useMemo(
    () => jobs.filter((j) => isAssignedInspection(j) && j.status !== 'completed'),
    [jobs],
  );

  const filteredJobs = useMemo(() => {
    const q = query.trim().toLowerCase();
    const bucket =
      statusFilter === 'completed' ? completedJobs : pendingJobs;

    return bucket
      .filter((j) => j.type === type)
      .filter(
        (j) =>
          !q ||
          j.propertyAddress.toLowerCase().includes(q) ||
          j.suburb.toLowerCase().includes(q),
      );
  }, [completedJobs, pendingJobs, query, statusFilter, type]);

  return (
    <InspectorShell bare>
      <div className="flex min-h-full flex-col">
        <div className="bg-background sticky top-0 z-20 -mx-4 border-b border-border px-4 pb-3">
          <div className="relative flex items-center py-2">
            <Link
              href={ROUTES.DASHBOARD}
              className="text-foreground flex size-9 items-center justify-center"
              aria-label="Back"
            >
              <ArrowLeft className="size-5" />
            </Link>
            <h1 className="text-foreground pointer-events-none absolute inset-x-0 text-center text-base font-semibold">
              Crossub Inspection
            </h1>
          </div>

          <div className="relative">
            <Input
              placeholder="Please enter keywords"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="border-border bg-card h-10 rounded-full pr-10"
            />
            <Search className="text-primary pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2" />
          </div>

          <div className="mt-3">
            <InspectionTypeStrip active={type} onChange={setType} />
          </div>
        </div>

        <div className="flex-1 space-y-3 pt-3 pb-28">
          {filteredJobs.length === 0 ? (
            <EmptyState
              icon={ClipboardCheck}
              title={
                statusFilter === 'pending'
                  ? 'No pending inspections'
                  : 'No completed inspections'
              }
              description={
                statusFilter === 'pending'
                  ? `No pending ${type} jobs. Accept work from the pool or switch type.`
                  : `No completed ${type} inspections yet.`
              }
            />
          ) : (
            filteredJobs.map((job) => (
              <InspectionListCard
                key={job.id}
                job={job}
                completed={statusFilter === 'completed'}
              />
            ))
          )}
        </div>

        <div className="border-border bg-background fixed bottom-16 left-1/2 z-40 flex w-full max-w-lg -translate-x-1/2 border-t">
          {(
            [
              { id: 'pending' as const, label: 'Pending' },
              { id: 'completed' as const, label: 'Completed' },
            ] as const
          ).map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setStatusFilter(id)}
              className={cn(
                'flex-1 py-3.5 text-sm font-semibold transition',
                statusFilter === id
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground bg-card hover:text-foreground',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </InspectorShell>
  );
}
