import type { GeoPoint } from '@/lib/travel';

export const POOL_RADIUS_OPTIONS = [10, 25, 50, 100] as const;
export type PoolRadiusKm = (typeof POOL_RADIUS_OPTIONS)[number] | null;
export type PoolSort = 'nearest' | 'soonest';

export type PoolOrigin = GeoPoint & {
  label: string;
  source: 'gps' | 'custom';
};

type PoolLocationPrefs = {
  origin: PoolOrigin | null;
  radiusKm: PoolRadiusKm;
  sort: PoolSort;
};

const STORAGE_KEY = 'crossub-inspector-pool-location';

const DEFAULT_PREFS: PoolLocationPrefs = {
  origin: null,
  radiusKm: 25,
  sort: 'nearest',
};

export function loadPoolLocationPrefs(): PoolLocationPrefs {
  if (typeof window === 'undefined') return DEFAULT_PREFS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PREFS;
    const parsed = JSON.parse(raw) as Partial<PoolLocationPrefs>;
    const radius =
      parsed.radiusKm === null ||
      (typeof parsed.radiusKm === 'number' &&
        (POOL_RADIUS_OPTIONS as readonly number[]).includes(parsed.radiusKm))
        ? (parsed.radiusKm as PoolRadiusKm)
        : DEFAULT_PREFS.radiusKm;
    const origin =
      parsed.origin &&
      Number.isFinite(parsed.origin.latitude) &&
      Number.isFinite(parsed.origin.longitude)
        ? parsed.origin
        : null;
    return {
      origin,
      radiusKm: radius,
      sort: parsed.sort === 'soonest' ? 'soonest' : 'nearest',
    };
  } catch {
    return DEFAULT_PREFS;
  }
}

export function savePoolLocationPrefs(prefs: PoolLocationPrefs): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}

export type GeocodeHit = GeoPoint & { label: string };

export async function searchPlaces(query: string): Promise<GeocodeHit[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const params = new URLSearchParams({
    q,
    format: 'jsonv2',
    addressdetails: '1',
    limit: '6',
    countrycodes: 'au',
  });
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?${params.toString()}`,
    { headers: { Accept: 'application/json' } },
  );
  if (!res.ok) return [];
  const rows = (await res.json()) as Array<{
    lat?: string;
    lon?: string;
    display_name?: string;
    name?: string;
    address?: {
      suburb?: string;
      city?: string;
      town?: string;
      state?: string;
      postcode?: string;
    };
  }>;
  return rows
    .map((row) => {
      const latitude = Number(row.lat);
      const longitude = Number(row.lon);
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
      const address = row.address;
      const label =
        [address?.suburb ?? address?.city ?? address?.town, address?.state, address?.postcode]
          .filter(Boolean)
          .join(' ') ||
        row.name ||
        row.display_name ||
        q;
      return { latitude, longitude, label };
    })
    .filter((hit): hit is GeocodeHit => hit != null);
}

export async function reverseGeocodeLabel(point: GeoPoint): Promise<string | null> {
  const params = new URLSearchParams({
    lat: String(point.latitude),
    lon: String(point.longitude),
    format: 'jsonv2',
    zoom: '14',
  });
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?${params.toString()}`,
    { headers: { Accept: 'application/json' } },
  );
  if (!res.ok) return null;
  const row = (await res.json()) as {
    address?: {
      suburb?: string;
      city?: string;
      town?: string;
      municipality?: string;
      state?: string;
    };
    name?: string;
  };
  const suburb =
    row.address?.suburb ??
    row.address?.town ??
    row.address?.city ??
    row.address?.municipality ??
    row.name;
  const state = row.address?.state;
  if (suburb && state) return `${suburb} ${state}`;
  return suburb ?? state ?? null;
}
