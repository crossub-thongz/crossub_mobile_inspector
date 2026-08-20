import { INSPECTION_AREA_CATALOG } from '@/constants/inspection-areas';
import type { CustomAreaDefinition } from '@/lib/custom-inspection-areas';
import type { IngoingAreaPlan } from '@/lib/ingoing-area-plan';
import type { PropertyInspectionSpec } from '@/lib/types';

export type InspectionLayout = {
  names: string[];
  customAreas: CustomAreaDefinition[];
};

function numberedRooms(baseName: string, count: number): string[] {
  const n = Math.max(0, Math.floor(count));
  if (n <= 0) return [];
  if (n === 1) return [baseName];
  return [baseName, ...Array.from({ length: n - 1 }, (_, i) => `${baseName} ${i + 2}`)];
}

export function customAreasForRoomNames(
  names: string[],
): CustomAreaDefinition[] {
  const catalog = new Set(
    INSPECTION_AREA_CATALOG.map((area) => area.name.toLowerCase()),
  );
  const seen = new Set<string>();
  const custom: CustomAreaDefinition[] = [];
  for (const name of names) {
    const trimmed = name.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (catalog.has(key) || seen.has(key)) continue;
    seen.add(key);
    custom.push({ name: trimmed, sectionMode: 'standard' });
  }
  return custom;
}

export function mergeCustomAreas(
  existing: CustomAreaDefinition[] = [],
  extras: CustomAreaDefinition[] = [],
): CustomAreaDefinition[] {
  const next = [...existing];
  const indexByKey = new Map(
    next.map((area, index) => [area.name.trim().toLowerCase(), index] as const),
  );
  for (const extra of extras) {
    const key = extra.name.trim().toLowerCase();
    if (!key) continue;
    const index = indexByKey.get(key);
    if (index == null) {
      indexByKey.set(key, next.length);
      next.push(extra);
      continue;
    }
    if (extra.defaultSections?.length || extra.optionalSections?.length) {
      next[index] = {
        ...next[index],
        ...extra,
        name: extra.name.trim() || next[index].name,
      };
    }
  }
  return next;
}

/**
 * Default room layout for an ingoing — same idea as Inspection Express templates:
 * rooms are ready before the inspector reaches the property.
 */
export function layoutTemplateFromProperty(
  spec: PropertyInspectionSpec,
): InspectionLayout {
  const names: string[] = ['Entry'];

  if (spec.propertyKind === 'house') {
    names.push(...numberedRooms('Living Room', spec.livingAreas || 1));
    names.push(...numberedRooms('Kitchen', spec.kitchens || 1));
    names.push(...numberedRooms('Bedroom', spec.bedrooms || 1));
    names.push(...numberedRooms('Bathroom', spec.bathrooms || 1));
    names.push(...numberedRooms('Laundry', spec.laundries || 1));
    names.push('General & Exterior');
    if (spec.hasYard) names.push('Garage');
  } else {
    names.push('Living Room', 'Kitchen');
    names.push(...numberedRooms('Bedroom', spec.bedrooms || 1));
    names.push(...numberedRooms('Bathroom', spec.bathrooms || 1));
    names.push('Laundry', 'Balcony');
  }

  const unique = [...new Set(names.map((name) => name.trim()).filter(Boolean))];
  return { names: unique, customAreas: customAreasForRoomNames(unique) };
}

/** Copy & merge: outgoing / routine inherit the last ingoing rooms and items. */
export function layoutFromIngoingPlan(
  plan: IngoingAreaPlan | null | undefined,
): InspectionLayout | null {
  if (!plan?.rooms.length) return null;
  const names: string[] = [];
  const customAreas: CustomAreaDefinition[] = [];
  for (const room of plan.rooms) {
    const name = room.name.trim();
    if (!name) continue;
    names.push(name);
    customAreas.push({
      name,
      sectionMode: room.sections.length > 0 ? 'standard' : 'manual',
      defaultSections: [...room.sections],
      optionalSections: ['Custom / Other'],
    });
  }
  if (names.length === 0) return null;
  return { names, customAreas };
}

export function draftNeedsLayoutSeed(draft: {
  areaSetupComplete?: boolean;
  selectedAreaNames?: string[];
}): boolean {
  return (
    draft.areaSetupComplete !== true &&
    (draft.selectedAreaNames?.length ?? 0) === 0
  );
}
