'use client';

import { useCallback, useEffect, useRef } from 'react';

import { useAuth } from '@/components/providers/auth-provider';
import { IDLE_ACTIVITY_THROTTLE_MS, IDLE_LOGOUT_MS } from '@/constants/auth';
import { isPublicRoute } from '@/constants/routes';

/**
 * Raw input on the page. Necessary but not sufficient for a field app — see the
 * visibility/focus handling below, which is what covers an inspector using the camera.
 */
const ACTIVITY_EVENTS = [
  'mousedown',
  'mousemove',
  'keydown',
  'scroll',
  'touchstart',
  'click',
] as const;

export function InactivityLogoutProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { status, logout } = useAuth();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastScheduledAt = useRef(0);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const scheduleLogout = useCallback(() => {
    clearTimer();
    if (status !== 'authed') return;
    lastScheduledAt.current = Date.now();
    timerRef.current = setTimeout(() => {
      void logout();
    }, IDLE_LOGOUT_MS);
  }, [clearTimer, logout, status]);

  /**
   * `mousemove` fires continuously; rescheduling on every one tore down and recreated the
   * timer thousands of times a minute. Only reschedule once the throttle has elapsed — the
   * idle window is hours, so losing up to `IDLE_ACTIVITY_THROTTLE_MS` of precision is free.
   */
  const noteActivity = useCallback(() => {
    if (status !== 'authed') return;
    if (
      timerRef.current &&
      Date.now() - lastScheduledAt.current < IDLE_ACTIVITY_THROTTLE_MS
    ) {
      return;
    }
    scheduleLogout();
  }, [scheduleLogout, status]);

  useEffect(() => {
    if (status !== 'authed') {
      clearTimer();
      return;
    }

    const onActivity = () => noteActivity();

    // Coming back to the app IS activity. Without this an inspector who switches to the
    // camera to photograph a room generates no page events at all, and a long enough
    // shoot signed them out mid-inspection.
    const onVisible = () => {
      if (document.visibilityState === 'visible') scheduleLogout();
    };

    for (const event of ACTIVITY_EVENTS) {
      window.addEventListener(event, onActivity, { passive: true });
    }
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);
    scheduleLogout();

    return () => {
      clearTimer();
      for (const event of ACTIVITY_EVENTS) {
        window.removeEventListener(event, onActivity);
      }
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
    };
  }, [status, noteActivity, scheduleLogout, clearTimer]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (status !== 'authed') return;
    if (isPublicRoute(window.location.pathname)) return;
    scheduleLogout();
  }, [status, scheduleLogout]);

  return <>{children}</>;
}
