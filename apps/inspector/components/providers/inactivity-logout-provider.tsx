'use client';

import { useCallback, useEffect, useRef } from 'react';

import { useAuth } from '@/components/providers/auth-provider';
import { isPublicRoute } from '@/constants/routes';

const IDLE_MS = 30 * 60 * 1000;

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

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const scheduleLogout = useCallback(() => {
    clearTimer();
    if (status !== 'authed') return;

    timerRef.current = setTimeout(() => {
      void logout();
    }, IDLE_MS);
  }, [clearTimer, logout, status]);

  useEffect(() => {
    if (status !== 'authed') {
      clearTimer();
      return;
    }

    const onActivity = () => scheduleLogout();

    for (const event of ACTIVITY_EVENTS) {
      window.addEventListener(event, onActivity, { passive: true });
    }
    scheduleLogout();

    return () => {
      clearTimer();
      for (const event of ACTIVITY_EVENTS) {
        window.removeEventListener(event, onActivity);
      }
    };
  }, [status, scheduleLogout, clearTimer]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (status !== 'authed') return;
    if (isPublicRoute(window.location.pathname)) return;
    scheduleLogout();
  }, [status, scheduleLogout]);

  return <>{children}</>;
}
