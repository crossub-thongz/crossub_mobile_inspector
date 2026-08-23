import type { InspectorOpenViewingVisitor } from '@/lib/inspector-open-viewing';

export type OpenInspectionCheckInSort = 'time' | 'name';

const AVATAR_TONES = [
  'bg-sky-500/20 text-sky-300',
  'bg-violet-500/20 text-violet-300',
  'bg-emerald-500/20 text-emerald-300',
  'bg-amber-500/20 text-amber-300',
  'bg-rose-500/20 text-rose-300',
  'bg-teal-500/20 text-teal-300',
] as const;

export function visitorAvatarTone(name: string): string {
  let hash = 0;
  for (const char of name) hash = (hash + char.charCodeAt(0)) % AVATAR_TONES.length;
  return AVATAR_TONES[hash] ?? AVATAR_TONES[0];
}

export function sortOpenInspectionVisitors(
  visitors: InspectorOpenViewingVisitor[],
  sort: OpenInspectionCheckInSort,
): InspectorOpenViewingVisitor[] {
  const next = [...visitors];
  next.sort((a, b) => {
    if (sort === 'name') return a.name.localeCompare(b.name);
    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return timeA - timeB;
  });
  return next;
}

/** Compact remaining time for the live timer, e.g. "12:36". */
export function formatOpenInspectionClock(endIso: string, nowMs: number): string {
  const end = new Date(endIso).getTime();
  if (Number.isNaN(end)) return '—';
  const diff = Math.max(0, end - nowMs);
  const totalSec = Math.floor(diff / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function openInspectionRemainingRatio(
  startIso: string,
  endIso: string,
  nowMs: number,
): number {
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return 0;
  return Math.min(1, Math.max(0, (end - nowMs) / (end - start)));
}
