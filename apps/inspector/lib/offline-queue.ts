import {
  OFFLINE_QUEUE_MAX_BYTES,
  OFFLINE_QUEUE_MAX_ITEMS,
  OFFLINE_QUEUE_PANIC_KEEP,
} from '@/constants/offline-queue';
import type { OfflineQueueItem } from '@/lib/types';

const STORAGE_KEY = 'crossub-inspector-offline-queue';

export function loadOfflineQueue(): OfflineQueueItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as OfflineQueueItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Newest-last ordering, so trimming the front drops the oldest actions. */
function trimToBounds(items: OfflineQueueItem[]): OfflineQueueItem[] {
  let trimmed =
    items.length > OFFLINE_QUEUE_MAX_ITEMS
      ? items.slice(items.length - OFFLINE_QUEUE_MAX_ITEMS)
      : items;
  while (
    trimmed.length > 1 &&
    JSON.stringify(trimmed).length > OFFLINE_QUEUE_MAX_BYTES
  ) {
    trimmed = trimmed.slice(1);
  }
  return trimmed;
}

/**
 * Persist the queue without ever throwing.
 *
 * This used to be a bare `localStorage.setItem`. Once the queue passed the origin quota that
 * call threw `QuotaExceededError` straight out through the data provider, which crashed the
 * whole app — the inspector's "Complete Outgoing Report" button silently stopped working.
 * A queue that cannot save must degrade, not take the app down with it.
 */
export function saveOfflineQueue(items: OfflineQueueItem[]): void {
  if (typeof window === 'undefined') return;
  let candidate = trimToBounds(items);
  for (;;) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(candidate));
      return;
    } catch {
      if (candidate.length > OFFLINE_QUEUE_PANIC_KEEP) {
        candidate = candidate.slice(candidate.length - OFFLINE_QUEUE_PANIC_KEEP);
        continue;
      }
      if (candidate.length > 1) {
        candidate = candidate.slice(candidate.length - 1);
        continue;
      }
      // Even one item will not fit. Drop the key entirely rather than leave the app
      // wedged on every subsequent write.
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // Nothing further we can do, and it must not propagate.
      }
      return;
    }
  }
}

export function enqueueOfflineAction(
  jobId: string,
  action: string,
  payload: Record<string, unknown>,
): OfflineQueueItem {
  const item: OfflineQueueItem = {
    id: `oq-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    jobId,
    action,
    payload,
    createdAt: new Date().toISOString(),
  };
  const queue = loadOfflineQueue();
  queue.push(item);
  saveOfflineQueue(queue);
  return item;
}

export function clearOfflineQueue(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Never let cleanup throw into a render path.
  }
}
