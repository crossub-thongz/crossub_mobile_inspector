export const COOKIE_ACCESS = 'csb_at';
export const COOKIE_REFRESH = 'csb_rt';

export const PASSWORD_MIN = 10;
export const PASSWORD_MAX = 128;

/**
 * Idle window before the inspector is signed out.
 *
 * This is a deliberate security control — an inspector's phone left on a bench inside someone
 * else's property must not stay signed in — so it is raised, not removed.
 *
 * It was 30 minutes, measured only from raw DOM input on the page. That is the wrong measure
 * for a field app: photographing a property means leaving the browser for the camera, and a
 * backgrounded tab produces no `mousemove`, `keydown`, `scroll` or `touchstart` at all. An
 * inspector working a large property could be signed out mid-job purely for using the camera,
 * then have to sign in again somewhere with poor reception. Returning to the app now counts as
 * activity (see the visibility/focus handling in `InactivityLogoutProvider`), and the window is
 * two hours so a normal inspection cannot outlast it.
 */
export const IDLE_LOGOUT_MS = 2 * 60 * 60 * 1000;

/**
 * Floor between activity reschedules. `mousemove` fires continuously and the provider used to
 * tear down and recreate the logout timer on every single one.
 */
export const IDLE_ACTIVITY_THROTTLE_MS = 30 * 1000;
