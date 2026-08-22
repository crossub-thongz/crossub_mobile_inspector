'use client';

import { KeyRound } from 'lucide-react';

import { InspectorShell } from '@/components/layout/inspector-shell';
import { Button } from '@/components/ui/button';
import { jobDetail, jobKeys } from '@/constants/routes';

/**
 * Shown in place of a workflow screen the inspector cannot start yet, because the
 * job's keys have not been collected.
 *
 * This is the gate. `useKeyCollectGate` also asks the router to move on, but a
 * redirect is asynchronous and can fail outright — while it is in flight the
 * workflow would otherwise render and happily accept a whole property's worth of
 * photos and notes that the API then refuses, leaving the inspector with a
 * connection banner and no work.
 *
 * Leave this screen with a full page load. Soft Next.js navigation from
 * `/jobs/:id/ingoing` (and the other workflow routes) stalls under in-flight
 * draft saves, which is why "Go to key collection" appeared to do nothing.
 */
export function KeyCollectionRequired({ jobId }: { jobId: string }) {
  return (
    <InspectorShell title="Collect the keys first" backHref={jobDetail(jobId)}>
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-4">
          <KeyRound className="text-primary mt-0.5 size-5 shrink-0" aria-hidden="true" />
          <div className="space-y-1">
            <p className="text-sm font-medium">Key collection is not recorded yet</p>
            <p className="text-muted-foreground text-sm">
              Record the keys in hand — including the proof photo — before you start
              the inspection. Anything captured before that is not saved against the
              job.
            </p>
          </div>
        </div>
        <Button
          type="button"
          className="w-full"
          onClick={() => window.location.assign(jobKeys(jobId, 'collect'))}
        >
          Go to key collection
        </Button>
      </div>
    </InspectorShell>
  );
}
