'use client';

import { useEffect, useRef } from 'react';

const LOCATION_SYNC_MS = 30_000;

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
    let watchId: number | null = null;

    const pushFix = (latitude: number, longitude: number) => {
      if (cancelled) return;
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;
      void onLocationRef.current(latitude, longitude);
    };

    const syncNow = () => {
      navigator.geolocation.getCurrentPosition(
        (pos) => pushFix(pos.coords.latitude, pos.coords.longitude),
        () => {
          // Retry once with a looser accuracy budget — silent deny still yields no fix.
          navigator.geolocation.getCurrentPosition(
            (pos) => pushFix(pos.coords.latitude, pos.coords.longitude),
            () => {},
            { enableHighAccuracy: false, maximumAge: 60_000, timeout: 15_000 },
          );
        },
        { enableHighAccuracy: true, maximumAge: 15_000, timeout: 20_000 },
      );
    };

    syncNow();
    const interval = window.setInterval(syncNow, LOCATION_SYNC_MS);

    try {
      watchId = navigator.geolocation.watchPosition(
        (pos) => pushFix(pos.coords.latitude, pos.coords.longitude),
        () => {},
        { enableHighAccuracy: true, maximumAge: 15_000, timeout: 25_000 },
      );
    } catch {
      // watchPosition unavailable — interval polling is enough.
    }

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      if (watchId != null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [enabled]);
}
