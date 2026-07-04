'use client';

import { useEffect, useRef } from 'react';

const LOCATION_SYNC_MS = 45_000;

/**
 * Periodically read the device GPS and push fixes to the inspector location API
 * while the inspector is signed in with an approved roster row.
 */
export function useInspectorLocationSync(
  enabled: boolean,
  onLocation: (latitude: number, longitude: number) => void | Promise<void>,
) {
  const onLocationRef = useRef(onLocation);
  onLocationRef.current = onLocation;

  useEffect(() => {
    if (!enabled || typeof window === 'undefined' || !navigator.geolocation) {
      return;
    }

    let cancelled = false;

    const pushFix = (latitude: number, longitude: number) => {
      if (cancelled) return;
      void onLocationRef.current(latitude, longitude);
    };

    const syncNow = () => {
      navigator.geolocation.getCurrentPosition(
        (pos) => pushFix(pos.coords.latitude, pos.coords.longitude),
        () => {},
        { enableHighAccuracy: true, maximumAge: 30_000, timeout: 20_000 },
      );
    };

    syncNow();
    const interval = window.setInterval(syncNow, LOCATION_SYNC_MS);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [enabled]);
}
