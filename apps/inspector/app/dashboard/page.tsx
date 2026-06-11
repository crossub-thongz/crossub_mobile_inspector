'use client';

import Link from 'next/link';
import { ChevronRight, Scale } from 'lucide-react';

import { JobCard } from '@/components/inspector/job-card';
import { KpiTile } from '@/components/inspector/kpi-tile';
import { PageIntro } from '@/components/inspector/page-intro';
import { InspectorShell } from '@/components/layout/inspector-shell';
import { useInspectorData } from '@/components/providers/inspector-data-provider';
import { ROUTES } from '@/constants/routes';
import { formatDateTime } from '@/lib/utils';

export default function DashboardPage() {
  const { summary, todaysJobs, tribunals } = useInspectorData();
  const upcomingTribunal = tribunals.find((t) => t.status === 'upcoming');

  return (
    <InspectorShell title="Dashboard">
      <div className="space-y-5">
        <PageIntro description="Your field operations hub — accept jobs, navigate, inspect, and complete reports from one platform." />

        <section className="overflow-hidden rounded-2xl border border-border/80 bg-card">
          <div className="border-b border-border/80 px-4 py-3.5">
            <h2 className="text-sm font-semibold">Today&apos;s Overview</h2>
          </div>
          <div className="grid grid-cols-2 gap-2 p-3">
            <KpiTile
              label="Today's Jobs"
              value={summary.todaysJobs}
              href={ROUTES.JOBS}
              highlight={summary.todaysJobs > 0}
            />
            <KpiTile
              label="Upcoming Jobs"
              value={summary.upcomingJobs}
              href={ROUTES.JOBS}
            />
            <KpiTile
              label="Tribunal Hearings"
              value={summary.tribunalHearings}
              href={ROUTES.TRIBUNAL}
              highlight={summary.tribunalHearings > 0}
            />
            <KpiTile
              label="Completed This Week"
              value={summary.completedThisWeek}
              href={ROUTES.JOBS}
            />
            <KpiTile
              label="Weekly Earnings"
              value={summary.weeklyEarnings}
              href={ROUTES.EARNINGS}
              isCurrency
            />
            <KpiTile
              label="Jobs in Pool"
              value={summary.availableInPool}
              href={ROUTES.JOB_POOL}
              highlight={summary.availableInPool > 0}
            />
          </div>
        </section>

        {upcomingTribunal && (
          <Link
            href={`/tribunal/${upcomingTribunal.id}`}
            className="flex items-center gap-3 rounded-2xl border border-rose-500/30 bg-gradient-to-r from-rose-500/10 to-rose-500/5 p-4 transition hover:border-rose-500/50"
          >
            <div className="flex size-11 items-center justify-center rounded-xl bg-rose-500/15 text-rose-400">
              <Scale className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{upcomingTribunal.tribunalType}</p>
              <p className="text-muted-foreground text-xs">
                {formatDateTime(upcomingTribunal.hearingTime)} — {upcomingTribunal.location}
              </p>
            </div>
            <ChevronRight className="text-rose-400 size-5 shrink-0" />
          </Link>
        )}

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Today&apos;s Jobs</h2>
            <Link href={ROUTES.JOBS} className="text-primary text-xs font-medium">
              View all
            </Link>
          </div>
          {todaysJobs.length === 0 ? (
            <p className="text-muted-foreground rounded-xl border border-dashed p-6 text-center text-sm">
              No jobs scheduled for today.
            </p>
          ) : (
            todaysJobs.map((job) => <JobCard key={job.id} job={job} />)
          )}
        </section>
      </div>
    </InspectorShell>
  );
}
