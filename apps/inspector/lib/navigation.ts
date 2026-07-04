export type MapApp = 'google' | 'apple' | 'waze';

export interface MapPoint {
  latitude?: number;
  longitude?: number;
  address?: string;
}

export function buildGoogleDirectionsUrl(
  origin: MapPoint,
  destination: MapPoint,
): string {
  const fmt = (point: MapPoint) => {
    if (point.latitude != null && point.longitude != null) {
      return `${point.latitude},${point.longitude}`;
    }
    return encodeURIComponent(point.address ?? '');
  };
  const params = new URLSearchParams({
    api: '1',
    origin: fmt(origin),
    destination: fmt(destination),
    travelmode: 'driving',
  });
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

export function buildMapUrl(
  app: MapApp,
  address: string,
  lat?: number,
  lng?: number,
  origin?: MapPoint,
): string {
  if (app === 'google' && origin) {
    return buildGoogleDirectionsUrl(origin, {
      latitude: lat,
      longitude: lng,
      address,
    });
  }

  const encoded = encodeURIComponent(address);
  const coords = lat != null && lng != null ? `${lat},${lng}` : encoded;

  switch (app) {
    case 'google':
      return `https://www.google.com/maps/dir/?api=1&destination=${coords}`;
    case 'apple':
      return `https://maps.apple.com/?daddr=${coords}`;
    case 'waze':
      return `https://waze.com/ul?q=${encoded}&navigate=yes`;
    default:
      return `https://www.google.com/maps/dir/?api=1&destination=${coords}`;
  }
}
