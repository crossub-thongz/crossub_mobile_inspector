import type { InspectionJob } from '@/lib/types';
import { isToday } from '@/lib/utils';

/** Demo seed ids — removed once live inspection/pool data loads. */
export function isDemoJobId(id: string): boolean {
  return id.startsWith('job-');
}

/** Jobs on the pool board (unclaimed rows + assigned drafts awaiting accept). */
export function isPoolJob(job: InspectionJob): boolean {
  return (
    job.status === 'available' ||
    (job.source === 'assigned' && job.status === 'assigned')
  );
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
