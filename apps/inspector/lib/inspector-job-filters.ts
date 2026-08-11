import type { InspectionJob } from '@/lib/types';
import { isToday } from '@/lib/utils';

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

/** Jobs on the pool board (unclaimed rows + assigned drafts awaiting accept). */
export function isPoolJob(job: InspectionJob): boolean {
  return (
    job.status === 'available' ||
    (job.source === 'assigned' &&
      job.status === 'assigned' &&
      job.assignedBy !== 'CROSSUB')
  );
}

/** Staff-manual assignments — no accept step; shown under “Assigned by CROSSUB”. */
export function isStaffAssignedJob(job: InspectionJob): boolean {
  return job.assignedBy === 'CROSSUB' && job.source === 'assigned';
}

/** Accepted/active inspection work scheduled for today. */
export function isTodaysInspection(job: InspectionJob): boolean {
  return (
    isToday(job.scheduledDate) &&
    job.status !== 'completed' &&
    job.status !== 'declined' &&
    job.status !== 'available' &&
    job.status !== 'assigned'
  );
}

/** Accepted/active inspection work scheduled after today. */
export function isUpcomingInspection(job: InspectionJob): boolean {
  return (
    !isToday(job.scheduledDate) &&
    new Date(job.scheduledDate) > new Date() &&
    job.status !== 'completed' &&
    job.status !== 'declined' &&
    job.status !== 'available' &&
    job.status !== 'assigned'
  );
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
