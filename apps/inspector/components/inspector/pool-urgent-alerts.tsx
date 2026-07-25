'use client';

import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

import { useInspectorData } from '@/components/providers/inspector-data-provider';
import { ROUTES } from '@/constants/routes';
import { formatTime } from '@/lib/utils';

/**
 * Bottom-right alert when a pool job becomes URGENT (due time passed, still unclaimed).
 * Uses the same Sonner toaster as other inspector alerts.
 */
export function PoolUrgentAlerts() {
  const { poolJobs, receivingJobs, apiConnected } = useInspectorData();
  const previousPriorityRef = useRef<Map<string, 'normal' | 'urgent'>>(new Map());
  const hydratedRef = useRef(false);

  useEffect(() => {
    if (!receivingJobs || !apiConnected) return;

    const previous = previousPriorityRef.current;

    if (!hydratedRef.current) {
      for (const job of poolJobs) {
        previous.set(job.id, job.priority);
      }
      hydratedRef.current = true;
      return;
    }

    for (const job of poolJobs) {
      const was = previous.get(job.id);
      if (job.priority === 'urgent' && was !== 'urgent') {
        toast.error(`URGENT — ${job.type} inspection needs acceptance`, {
          description: `${job.propertyAddress} · due ${formatTime(job.scheduledTime)}`,
          duration: 12_000,
          action: {
            label: 'Open pool',
            onClick: () => {
              window.location.href = ROUTES.JOB_POOL;
            },
          },
        });
      }
      previous.set(job.id, job.priority);
    }
  }, [poolJobs, receivingJobs, apiConnected]);

  return null;
}
