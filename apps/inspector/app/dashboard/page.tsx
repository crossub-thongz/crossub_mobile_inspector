'use client';

import {
  DashboardHubCard,
  DashboardOverviewChart,
} from '@/components/inspector/dashboard-hub-card';
import { JobReminders } from '@/components/inspector/job-reminders';
import { InspectorShell } from '@/components/layout/inspector-shell';
import { useInspectorData } from '@/components/providers/inspector-data-provider';
import { ROUTES, inspectionsByType } from '@/constants/routes';
import { isKeyCollectComplete, isKeyReturnComplete } from '@/lib/key-access-workflow';

export default function DashboardPage() {
  const { summary, jobs } = useInspectorData();

  const keyPending = jobs.filter(
    (j) =>
      j.keyAccess &&
      j.status !== 'completed' &&
      (!isKeyCollectComplete(j) || !isKeyReturnComplete(j)),
  ).length;

  return (
    <InspectorShell variant="home">
      <div className="space-y-3">
        <JobReminders />

        <div className="grid grid-cols-2 gap-2.5">
          <div className="flex min-h-[18.5rem] flex-col gap-2.5">
            <DashboardHubCard href={ROUTES.INSPECTIONS} title="Overview" tall>
              <DashboardOverviewChart
                today={summary.todaysJobs}
                pool={summary.availableInPool}
                completedWeek={summary.completedThisWeek}
              />
            </DashboardHubCard>

            <DashboardHubCard
              href={ROUTES.KEY_MANAGEMENT}
              title={
                <>
                  <span className="text-primary font-semibold">KEY</span>
                  {keyPending > 0 && (
                    <span className="bg-primary/15 text-primary mx-1 inline-flex rounded-md px-1.5 py-0.5 text-xs font-bold tabular-nums">
                      {keyPending}
                    </span>
                  )}
                  Management
                </>
              }
            />
          </div>

          <div className="flex min-h-[18.5rem] flex-col gap-2.5">
            <DashboardHubCard
              href={ROUTES.INSPECTIONS}
              title="Crossub Inspection"
            />
            <DashboardHubCard
              href={inspectionsByType('open')}
              title="Open Inspection"
            />
            <DashboardHubCard href={ROUTES.TRIBUNAL} title="Tribunal" />
          </div>
        </div>
      </div>
    </InspectorShell>
  );
}
