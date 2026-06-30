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

function findRegistrationByEmail(email: string): InspectorRegistration | null {
  const normalized = email.trim().toLowerCase();
  try {
    const raw = localStorage.getItem(storageKey(normalized));
    if (raw) return JSON.parse(raw) as InspectorRegistration;
  } catch {
    /* fall through */
  }

  // Recover profiles saved before the signed-in email was available on the form.
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key?.startsWith(STORAGE_PREFIX)) continue;
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const data = JSON.parse(raw) as InspectorRegistration;
      if (data.email?.trim().toLowerCase() === normalized) {
        saveInspectorRegistration(normalized, data);
        if (key !== storageKey(normalized)) {
          localStorage.removeItem(key);
        }
        return data;
      }
    } catch {
      /* ignore malformed entries */
    }
  }

  return migrateLegacyRegistration(normalized);
}

export function loadInspectorRegistration(
  email: string | null | undefined,
): InspectorRegistration | null {
  if (!email || typeof window === 'undefined') return null;
  try {
    return findRegistrationByEmail(email);
  } catch {
    return null;
  }
}

export function saveInspectorRegistration(
  email: string,
  data: InspectorRegistration,
): void {
  if (typeof window === 'undefined') return;
  const normalized = email.trim().toLowerCase();
  localStorage.setItem(
    storageKey(normalized),
    JSON.stringify({ ...data, email: normalized }),
  );
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
