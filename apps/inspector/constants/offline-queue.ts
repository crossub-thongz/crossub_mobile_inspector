/**
 * Bounds for the inspector offline action queue.
 *
 * The queue lives in `localStorage`, which is a hard ~5 MiB per origin. Nothing bounded it,
 * and `syncOfflineQueue` only ever drains items whose action is `key_workflow` — every other
 * action is pushed straight back onto the queue and kept forever. So on a working inspector's
 * device the queue only grows.
 *
 * Observed live on staging 2026-08-01: `crossub-inspector-offline-queue` reached **5,024 KB**
 * across 104 entries — 99.8% of everything the origin had stored, against ~10 KB for all other
 * keys combined. Past the quota every `setItem` throws `QuotaExceededError`, the throw escapes
 * the data provider, and the app dies with `[Inspector app] provider crash` plus React error
 * #185. The visible symptom is that "Complete Outgoing Report" does nothing at all — no toast,
 * no error, no state change — while the findings POST has already succeeded server-side. An
 * inspector standing in a property cannot finish the job and is told nothing.
 */

/** Hard cap on queued actions. Oldest are dropped first. */
export const OFFLINE_QUEUE_MAX_ITEMS = 200;

/**
 * Hard cap on the serialized queue, well under the ~5 MiB origin budget so the rest of the
 * app (job caches, auth, availability) always has room.
 */
export const OFFLINE_QUEUE_MAX_BYTES = 1_000_000;

/**
 * Last resort when even the trimmed queue will not fit: keep only this many newest items.
 * Losing the oldest queued actions is bad; bricking the app for every job is worse.
 */
export const OFFLINE_QUEUE_PANIC_KEEP = 10;
