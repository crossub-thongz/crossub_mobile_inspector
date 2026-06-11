import type { OfflineQueueItem } from '@/lib/types';

const STORAGE_KEY = 'crossub-inspector-offline-queue';

export function loadOfflineQueue(): OfflineQueueItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as OfflineQueueItem[];
  } catch {
    return [];
  }
}

export function saveOfflineQueue(items: OfflineQueueItem[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
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
  localStorage.removeItem(STORAGE_KEY);
}
