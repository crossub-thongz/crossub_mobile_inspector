/** Why a job-scoped screen has no job to render. */
export type JobLookupMiss = 'loading' | 'missing';

/**
 * A `getJob` miss means two different things, and the job screens used to
 * collapse both into "Job not found".
 *
 * The provider starts with an empty job list and fills it from
 * `/inspector/inspections`, so on every hard reload of a `/jobs/:id` URL there
 * is a window where the id is real but simply hasn't arrived yet. Rendering
 * not-found there tells the inspector their job is gone while it is loading
 * perfectly well — most visible on the deep workflow URLs an inspector reaches
 * by reopening the tab mid-job.
 *
 * `jobsHydrated` (not `loading`) is the right input: the provider re-polls
 * every 5s and flips `loading` back to true each time, so gating on it would
 * blank an already-rendered screen twelve times a minute.
 */
export function jobLookupMiss(jobsHydrated: boolean): JobLookupMiss {
  return jobsHydrated ? 'missing' : 'loading';
}
