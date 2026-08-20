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
