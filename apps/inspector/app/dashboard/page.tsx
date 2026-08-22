'use client';

import Link from 'next/link';

import { DashboardGlanceRow } from '@/components/inspector/dashboard-glance-row';
import { DashboardInspectionRow } from '@/components/inspector/dashboard-inspection-row';
import { JobReminders } from '@/components/inspector/job-reminders';
import { InspectorShell } from '@/components/layout/inspector-shell';
import { useInspectorData } from '@/components/providers/inspector-data-provider';
import { ROUTES } from '@/constants/routes';
import { filterOverdueInspections } from '@/lib/inspector-job-filters';

export default function DashboardPage() {
  const { summary, jobs, todaysJobs } = useInspectorData();
  const overdueCount = filterOverdueInspections(jobs).length;
  const todaysList = [...todaysJobs].sort(
    (a, b) =>
      new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime(),
  );

  return (
    <InspectorShell variant="home">
      <div className="space-y-4">
        <JobReminders />

        <DashboardGlanceRow
          today={summary.todaysJobs}
          upcoming={summary.upcomingJobs}
          overdue={overdueCount}
        />

        <section className="rounded-2xl border border-border bg-card px-4 py-3">
          <div className="mb-1 flex items-center justify-between gap-2">
            <h2 className="text-foreground text-sm font-semibold">
              Today&apos;s Inspections
            </h2>
            <Link
              href={ROUTES.INSPECTIONS}
              className="text-primary text-xs font-medium"
            >
              View all
            </Link>
          </div>
          {todaysList.length === 0 ? (
            <p className="text-muted-foreground py-6 text-center text-xs">
              No inspections scheduled for today.
            </p>
          ) : (
            <div>
              {todaysList.map((job) => (
                <DashboardInspectionRow key={job.id} job={job} />
              ))}
            </div>
          )}
        </section>
      </div>
    </InspectorShell>
  );
}
