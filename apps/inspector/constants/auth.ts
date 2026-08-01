export const COOKIE_ACCESS = 'csb_at';
export const COOKIE_REFRESH = 'csb_rt';

export const PASSWORD_MIN = 10;
export const PASSWORD_MAX = 128;

/**
 * There is deliberately no client-side idle logout.
 *
 * There used to be a 30-minute one, measured only from raw DOM input on the page. That is the
 * wrong measure for a field app — photographing a property means leaving the browser for the
 * camera, and a backgrounded tab fires no `mousemove`, `keydown`, `scroll` or `touchstart` —
 * so it signed inspectors out mid-inspection for doing the job, and they had to sign in again
 * inside someone's home on whatever reception they had.
 *
 * Session lifetime is now bounded solely by the backend access token (`ACCESS_TTL`, 24h) and
 * its refresh. Removed on Tony's instruction, 2026-08-01. If a shorter field session is ever
 * wanted again, shorten `ACCESS_TTL` server-side rather than re-adding a timer here — the
 * server is the only place that can actually enforce it.
 */
