'use client';

import Link from 'next/link';
import { KeyRound, Search } from 'lucide-react';

import { CompactJobRow } from '@/components/inspector/compact-job-row';
import { JobReminders } from '@/components/inspector/job-reminders';
import { KpiTile } from '@/components/inspector/kpi-tile';
import { InspectorShell } from '@/components/layout/inspector-shell';
import { useInspectorData } from '@/components/providers/inspector-data-provider';
import { ROUTES, inspectionsByType } from '@/constants/routes';
import { isKeyCollectComplete, isKeyReturnComplete } from '@/lib/key-access-workflow';

export default function DashboardPage() {
  const { summary, todaysJobs, jobs } = useInspectorData();
  const activeToday = todaysJobs.filter(
    (j) => j.status !== 'completed' && j.status !== 'declined',
  );

  const keyPending = jobs.filter(
    (j) =>
      j.keyAccess &&
      j.status !== 'completed' &&
      (!isKeyCollectComplete(j) || !isKeyReturnComplete(j)),
  ).length;

  return (
    <InspectorShell title="Dashboard">
      <div className="space-y-3">
        <JobReminders />

        <div className="grid grid-cols-2 gap-1.5">
          <KpiTile
            label="Today"
            value={summary.todaysJobs}
            href={ROUTES.INSPECTIONS}
            highlight={summary.todaysJobs > 0}
          />
          <KpiTile
            label="Upcoming"
            value={summary.upcomingJobs}
            href={ROUTES.INSPECTIONS}
          />
          <KpiTile
            label="Pool"
            value={summary.availableInPool}
            href={ROUTES.JOB_POOL}
            highlight={summary.availableInPool > 0}
          />
          <KpiTile
            label="Done (wk)"
            value={summary.completedThisWeek}
            href={ROUTES.INSPECTIONS}
          />
        </div>

        <div className="flex gap-2">
          <Link
            href={inspectionsByType('open')}
            className="flex flex-1 items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium transition hover:border-primary/40"
          >
            <Search className="text-primary size-4 shrink-0" />
            Open inspections
          </Link>
          <Link
            href={ROUTES.KEY_MANAGEMENT}
            className="relative flex flex-1 items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium transition hover:border-primary/40"
          >
            <KeyRound className="text-primary size-4 shrink-0" />
            Keys
            {keyPending > 0 && (
              <span className="bg-primary text-primary-foreground ml-auto flex size-5 items-center justify-center rounded-full text-[10px] font-bold">
                {keyPending}
              </span>
            )}
          </Link>
        </div>

        <section className="space-y-1.5">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold">Today&apos;s inspections</h2>
            <Link href={ROUTES.INSPECTIONS} className="text-primary text-[10px] font-medium">
              All
            </Link>
          </div>
          {activeToday.length === 0 ? (
            <p className="text-muted-foreground rounded-lg border border-dashed px-3 py-4 text-center text-xs">
              No inspections today.
            </p>
          ) : (
            activeToday.map((job) => <CompactJobRow key={job.id} job={job} />)
          )}
        </section>
      </div>
    </InspectorShell>
  );
}
