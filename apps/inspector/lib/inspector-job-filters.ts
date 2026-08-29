import type { InspectionJob } from '@/lib/types';
import { isToday } from '@/lib/utils';

function jobScheduleIso(job: InspectionJob): string {
  return job.scheduledTime || job.scheduledDate;
}

function startOfLocalDay(from = new Date()): Date {
  const day = new Date(from);
  day.setHours(0, 0, 0, 0);
  return day;
}

/** Assigned work the inspector still has to do — not pool, not finished, not declined. */
function isActiveInspectJob(job: InspectionJob): boolean {
  return (
    job.status !== 'completed' &&
    job.status !== 'declined' &&
    !isPoolJob(job)
  );
}

/** Demo seed ids — removed once live inspection/pool data loads. */
export function isDemoJobId(id: string): boolean {
  return id.startsWith('job-');
}

/** Live facade inspection ids are UUIDs; demo / offline stubs are not. */
export function isApiInspectionId(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    id,
  );
}

/**
 * Jobs on the public Job Pool (unclaimed rows + non-staff drafts awaiting accept).
 *
 * Office dispatch stamps `assignedBy: CROSSUB` and must never reappear as Accept Job,
 * even if a pool payload still marks the row `available`.
 */
export function isPoolJob(job: InspectionJob): boolean {
  if (job.assignedBy === 'CROSSUB') return false;
  // We-inspect ROUTINE is only claimable from the public pool API (`source: pool`).
  if (job.type === 'routine' && job.source !== 'pool') return false;
  if (job.status === 'available') return true;
  // Named on the row but not yet accepted — only types that use Accept Job this way.
  // We-inspect ROUTINE is always `source: pool`. Ward rounds map to `routine` in the
  // UI but are assigned work, not public pool rows.
  if (job.source === 'assigned' && job.status === 'assigned') {
    return (
      job.type === 'open' ||
      job.type === 'ingoing' ||
      job.type === 'outgoing'
    );
  }
  return false;
}

/** Staff-manual assignments — no accept step; shown under “Assigned by CROSSUB”. */
export function isStaffAssignedJob(job: InspectionJob): boolean {
  return job.assignedBy === 'CROSSUB' && job.source === 'assigned';
}

/** Accepted/active inspection work scheduled for today (Inspect → Today). */
export function isTodaysInspection(job: InspectionJob): boolean {
  return isActiveInspectJob(job) && isToday(jobScheduleIso(job));
}

/** Accepted/active inspection work scheduled on a later calendar day. */
export function isUpcomingInspection(job: InspectionJob): boolean {
  if (!isActiveInspectJob(job)) return false;
  const scheduled = new Date(jobScheduleIso(job));
  if (Number.isNaN(scheduled.getTime())) return false;
  const day = new Date(scheduled);
  day.setHours(0, 0, 0, 0);
  return day.getTime() > startOfLocalDay().getTime();
}

/**
 * Assigned work whose scheduled day has already passed and is not finished.
 *
 * `awaiting_approval` is omitted: the inspector has already submitted, so it is
 * not a job they still owe on the Overdue list.
 */
export function isOverdueInspection(job: InspectionJob): boolean {
  if (!isActiveInspectJob(job) || job.status === 'awaiting_approval') {
    return false;
  }
  const scheduled = new Date(jobScheduleIso(job));
  if (Number.isNaN(scheduled.getTime())) return false;
  return scheduled < startOfLocalDay();
}

export function filterPoolJobs(jobs: InspectionJob[]): InspectionJob[] {
  return jobs.filter(isPoolJob);
}

export function filterTodaysInspections(jobs: InspectionJob[]): InspectionJob[] {
  return jobs.filter(isTodaysInspection);
}

export function filterUpcomingInspections(jobs: InspectionJob[]): InspectionJob[] {
  return jobs.filter(isUpcomingInspection);
}

export function filterOverdueInspections(jobs: InspectionJob[]): InspectionJob[] {
  return jobs.filter(isOverdueInspection);
}
