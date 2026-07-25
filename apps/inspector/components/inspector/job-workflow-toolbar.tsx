'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown } from 'lucide-react';

import { CancelTaskDialog } from '@/components/inspector/cancel-task-dialog';
import { JobSummaryCard } from '@/components/inspector/job-summary-card';
import { useInspectorData } from '@/components/providers/inspector-data-provider';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants/routes';
import type { CancelTaskMode } from '@/constants/job-cancellation';
import { formatJobRefId } from '@/lib/job-cancellation';
import type { InspectionJob } from '@/lib/types';
import { cn } from '@/lib/utils';

export function JobWorkflowToolbar({ job }: { job: InspectionJob }) {
  const router = useRouter();
  const { cancelJob } = useInspectorData();
  const [open, setOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  const handleCancel = (reason: string, mode: CancelTaskMode) => {
    cancelJob(job.id, { reason, mode });
    router.push(mode === 'release_pool' ? ROUTES.JOB_POOL : ROUTES.INSPECTIONS);
  };

  return (
    <>
      <div className="border-border bg-card overflow-hidden rounded-2xl border">
        <button
          type="button"
          className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          <div className="min-w-0">
            <p className="text-sm font-medium">Job details</p>
            <p className="text-muted-foreground truncate text-xs">
              {job.type} · {formatJobRefId(job.id)}
            </p>
          </div>
          <ChevronDown
            className={cn(
              'text-muted-foreground size-4 shrink-0 transition-transform',
              open && 'rotate-180',
            )}
          />
        </button>

        {open ? (
          <div className="border-border space-y-3 border-t px-4 pb-4 pt-3">
            <JobSummaryCard job={job} showPayout={false} />
            <Button
              type="button"
              variant="outline"
              className="border-destructive/40 text-destructive hover:bg-destructive/10 w-full"
              onClick={() => setCancelOpen(true)}
            >
              Cancel task
            </Button>
          </div>
        ) : null}
      </div>

      <CancelTaskDialog
        job={job}
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onConfirm={handleCancel}
      />
    </>
  );
}
