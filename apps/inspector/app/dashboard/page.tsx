'use client';

import Link from 'next/link';

import { CompactJobRow } from '@/components/inspector/compact-job-row';
import { JobReminders } from '@/components/inspector/job-reminders';
import { KpiTile } from '@/components/inspector/kpi-tile';
import { InspectorShell } from '@/components/layout/inspector-shell';
import { useInspectorData } from '@/components/providers/inspector-data-provider';
import { ROUTES } from '@/constants/routes';

export default function DashboardPage() {
  const { summary, todaysJobs } = useInspectorData();
  const activeToday = todaysJobs.filter(
    (j) => j.status !== 'completed' && j.status !== 'declined',
  );

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
