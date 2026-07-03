export type InspectorAvailability = 'receiving' | 'on_break';

const STORAGE_PREFIX = 'crossub-inspector-availability:';

function storageKey(email: string): string {
  return `${STORAGE_PREFIX}${email.trim().toLowerCase()}`;
}

export function loadInspectorAvailability(
  email: string | null | undefined,
): InspectorAvailability {
  if (!email || typeof window === 'undefined') return 'receiving';
  try {
    const raw = localStorage.getItem(storageKey(email));
    return raw === 'on_break' ? 'on_break' : 'receiving';
  } catch {
    return 'receiving';
  }
}

export function saveInspectorAvailability(
  email: string,
  availability: InspectorAvailability,
): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(storageKey(email.trim().toLowerCase()), availability);
}

export function isReceivingJobs(availability: InspectorAvailability): boolean {
  return availability === 'receiving';
}
