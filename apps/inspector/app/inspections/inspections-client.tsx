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
  inspectionTypeHeading,
  type CoreInspectionType,
} from '@/constants/inspection';
import { isStaffAssignedJob } from '@/lib/inspector-job-filters';
import type { InspectionJob } from '@/lib/types';
import { cn } from '@/lib/utils';

type StatusFilter = 'pending' | 'completed';
type ListSection = 'all' | 'crossub';

function parseType(value: string | null): CoreInspectionType {
  if (
    value &&
    INSPECTION_LIST_TAB_ORDER.includes(value as CoreInspectionType)
  ) {
    return value as CoreInspectionType;
  }
  return 'outgoing';
}

function parseSection(value: string | null): ListSection {
  return value === 'crossub' ? 'crossub' : 'all';
}

function isAssignedInspection(job: InspectionJob): boolean {
  return (
    job.status !== 'available' &&
    job.status !== 'declined' &&
    CORE_INSPECTION_TYPES.includes(job.type as CoreInspectionType)
  );
}

function matchesQuery(job: InspectionJob, q: string): boolean {
  if (!q) return true;
  return (
    job.propertyAddress.toLowerCase().includes(q) ||
    job.suburb.toLowerCase().includes(q)
  );
}

export default function InspectionsPageClient() {
  const searchParams = useSearchParams();
  const initialType = parseType(searchParams.get('type'));
  const initialSection = parseSection(searchParams.get('section'));
  const [type, setType] = useState<CoreInspectionType>(initialType);
  const [section, setSection] = useState<ListSection>(initialSection);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending');
  const [query, setQuery] = useState('');
  const { jobs, completedJobs } = useInspectorData();

  const pendingJobs = useMemo(
    () => jobs.filter((j) => isAssignedInspection(j) && j.status !== 'completed'),
    [jobs],
  );

  const q = query.trim().toLowerCase();

  const staffAssignedJobs = useMemo(() => {
    const bucket =
      statusFilter === 'completed' ? completedJobs : pendingJobs;
    return bucket
      .filter(isStaffAssignedJob)
      .filter((j) => (section === 'crossub' ? true : j.type === type))
      .filter((j) => matchesQuery(j, q));
  }, [completedJobs, pendingJobs, q, section, statusFilter, type]);

  /**
   * CRS-0103 — “Assigned by CROSSUB” is split by kind, not one heap.
   *
   * The tab hides the type strip (there is no single type to strip by), so everything
   * the office had dispatched — a routine, two ingoings and an open — arrived as one
   * undifferentiated list of addresses. Groups follow the strip's order so both tabs
   * read the same way round; a type the strip does not carry keeps its own group at
   * the end rather than disappearing from the screen.
   */
  const staffAssignedByType = useMemo(() => {
    type JobType = InspectionJob['type'];
    const order = INSPECTION_LIST_TAB_ORDER as readonly JobType[];
    const groups = new Map<JobType, InspectionJob[]>();
    for (const job of staffAssignedJobs) {
      const bucket = groups.get(job.type);
      if (bucket) bucket.push(job);
      else groups.set(job.type, [job]);
    }
    const rank = (type: JobType) => {
      const index = order.indexOf(type);
      return index < 0 ? order.length : index;
    };
    return [...groups.entries()]
      .sort(([a], [b]) => rank(a) - rank(b))
      .map(([type, jobs]) => ({ type, jobs }));
  }, [staffAssignedJobs]);

  const typeJobs = useMemo(() => {
    if (section === 'crossub') return [];
    const bucket =
      statusFilter === 'completed' ? completedJobs : pendingJobs;
    return bucket
      .filter((j) => j.type === type)
      .filter((j) => !isStaffAssignedJob(j))
      .filter((j) => matchesQuery(j, q));
  }, [completedJobs, pendingJobs, q, section, statusFilter, type]);

  const empty =
    section === 'crossub'
      ? staffAssignedJobs.length === 0
      : staffAssignedJobs.length === 0 && typeJobs.length === 0;

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

          <div className="mt-3 flex gap-2">
            {(
              [
                { id: 'all' as const, label: 'By type' },
                { id: 'crossub' as const, label: 'Assigned by CROSSUB' },
              ] as const
            ).map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => setSection(id)}
                className={cn(
                  'rounded-full px-3 py-1.5 text-xs font-semibold transition',
                  section === id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card text-muted-foreground border-border border hover:text-foreground',
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {section === 'all' ? (
            <div className="mt-3">
              <InspectionTypeStrip active={type} onChange={setType} />
            </div>
          ) : null}
        </div>

        <div className="flex-1 space-y-3 pt-3 pb-28">
          {empty ? (
            <EmptyState
              icon={ClipboardCheck}
              title={
                section === 'crossub'
                  ? statusFilter === 'pending'
                    ? 'No CROSSUB assignments'
                    : 'No completed CROSSUB jobs'
                  : statusFilter === 'pending'
                    ? 'No pending inspections'
                    : 'No completed inspections'
              }
              description={
                section === 'crossub'
                  ? statusFilter === 'pending'
                    ? 'When the office assigns you a job, it appears here ready to start — no accept step.'
                    : 'Completed jobs assigned by CROSSUB will show here.'
                  : statusFilter === 'pending'
                    ? `No pending ${type} jobs. Accept work from the pool or switch type.`
                    : `No completed ${type} inspections yet.`
              }
            />
          ) : (
            <>
              {staffAssignedJobs.length > 0 && section === 'all' ? (
                <section className="space-y-2">
                  <h2 className="text-muted-foreground px-0.5 text-[11px] font-semibold tracking-wide uppercase">
                    Assigned by CROSSUB
                  </h2>
                  {staffAssignedJobs.map((job) => (
                    <InspectionListCard
                      key={job.id}
                      job={job}
                      completed={statusFilter === 'completed'}
                    />
                  ))}
                </section>
              ) : null}

              {section === 'crossub'
                ? staffAssignedByType.map(({ type: groupType, jobs: groupJobs }) => (
                    <section key={groupType} className="space-y-2">
                      <h2 className="text-muted-foreground flex items-center gap-2 px-0.5 text-[11px] font-semibold tracking-wide uppercase">
                        {inspectionTypeHeading(groupType)}
                        <span className="text-muted-foreground/70 tabular-nums">
                          {groupJobs.length}
                        </span>
                      </h2>
                      {groupJobs.map((job) => (
                        <InspectionListCard
                          key={job.id}
                          job={job}
                          completed={statusFilter === 'completed'}
                        />
                      ))}
                    </section>
                  ))
                : typeJobs.map((job) => (
                    <InspectionListCard
                      key={job.id}
                      job={job}
                      completed={statusFilter === 'completed'}
                    />
                  ))}
            </>
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
