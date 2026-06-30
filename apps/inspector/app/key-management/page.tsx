'use client';

import Link from 'next/link';
import { KeyRound } from 'lucide-react';

import { InspectorShell } from '@/components/layout/inspector-shell';
import { useInspectorData } from '@/components/providers/inspector-data-provider';
import { jobKeys, ROUTES } from '@/constants/routes';
import {
  isKeyCollectComplete,
  isKeyReturnComplete,
} from '@/lib/key-access-workflow';
import { formatDate, formatTime } from '@/lib/utils';

export default function KeyManagementPage() {
  const { jobs } = useInspectorData();

  const keyJobs = jobs.filter((j) => j.keyAccess && j.status !== 'declined');

  return (
    <InspectorShell title="Key management" backHref={ROUTES.DASHBOARD}>
      {keyJobs.length === 0 ? (
        <p className="text-muted-foreground text-sm">No key tasks right now.</p>
      ) : (
        <ul className="space-y-2">
          {keyJobs.map((job) => {
            const collectDone = isKeyCollectComplete(job);
            const returnDone = isKeyReturnComplete(job);
            return (
              <li key={job.id}>
                <Link
                  href={jobKeys(job.id)}
                  className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 transition hover:border-primary/30"
                >
                  <KeyRound className="text-primary size-5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      {job.propertyAddress}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {formatDate(job.scheduledTime)} · {formatTime(job.scheduledTime)}
                    </p>
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      Collect {collectDone ? '✓' : 'pending'} · Return{' '}
                      {returnDone ? '✓' : 'pending'}
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </InspectorShell>
  );
}
