'use client';

import { Loader2 } from 'lucide-react';

import { InspectorShell } from '@/components/layout/inspector-shell';
import type { JobLookupMiss } from '@/lib/job-lookup';

/**
 * The screen a job route shows when `getJob(id)` returns nothing — a spinner
 * while the job list is still loading, the not-found message only once it has.
 */
export function JobLookupFallback({
  state,
  backHref,
  missingTitle = 'Job not found',
  missingMessage = 'This job could not be found.',
}: {
  state: JobLookupMiss;
  backHref: string;
  missingTitle?: string;
  missingMessage?: string;
}) {
  if (state === 'loading') {
    return (
      <InspectorShell title="Loading job" backHref={backHref}>
        <div className="text-muted-foreground flex items-center gap-2 text-sm">
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          Loading this job…
        </div>
      </InspectorShell>
    );
  }

  return (
    <InspectorShell title={missingTitle} backHref={backHref}>
      <p className="text-muted-foreground text-sm">{missingMessage}</p>
    </InspectorShell>
  );
}
