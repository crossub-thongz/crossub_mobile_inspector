import type { InspectorRegistration } from '@/lib/types';

const LEGACY_STORAGE_KEY = 'crossub-inspector-registration';
const STORAGE_PREFIX = 'crossub-inspector-registration:';

function storageKey(email: string): string {
  return `${STORAGE_PREFIX}${email.trim().toLowerCase()}`;
}

function migrateLegacyRegistration(email: string): InspectorRegistration | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as InspectorRegistration;
    if (data.email.trim().toLowerCase() !== email.trim().toLowerCase()) {
      return null;
    }
    localStorage.setItem(storageKey(email), raw);
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    return data;
  } catch {
    return null;
  }
}

export function loadInspectorRegistration(
  email: string | null | undefined,
): InspectorRegistration | null {
  if (!email || typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(storageKey(email));
    if (raw) return JSON.parse(raw) as InspectorRegistration;
    return migrateLegacyRegistration(email);
  } catch {
    return null;
  }
}

export function saveInspectorRegistration(
  email: string,
  data: InspectorRegistration,
): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(storageKey(email), JSON.stringify(data));
}

export function isRegistrationComplete(
  data: InspectorRegistration | null,
): boolean {
  if (!data) return false;
  return (
    data.registrationStatus === 'approved' ||
    data.registrationStatus === 'pending_review'
  );
}

export function clearInspectorRegistration(email: string): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(storageKey(email));
}
