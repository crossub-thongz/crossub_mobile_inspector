'use client';

import { useEffect, useState } from 'react';

import type { GeoPoint } from '@/lib/travel';

const POSITION_REFRESH_MS = 30_000;

/**
 * Track the device GPS for on-screen distance/ETA. Separate from the server
 * sync hook so UI updates even when pool availability is off.
 */
export function useDevicePosition(enabled: boolean): GeoPoint | null {
  const [position, setPosition] = useState<GeoPoint | null>(null);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined' || !navigator.geolocation) {
      setPosition(null);
      return;
    }

    let cancelled = false;
    let watchId: number | null = null;

    const applyFix = (latitude: number, longitude: number) => {
      if (cancelled) return;
      setPosition({ latitude, longitude });
    };

    const onSuccess = (pos: GeolocationPosition) => {
      applyFix(pos.coords.latitude, pos.coords.longitude);
    };

    watchId = navigator.geolocation.watchPosition(onSuccess, () => undefined, {
      enableHighAccuracy: true,
      maximumAge: 30_000,
      timeout: 20_000,
    });

    navigator.geolocation.getCurrentPosition(onSuccess, () => undefined, {
      enableHighAccuracy: true,
      maximumAge: 60_000,
      timeout: 15_000,
    });

    const interval = window.setInterval(() => {
      navigator.geolocation.getCurrentPosition(onSuccess, () => undefined, {
        enableHighAccuracy: true,
        maximumAge: 30_000,
        timeout: 15_000,
      });
    }, POSITION_REFRESH_MS);

    return () => {
      cancelled = true;
      if (watchId != null) navigator.geolocation.clearWatch(watchId);
      window.clearInterval(interval);
    };
  }, [enabled]);

  return position;
}
