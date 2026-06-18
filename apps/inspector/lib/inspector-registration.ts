import type { InspectorRegistration } from '@/lib/types';

const STORAGE_KEY = 'crossub-inspector-registration';

export function loadInspectorRegistration(): InspectorRegistration | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as InspectorRegistration;
  } catch {
    return null;
  }
}

export function saveInspectorRegistration(data: InspectorRegistration): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
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

export function clearInspectorRegistration(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}
