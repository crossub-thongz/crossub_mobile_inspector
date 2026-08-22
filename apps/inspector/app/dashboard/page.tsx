'use client';

import {
  DashboardHubCard,
  DashboardOverviewChart,
} from '@/components/inspector/dashboard-hub-card';
import { JobReminders } from '@/components/inspector/job-reminders';
import { InspectorShell } from '@/components/layout/inspector-shell';
import { useInspectorData } from '@/components/providers/inspector-data-provider';
import {
  ROUTES,
  inspectionsAssignedByCrossub,
  inspectionsByType,
} from '@/constants/routes';
import { isStaffAssignedJob } from '@/lib/inspector-job-filters';
import { inspectorLevelAllows } from '@/lib/inspector-access-level';

export default function DashboardPage() {
  const { summary, jobs, profile } = useInspectorData();

  const crossubAssignedPending = jobs.filter(
    (j) => isStaffAssignedJob(j) && j.status !== 'completed',
  ).length;

  const showOpen = inspectorLevelAllows(profile.accessLevel, 'open');
  const showTribunal = inspectorLevelAllows(profile.accessLevel, 'tribunal');

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
          </div>

          <div className="flex min-h-[18.5rem] flex-col gap-2.5">
            <DashboardHubCard
              href={ROUTES.INSPECTIONS}
              title="Crossub Inspection"
            />
            <DashboardHubCard
              href={inspectionsAssignedByCrossub()}
              title={
                <>
                  Assigned by CROSSUB
                  {crossubAssignedPending > 0 && (
                    <span className="bg-primary/15 text-primary mx-1 inline-flex rounded-md px-1.5 py-0.5 text-xs font-bold tabular-nums">
                      {crossubAssignedPending}
                    </span>
                  )}
                </>
              }
            />
            {showOpen ? (
              <DashboardHubCard
                href={inspectionsByType('open')}
                title="Open Inspection"
              />
            ) : null}
            {showTribunal ? (
              <DashboardHubCard href={ROUTES.TRIBUNAL} title="Tribunal" />
            ) : null}
          </div>
        </div>
      </div>
    </InspectorShell>
  );
}
