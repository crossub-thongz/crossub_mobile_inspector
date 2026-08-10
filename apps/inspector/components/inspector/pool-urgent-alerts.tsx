'use client';

import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

import { useInspectorData } from '@/components/providers/inspector-data-provider';
import { jobDetail } from '@/constants/routes';
import { formatTime } from '@/lib/utils';

const ALERTED_SESSION_KEY = 'csb_inspector_urgent_pool_alerted';
/** Cap how many urgent toasts we show from one pool update. */
const MAX_TOASTS_PER_SWEEP = 1;

function loadAlertedIds(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = sessionStorage.getItem(ALERTED_SESSION_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((id): id is string => typeof id === 'string'));
  } catch {
    return new Set();
  }
}

function persistAlertedIds(ids: Set<string>): void {
  if (typeof window === 'undefined') return;
  try {
    // Bound growth — keep the most recent alerts only.
    const trimmed = [...ids].slice(-200);
    sessionStorage.setItem(ALERTED_SESSION_KEY, JSON.stringify(trimmed));
  } catch {
    // Private mode / quota — alerts still dedupe in-memory for this mount.
  }
}

/**
 * Bottom-right alert when a pool job becomes URGENT (due time passed, still unclaimed).
 * Uses the same Sonner toaster as other inspector alerts.
 */
export function PoolUrgentAlerts() {
  const { poolJobs, receivingJobs, apiConnected, jobsHydrated } =
    useInspectorData();
  const previousPriorityRef = useRef<Map<string, 'normal' | 'urgent'>>(
    new Map(),
  );
  const alertedRef = useRef<Set<string> | null>(null);
  const hydratedRef = useRef(false);

  useEffect(() => {
    if (!receivingJobs || !apiConnected || !jobsHydrated) return;

    if (alertedRef.current == null) {
      alertedRef.current = loadAlertedIds();
    }
    const alerted = alertedRef.current;
    const previous = previousPriorityRef.current;

    // Wait until the first non-empty pool snapshot before arming — otherwise an
    // empty hydrate marks the map ready and the next full load toasts every
    // already-urgent job (hundreds of stacked "Open pool" banners).
    if (!hydratedRef.current) {
      if (poolJobs.length === 0) return;
      // Clear any leftover urgent stack from earlier sessions/builds.
      toast.dismiss();
      for (const job of poolJobs) {
        previous.set(job.id, job.priority);
        if (job.priority === 'urgent') alerted.add(job.id);
      }
      persistAlertedIds(alerted);
      hydratedRef.current = true;
      return;
    }

    const newlyUrgent: typeof poolJobs = [];
    for (const job of poolJobs) {
      const was = previous.get(job.id);
      previous.set(job.id, job.priority);
      if (job.priority !== 'urgent') continue;
      if (was === 'urgent') continue;
      if (alerted.has(job.id)) continue;
      newlyUrgent.push(job);
    }

    if (newlyUrgent.length === 0) return;

    const toShow = newlyUrgent.slice(0, MAX_TOASTS_PER_SWEEP);
    const remaining = newlyUrgent.length - toShow.length;

    for (const job of newlyUrgent) {
      alerted.add(job.id);
    }
    persistAlertedIds(alerted);

    for (const job of toShow) {
      const href = jobDetail(job.id);
      toast.error(`URGENT — ${job.type} inspection needs acceptance`, {
        id: `urgent-pool-${job.id}`,
        description: `${job.propertyAddress} · due ${formatTime(job.scheduledTime)}`,
        duration: 8_000,
        action: {
          label: 'Open job',
          onClick: () => {
            window.location.assign(href);
          },
        },
      });
    }

    if (remaining > 0) {
      toast.message(
        `${remaining} more urgent pool job${remaining === 1 ? '' : 's'} waiting`,
        {
          id: 'urgent-pool-more',
          description: 'Open the Job Pool to review them.',
          duration: 6_000,
        },
      );
    }
  }, [poolJobs, receivingJobs, apiConnected, jobsHydrated]);

  return null;
}
