const SYDNEY_TZ = 'Australia/Sydney';

export type InspectorDateAvailabilityEntry = {
  date: string;
  startMinute: number;
  endMinute: number;
};

export type InspectorCalendarAvailability = {
  timezone: string;
  from: string;
  to: string;
  entries: InspectorDateAvailabilityEntry[];
  configured: boolean;
};

export const DEFAULT_START_MINUTE = 9 * 60;
export const DEFAULT_END_MINUTE = 17 * 60;

export const WEEKDAY_HEADERS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

export function minuteToTimeInput(minute: number): string {
  const h = Math.floor(minute / 60);
  const m = minute % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function timeInputToMinute(value: string): number {
  const [h, m] = value.split(':').map((part) => Number(part));
  if (!Number.isFinite(h) || !Number.isFinite(m)) return 0;
  return Math.max(0, Math.min(23 * 60 + 59, h * 60 + m));
}

export function sydneyDateKey(date: Date): string {
  return date.toLocaleDateString('en-CA', { timeZone: SYDNEY_TZ });
}

export function sydneyTodayParts(): { year: number; month: number; day: number } {
  const key = sydneyDateKey(new Date());
  const [year, month, day] = key.split('-').map(Number);
  return { year, month, day };
}

export function monthRange(year: number, month: number): { from: string; to: string } {
  const from = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const to = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  return { from, to };
}

export function monthStartWeekday(year: number, month: number): number {
  return new Date(Date.UTC(year, month - 1, 1, 12)).getUTCDay();
}

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function formatSelectedDateLabel(dateKey: string): string {
  const date = new Date(`${dateKey}T12:00:00.000Z`);
  return date.toLocaleDateString('en-AU', {
    timeZone: SYDNEY_TZ,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

export function isPastDateKey(dateKey: string): boolean {
  return dateKey < sydneyDateKey(new Date());
}

export function entriesToMap(
  entries: InspectorDateAvailabilityEntry[],
): Map<string, InspectorDateAvailabilityEntry> {
  return new Map(entries.map((entry) => [entry.date, entry]));
}

export function mapToEntries(
  map: Map<string, InspectorDateAvailabilityEntry>,
): InspectorDateAvailabilityEntry[] {
  return [...map.values()].sort((a, b) => a.date.localeCompare(b.date));
}
