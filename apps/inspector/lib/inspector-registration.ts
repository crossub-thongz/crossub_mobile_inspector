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

/** Whether onboarding is done — server roster or a submitted registration application. */
export function isInspectorOnboardingComplete(options: {
  registration: InspectorRegistration | null;
  hasRoster: boolean;
  serverRegistrationStatus?: string | null;
  /** True once we've attempted to load the server profile for this session. */
  serverChecked?: boolean;
  serverHasRegistration?: boolean;
}): boolean {
  if (options.hasRoster) return true;
  if (
    options.serverRegistrationStatus === 'approved' ||
    options.serverRegistrationStatus === 'pending_review'
  ) {
    return true;
  }
  // A failed local-only save can leave pending_review in localStorage while the
  // server never received the application — let the user resubmit.
  if (
    options.serverChecked &&
    !options.serverHasRegistration &&
    !options.hasRoster
  ) {
    return false;
  }
  return isRegistrationComplete(options.registration);
}

export function clearInspectorRegistration(email: string): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(storageKey(email));
}

/** Office-created roster fields, used when the server has no registration application. */
export function registrationFromRosterProfile(profile: {
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  roster?: {
    licenceNumber?: string | null;
    licenceType?: string | null;
    licenceExpiry?: string | Date | null;
    serviceRegions?: string[];
    tribunalQualified?: boolean;
  } | null;
}): InspectorRegistration | null {
  if (!profile.roster) return null;
  const expiry = profile.roster.licenceExpiry;
  return {
    firstName: profile.firstName ?? '',
    lastName: profile.lastName ?? '',
    email: profile.email,
    mobile: profile.phone ?? '',
    dateOfBirth: '',
    residentialAddress: '',
    licenceNumber: profile.roster.licenceNumber ?? undefined,
    licenceType: profile.roster.licenceType ?? '',
    licenceExpiry:
      typeof expiry === 'string'
        ? expiry.slice(0, 10)
        : expiry
          ? expiry.toISOString().slice(0, 10)
          : undefined,
    serviceRegions: profile.roster.serviceRegions ?? [],
    tribunalQualified: profile.roster.tribunalQualified,
    bankAccountName: '',
    bankBsb: '',
    bankAccountNumber: '',
    registrationStatus: 'approved',
  };
}
