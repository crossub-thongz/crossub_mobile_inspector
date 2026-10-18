/**
 * The zone every property time is set and read in — matches the API's `PROPERTY_TIME_ZONE`.
 *
 * Inspector handsets are often on GMT+8, where a formatter with no explicit zone shows a 1:00pm
 * Sydney job as 10:00am. Format every scheduled instant, and work out "today", in this zone.
 */
export const PROPERTY_TIME_ZONE = 'Australia/Sydney';
