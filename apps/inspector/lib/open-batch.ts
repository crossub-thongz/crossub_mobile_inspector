import { OPEN_BATCH_TIMEZONE } from '@/constants/open-batch';
import type {
  OpenBatchPlan,
  OpenBatchPlannedStop,
} from '@/lib/crossub-api/inspector-client';

/**
 * Formatting and small derivations for the weekly OPEN batch screen.
 *
 * Every function here pins `Australia/Sydney` explicitly. That is the whole reason the
 * file exists: the inspector handsets are often on GMT+8, and `toLocaleTimeString` with no
 * zone renders a 2:00pm Sydney open as 12:00pm — wrong by two hours, and indistinguishable
 * from a real open time on the screen. Formatting these instants ad hoc in a component is
 * how that bug gets reintroduced.
 */

/** `9:00 am` — Sydney, always. */
export function formatOpenTime(iso: string): string {
  return new Intl.DateTimeFormat('en-AU', {
    timeZone: OPEN_BATCH_TIMEZONE,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(iso));
}

/** `Sat 15 Aug` — Sydney, always. */
export function formatOpenDate(iso: string): string {
  return new Intl.DateTimeFormat('en-AU', {
    timeZone: OPEN_BATCH_TIMEZONE,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(new Date(iso));
}

/** `Wed 12 Aug, 12:00 pm` — for the cutoff lines. */
export function formatOpenDeadline(iso: string): string {
  return new Intl.DateTimeFormat('en-AU', {
    timeZone: OPEN_BATCH_TIMEZONE,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(iso));
}

/**
 * The `YYYY-MM-DDTHH:mm` string a `datetime-local` input needs, expressed in SYDNEY.
 *
 * `toISOString().slice(0, 16)` is the obvious implementation and it is wrong: it yields
 * UTC, so the edit field would open showing a time hours away from the one on the row
 * above it, and an inspector nudging it by fifteen minutes would move the open by ten
 * hours. The parts are read in Sydney and reassembled by hand for that reason.
 */
export function toSydneyInputValue(iso: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: OPEN_BATCH_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date(iso));
  const pick = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((part) => part.type === type)?.value ?? '00';
  // Some ICU builds render midnight as hour 24 under hour12:false.
  const hour = pick('hour') === '24' ? '00' : pick('hour');
  return `${pick('year')}-${pick('month')}-${pick('day')}T${hour}:${pick('minute')}`;
}

/**
 * A Sydney wall-clock `datetime-local` value back into the instant it names.
 *
 * The mirror of {@link toSydneyInputValue}, and the same trap in reverse: `new Date(value)`
 * would anchor those digits to the handset's zone, so an inspector on GMT+8 typing 2:00pm
 * would send 4:00pm Sydney and the API would accept it, because 4:00pm is a perfectly
 * legal time on that Saturday.
 *
 * Two passes, because the offset has to be measured at the instant being named rather
 * than at the same digits read as UTC.
 */
export function fromSydneyInputValue(value: string): string | null {
  const match = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
  if (!match) return null;
  const [, year, month, day, hour, minute] = match;
  const asIfUtc = Date.UTC(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
  );
  if (Number.isNaN(asIfUtc)) return null;

  const offsetAt = (instant: number): number => {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: OPEN_BATCH_TIMEZONE,
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).formatToParts(new Date(instant));
    const num = (type: Intl.DateTimeFormatPartTypes): number =>
      Number(parts.find((part) => part.type === type)?.value ?? '0');
    return (
      Date.UTC(
        num('year'),
        num('month') - 1,
        num('day'),
        num('hour') % 24,
        num('minute'),
        num('second'),
      ) - instant
    );
  };

  const corrected = offsetAt(asIfUtc - offsetAt(asIfUtc));
  return new Date(asIfUtc - corrected).toISOString();
}

/** `1 h 45 m`, or `45 m` — for travel allowances and day totals. */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} m`;
}

/** First start → last end, as a Sydney range: `9:00 am – 1:15 pm`. */
export function formatPlanWindow(plan: OpenBatchPlan): string | null {
  if (plan.stops.length === 0) return null;
  const first = plan.stops[0];
  const last = plan.stops[plan.stops.length - 1];
  return `${formatOpenTime(first.startTime)} – ${formatOpenTime(last.endTime)}`;
}

/**
 * Stops whose agent asked for a time the route could not get near.
 *
 * Surfaced so the inspector knows which agents are about to read a confirmation that
 * differs from what they asked for — the API tells them, but the person choosing whether
 * to nudge a time should see it first.
 */
export function stopsMissingAgentPreference(
  plan: OpenBatchPlan,
): OpenBatchPlannedStop[] {
  return plan.stops.filter((stop) => stop.agentPreferenceHonoured === false);
}
