'use client';

import Link from 'next/link';
import { ChevronRight, Scale } from 'lucide-react';
import { useMemo } from 'react';

import { JobCard } from '@/components/inspector/job-card';
import { KpiTile } from '@/components/inspector/kpi-tile';
import { PageIntro } from '@/components/inspector/page-intro';
import { InspectorShell } from '@/components/layout/inspector-shell';
import { useInspectorData } from '@/components/providers/inspector-data-provider';
import {
  CORE_INSPECTION_TYPES,
  INSPECTION_TYPE_LABEL,
  type CoreInspectionType,
} from '@/constants/inspection';
import { ROUTES, inspectionsByType } from '@/constants/routes';
import { formatDateTime } from '@/lib/utils';

export default function DashboardPage() {
  const { summary, todaysJobs, tribunals } = useInspectorData();
  const upcomingTribunal = tribunals.find((t) => t.status === 'upcoming');

  const todayByType = useMemo(
    () =>
      CORE_INSPECTION_TYPES.reduce(
        (acc, type) => {
          acc[type] = todaysJobs.filter((j) => j.type === type).length;
          return acc;
        },
        {} as Record<CoreInspectionType, number>,
      ),
    [todaysJobs],
  );

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
              href={ROUTES.INSPECTIONS}
              highlight={summary.todaysJobs > 0}
            />
            <KpiTile
              label="Upcoming Jobs"
              value={summary.upcomingJobs}
              href={ROUTES.INSPECTIONS}
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
              href={ROUTES.INSPECTIONS}
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

        <section className="overflow-hidden rounded-2xl border border-border/80 bg-card">
          <div className="border-b border-border/80 px-4 py-3.5">
            <h2 className="text-sm font-semibold">Inspections by Type</h2>
          </div>
          <div className="grid grid-cols-2 gap-2 p-3">
            {CORE_INSPECTION_TYPES.map((type) => (
              <KpiTile
                key={type}
                label={INSPECTION_TYPE_LABEL[type]}
                value={todayByType[type]}
                href={inspectionsByType(type)}
                highlight={todayByType[type] > 0}
              />
            ))}
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

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Today&apos;s Inspections</h2>
            <Link href={ROUTES.INSPECTIONS} className="text-primary text-xs font-medium">
              View all
            </Link>
          </div>
          {todaysJobs.length === 0 ? (
            <p className="text-muted-foreground rounded-xl border border-dashed p-6 text-center text-sm">
              No inspections scheduled for today.
            </p>
          ) : (
            CORE_INSPECTION_TYPES.map((type) => {
              const typeJobs = todaysJobs.filter((j) => j.type === type);
              if (typeJobs.length === 0) return null;
              return (
                <div key={type} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold tracking-widest text-primary">
                      {INSPECTION_TYPE_LABEL[type]}
                    </h3>
                    <Link
                      href={inspectionsByType(type)}
                      className="text-muted-foreground text-[10px] hover:text-primary"
                    >
                      See all
                    </Link>
                  </div>
                  {typeJobs.map((job) => (
                    <JobCard key={job.id} job={job} />
                  ))}
                </div>
              );
            })
          )}
        </section>
      </div>
    </InspectorShell>
  );
}
