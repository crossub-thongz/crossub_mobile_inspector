export type MapApp = 'google' | 'apple' | 'waze';

export function buildMapUrl(
  app: MapApp,
  address: string,
  lat?: number,
  lng?: number,
): string {
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
