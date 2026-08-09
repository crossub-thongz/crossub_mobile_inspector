/**
 * Bounds and defaults for the inspector availability calendar.
 *
 * The calendar publishes one window per date (`startMinute`/`endMinute`, minutes from
 * midnight in Australia/Sydney) to `PATCH /api/v1/inspector/timetable`. The API rejects the
 * whole month with a 400 if any single entry has `endMinute <= startMinute`, so the editor
 * has to keep an invalid window out of the payload rather than let one bad day take the
 * save down with it.
 */

export const MINUTES_PER_HOUR = 60;
export const MINUTES_PER_DAY = 24 * MINUTES_PER_HOUR;
/** 23:59 — the latest a start time may be set to. */
export const LAST_MINUTE_OF_DAY = MINUTES_PER_DAY - 1;

/** Default published window for a newly marked date: 09:00–17:00. */
export const DEFAULT_AVAILABILITY_START_MINUTE = 9 * MINUTES_PER_HOUR;
export const DEFAULT_AVAILABILITY_END_MINUTE = 17 * MINUTES_PER_HOUR;

/** Shown under the time inputs, and blocks the save, while the window is inverted. */
export const INVALID_WINDOW_MESSAGE = 'End time must be after start time.';
