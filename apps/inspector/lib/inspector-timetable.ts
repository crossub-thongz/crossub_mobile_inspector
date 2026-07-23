const SYDNEY_TZ = 'Australia/Sydney';

export type InspectorWeeklySlot = {
  dayOfWeek: number;
  enabled: boolean;
  startMinute: number;
  endMinute: number;
};

export type InspectorTimetable = {
  timezone: string;
  slots: InspectorWeeklySlot[];
  configured: boolean;
};

export const INSPECTOR_WEEKDAY_LABELS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

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
