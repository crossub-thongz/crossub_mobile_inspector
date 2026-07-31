/**
 * Limits for the leasing key-collection enrichment fan-out.
 *
 * The provider re-polls every 5s. Enrichment issues one `/key-collection` request
 * per job, so an unbounded fan-out over a large list saturates the browser's
 * per-host connection pool: on staging a 113-job pool produced ~1,000 in-flight
 * requests, and unrelated fetches — completing an inspection, Next's RSC
 * prefetches — then failed with `TypeError: Failed to fetch` and surfaced as
 * "API unavailable" / "Job not found". These bound that.
 */

/** Max concurrent key-collection requests per enrichment pass. */
export const KEY_COLLECTION_FETCH_CONCURRENCY = 4;

/**
 * How long a fetched key-collection stays fresh. Key custody only changes when
 * the inspector records a phase, so re-fetching every 5s poll bought nothing and
 * cost a full fan-out each time.
 */
export const KEY_COLLECTION_CACHE_TTL_MS = 60_000;
