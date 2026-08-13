/**
 * Canonical CROSSUB date/time display (en-AU).
 * Keep in sync with `crossub_web/apps/web/utils/format-datetime.ts`.
 *
 * - Date:        "13 Aug 2026"
 * - Date+time:   "13 Aug 2026, 8:00 pm"
 * - Time:        "8:00 pm"
 *
 * Implemented with Intl (no date-fns) — output matches the admin helpers.
 */

function toValidDate(input: Date | string): Date | null {
  const d = typeof input === 'string' ? new Date(input) : input;
  if (!(d instanceof Date) || Number.isNaN(d.getTime())) return null;
  return d;
}

function fallbackDateLabel(input: Date | string): string {
  if (typeof input === 'string' && input.trim()) return input.trim();
  return '—';
}

/** date-fns `aaa` is lowercase; Intl may vary — normalize. */
function lowerMeridiem(value: string): string {
  return value.replace(/\b(am|pm)\b/gi, (m) => m.toLowerCase());
}

const DATE_FMT = new Intl.DateTimeFormat('en-AU', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

const TIME_FMT = new Intl.DateTimeFormat('en-AU', {
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
});

/** Calendar date. Example: "9 Jun 2026". */
export function formatDateMedium(input: Date | string): string {
  const d = toValidDate(input);
  if (!d) return fallbackDateLabel(input);
  return DATE_FMT.format(d);
}

export const formatDate = formatDateMedium;

/** Time only. Example: "3:30 pm". */
export function formatTimeShort(input: Date | string): string {
  const d = toValidDate(input);
  if (!d) return fallbackDateLabel(input);
  return lowerMeridiem(TIME_FMT.format(d));
}

export const formatTime = formatTimeShort;

/** Date with time. Example: "9 Jun 2026, 3:30 pm". */
export function formatDateTimeMedium(input: Date | string): string {
  const d = toValidDate(input);
  if (!d) return fallbackDateLabel(input);
  return `${formatDateMedium(d)}, ${formatTimeShort(d)}`;
}

export const formatDateTime = formatDateTimeMedium;

export function dayKey(input: Date | string): string {
  const d = toValidDate(input);
  if (!d) return typeof input === 'string' ? input.slice(0, 10) || 'unknown' : 'unknown';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
