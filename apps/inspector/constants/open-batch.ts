/**
 * Weekly OPEN batch — the inspector-app half of Miara's flow.
 *
 * Mirrors `apps/api/src/constants/open-inspection-batch.constants.ts`. The API is the
 * authority on every window and every rule; nothing here re-derives a decision, it only
 * names the values the screen renders and the strings it shows.
 */

/**
 * Every open time is a Sydney wall-clock time.
 *
 * The handsets are frequently on GMT+8, where a formatter with no explicit zone renders a
 * 2:00pm Sydney open as 12:00pm — two hours out, and entirely plausible-looking, which is
 * what makes it dangerous. Never format one of these instants without this zone.
 */
export const OPEN_BATCH_TIMEZONE = 'Australia/Sydney';

/** Batch lifecycle, as returned by the API. */
export const OPEN_BATCH_STATE = {
  ACCUMULATING: 'ACCUMULATING',
  SELECTING: 'SELECTING',
  PAST_DEADLINE: 'PAST_DEADLINE',
} as const;

export type OpenBatchStateValue =
  (typeof OPEN_BATCH_STATE)[keyof typeof OPEN_BATCH_STATE];

/** How a stop's place in the route was arrived at. */
export const OPEN_ROUTE_STOP_BASIS = {
  COORDINATES: 'COORDINATES',
  SUBURB: 'SUBURB',
  UNPLACED: 'UNPLACED',
} as const;

/**
 * What each basis means to the person driving.
 *
 * Shown rather than hidden because the difference is operational, not academic: a stop
 * placed by its suburb has a travel allowance that is a floor, not a measurement, and an
 * inspector who knows that will leave earlier for it.
 */
export const OPEN_ROUTE_BASIS_NOTE: Record<string, string | null> = {
  [OPEN_ROUTE_STOP_BASIS.COORDINATES]: null,
  [OPEN_ROUTE_STOP_BASIS.SUBURB]: 'Placed by suburb — travel time is an estimate',
  [OPEN_ROUTE_STOP_BASIS.UNPLACED]: 'No map position — check the drive yourself',
};

/** Banner tone per state, so the screen never hard-codes a status colour inline. */
export const OPEN_BATCH_STATE_TONE: Record<string, string> = {
  [OPEN_BATCH_STATE.ACCUMULATING]:
    'border-muted-foreground/30 bg-muted/40 text-muted-foreground',
  [OPEN_BATCH_STATE.SELECTING]: 'border-primary/40 bg-primary/10 text-primary',
  [OPEN_BATCH_STATE.PAST_DEADLINE]:
    'border-destructive/40 bg-destructive/10 text-destructive',
};

/** Empty-state copy, keyed by why the list is empty. */
export const OPEN_BATCH_EMPTY = {
  NO_PROPERTIES: {
    title: 'No properties waiting',
    description:
      'Agents add properties through the week. The list closes Wednesday at 12:00pm and ' +
      'you pick from it that afternoon.',
  },
  NOT_RECEIVING: {
    title: "You're on break",
    description:
      'Turn on receiving jobs to select opens from the pool. You can still see what is ' +
      'waiting while you are on break.',
  },
  ALL_TAKEN: {
    title: 'Every open is taken',
    description: 'Other inspectors have picked up everything in this batch.',
  },
} as const;

/**
 * The one sentence that has to appear next to a property with no confirmed time.
 *
 * A placeholder rendered as a time is a time an agent will advertise, so the screen must
 * never show one — this is what goes in its place.
 */
export const OPEN_TIME_PENDING_LABEL = 'Time set after selection';
