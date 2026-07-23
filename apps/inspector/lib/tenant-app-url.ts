/** Staging tenant portal — default when env is unset. */
export const STAGING_TENANT_APP_URL = 'https://crossub-mobile-tenant.onrender.com';

export function tenantAppBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_TENANT_APP_URL?.trim();
  if (raw && raw.length > 0) return raw.replace(/\/$/, '');
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return 'http://localhost:3003';
  }
  return STAGING_TENANT_APP_URL;
}

export function tenantAppCheckInUrl(propertyId: string, viewingSessionId: string): string {
  const base = `${tenantAppBaseUrl()}/properties/${encodeURIComponent(propertyId)}/check-in`;
  return `${base}?sessionId=${encodeURIComponent(viewingSessionId)}`;
}

export function tenantAppApplyUrl(propertyId: string, viewingSessionId: string): string {
  const base = `${tenantAppBaseUrl()}/properties/${encodeURIComponent(propertyId)}/apply`;
  return `${base}?sessionId=${encodeURIComponent(viewingSessionId)}`;
}
