import type { CoreInspectionType } from '@/constants/inspection';
import { CORE_INSPECTION_TYPES } from '@/constants/inspection';

const TYPE_KEY = 'crossub-inspector-inspections-type';
const SECTION_KEY = 'crossub-inspector-inspections-section';

export type InspectionsListSection = 'all' | 'crossub';

export function readLastInspectionsType(): CoreInspectionType | null {
  if (typeof window === 'undefined') return null;
  try {
    const value = sessionStorage.getItem(TYPE_KEY);
    if (
      value &&
      CORE_INSPECTION_TYPES.includes(value as CoreInspectionType)
    ) {
      return value as CoreInspectionType;
    }
  } catch {
    // Private mode / blocked storage.
  }
  return null;
}

export function writeLastInspectionsType(type: CoreInspectionType): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(TYPE_KEY, type);
  } catch {
    // Private mode / blocked storage.
  }
}

export function readLastInspectionsSection(): InspectionsListSection {
  if (typeof window === 'undefined') return 'all';
  try {
    return sessionStorage.getItem(SECTION_KEY) === 'crossub' ? 'crossub' : 'all';
  } catch {
    return 'all';
  }
}

export function writeLastInspectionsSection(section: InspectionsListSection): void {
  if (typeof window === 'undefined') return;
  try {
    if (section === 'crossub') sessionStorage.setItem(SECTION_KEY, 'crossub');
    else sessionStorage.removeItem(SECTION_KEY);
  } catch {
    // Private mode / blocked storage.
  }
}
