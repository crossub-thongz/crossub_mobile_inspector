import { ESTIMATED_HOURS_BY_TYPE } from '@/constants/inspection';
import { INSPECTOR_HOURLY_RATE_AUD } from '@/constants/inspection-rates';
import { calculateJobPay } from '@/lib/inspector-pay';
import type {
  DashboardSummary,
  EarningsRecord,
  InspectionJob,
  PropertyInspectionSpec,
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

export function jobPayAmount(
  property: PropertyInspectionSpec,
  travelKmOneWay: number,
  type: InspectionJob['type'],
): number {
  return calculateJobPay(property, travelKmOneWay, type).payAmount;
}

/** @deprecated Use jobPayAmount with property spec */
export function legacyJobPayAmount(type: InspectionJob['type']): number {
  return ESTIMATED_HOURS_BY_TYPE[type] * INSPECTOR_HOURLY_RATE_AUD;
}
