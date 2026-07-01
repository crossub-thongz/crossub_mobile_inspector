'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { CancelTaskDialog } from '@/components/inspector/cancel-task-dialog';
import { JobSummaryCard } from '@/components/inspector/job-summary-card';
import { useInspectorData } from '@/components/providers/inspector-data-provider';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants/routes';
import type { CancelTaskMode } from '@/constants/job-cancellation';
import type { InspectionJob } from '@/lib/types';

export function JobWorkflowToolbar({ job }: { job: InspectionJob }) {
  const router = useRouter();
  const { cancelJob } = useInspectorData();
  const [cancelOpen, setCancelOpen] = useState(false);

  const handleCancel = (reason: string, mode: CancelTaskMode) => {
    cancelJob(job.id, { reason, mode });
    router.push(mode === 'release_pool' ? ROUTES.JOB_POOL : ROUTES.INSPECTIONS);
  };

  return (
    <>
      <div className="space-y-3">
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

      <CancelTaskDialog
        job={job}
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onConfirm={handleCancel}
      />
    </>
  );
}
