import { ESTIMATED_HOURS_BY_TYPE } from '@/constants/inspection';
import type {
  DashboardSummary,
  EarningsRecord,
  InspectionJob,
  TribunalHearing,
} from '@/lib/types';
import { isThisWeek, isToday } from '@/lib/utils';

export function buildDashboardSummary(
  jobs: InspectionJob[],
  tribunals: TribunalHearing[],
  earnings: EarningsRecord[],
  pendingSync: number,
): DashboardSummary {
  const activeJobs = jobs.filter((j) => j.status !== 'declined');
  const todaysJobs = activeJobs.filter(
    (j) =>
      isToday(j.scheduledDate) &&
      j.status !== 'completed' &&
      j.source !== 'pool',
  ).length;
  const upcomingJobs = activeJobs.filter(
    (j) =>
      !isToday(j.scheduledDate) &&
      j.status !== 'completed' &&
      j.source !== 'pool',
  ).length;
  const availableInPool = jobs.filter((j) => j.status === 'available').length;
  const completedThisWeek = jobs.filter(
    (j) => j.status === 'completed' && isThisWeek(j.scheduledDate),
  ).length;
  const weeklyEarnings = earnings
    .filter((e) => isThisWeek(e.completedAt))
    .reduce((sum, e) => sum + e.amount, 0);
  const tribunalHearings = tribunals.filter((t) => t.status === 'upcoming').length;

  return {
    todaysJobs,
    upcomingJobs,
    tribunalHearings,
    completedThisWeek,
    weeklyEarnings,
    availableInPool,
    pendingSync,
  };
}

import { calculateInspectionFee } from '@/lib/inspector-pay';

export function jobPayAmount(type: InspectionJob['type'], hours?: number): number {
  const h = hours ?? ESTIMATED_HOURS_BY_TYPE[type];
  return calculateInspectionFee(h);
}
