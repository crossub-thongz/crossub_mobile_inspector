import { parseSectionAreaName } from '@/constants/inspection-areas';
import {
  isCustomAreaName,
  resolveAreaDefinition,
  type CustomAreaDefinition,
} from '@/lib/custom-inspection-areas';
import {
  outgoingSectionsForRoom,
  type IngoingAreaPlan,
} from '@/lib/ingoing-area-plan';

export function isAreaSetupComplete(draft: {
  areaSetupComplete?: boolean;
}): boolean {
  return draft.areaSetupComplete === true;
}

export function existingAreaNamesFromPlan(
  plan: IngoingAreaPlan | null | undefined,
): string[] {
  return plan?.rooms.map((room) => room.name) ?? [];
}

/** Build a room/section plan from flat reference area rows when `areaPlan` is missing. */
export function buildAreaPlanFromReferenceAreas(
  areas: Array<{ name: string }>,
): IngoingAreaPlan | null {
  if (areas.length === 0) return null;

  const roomMap = new Map<string, Set<string>>();
  for (const area of areas) {
    const raw = area.name.replace(/\s*\(ingoing\)\s*$/i, '').trim();
    if (!raw) continue;
    const parsed = parseSectionAreaName(raw);
    if (parsed) {
      const sections = roomMap.get(parsed.area) ?? new Set<string>();
      sections.add(parsed.section);
      roomMap.set(parsed.area, sections);
      continue;
    }
    if (!roomMap.has(raw)) roomMap.set(raw, new Set());
  }

  const rooms = [...roomMap.entries()].map(([name, sections]) => ({
    name,
    sections: [...sections],
  }));
  return rooms.length > 0 ? { rooms } : null;
}

export function resolveIngoingAreaPlan(
  apiPlan: IngoingAreaPlan | null | undefined,
  referenceAreas: Array<{ name: string }>,
): IngoingAreaPlan | null {
  if (apiPlan?.rooms?.length) return apiPlan;
  return buildAreaPlanFromReferenceAreas(referenceAreas);
}

export type InspectionAreaKind = 'ingoing' | 'outgoing' | 'routine';

/** Sections shown when the user marks an area available. */
export function sectionsForAvailableArea(
  areaName: string,
  customAreas: CustomAreaDefinition[],
  ingoingAreaPlan: IngoingAreaPlan | null,
  kind: InspectionAreaKind,
): string[] {
  // Routine is overall-room photos only — Walls / Windows live on ingoing & outgoing.
  if (kind === 'routine') return [];

  if (kind !== 'ingoing') {
    const fromPlan = outgoingSectionsForRoom(ingoingAreaPlan, areaName);
    if (fromPlan.length > 0) return fromPlan;
    const copied = resolveAreaDefinition(areaName, customAreas).defaultSections;
    if (copied.length > 0) return [...copied];
    return [];
  }

  if (isCustomAreaName(areaName, customAreas)) {
    const custom = customAreas.find(
      (area) =>
        area.name.trim().toLowerCase() === areaName.trim().toLowerCase(),
    );
    if (custom?.sectionMode === 'manual' && !custom.defaultSections?.length) {
      return [];
    }
  }
  const def = resolveAreaDefinition(areaName, customAreas);
  return def.defaultSections.length > 0 ? [...def.defaultSections] : [];
}

type AreaRecordBase = {
  available: boolean | null;
  activeSections: string[];
  photosBySection: Record<string, unknown>;
};

/**
 * After the inspector confirms the room list, every selected area is available
 * with its checklist items already filled in — no per-room Yes/No prompt.
 */
export function seedAreasForInspectionStart<T extends AreaRecordBase>(
  record: Record<string, T>,
  areaNames: string[],
  options: {
    sectionsFor: (name: string) => string[];
    emptyEntry: (name: string) => T;
    emptyPhotos: () => T['photosBySection'][string];
  },
): { record: Record<string, T>; changed: boolean } {
  let changed = false;
  const next = { ...record };

  for (const name of areaNames) {
    const current = next[name] ?? options.emptyEntry(name);
    if (current.available === false) {
      if (!next[name]) {
        next[name] = current;
        changed = true;
      }
      continue;
    }

    // Once the room is available, do not refill Walls/Windows the inspector deleted.
    if (current.available === true) {
      if (!next[name]) {
        next[name] = current;
        changed = true;
      }
      continue;
    }

    const needsActivate = current.available !== true;
    const needsSections = current.activeSections.length === 0;
    if (!needsActivate && !needsSections && next[name]) continue;

    const activeSections = needsSections
      ? options.sectionsFor(name)
      : [...current.activeSections];
    const photosBySection = { ...current.photosBySection };
    for (const section of activeSections) {
      if (photosBySection[section] == null) {
        photosBySection[section] = options.emptyPhotos();
      }
    }

    next[name] = {
      ...current,
      available: true,
      activeSections,
      photosBySection,
    };
    changed = true;
  }

  return { record: next, changed };
}
