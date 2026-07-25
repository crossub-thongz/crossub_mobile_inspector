import {
  COMMON_DEFAULT_SECTIONS,
  INSPECTION_AREA_CATALOG,
  type InspectionAreaDefinition,
} from '@/constants/inspection-areas';

export type CustomAreaSectionMode = 'standard' | 'manual';

export type CustomAreaDefinition = {
  name: string;
  sectionMode: CustomAreaSectionMode;
};

export function customAreaToDefinition(
  custom: CustomAreaDefinition,
): InspectionAreaDefinition {
  if (custom.sectionMode === 'standard') {
    return {
      name: custom.name,
      defaultSections: [...COMMON_DEFAULT_SECTIONS],
      optionalSections: ['Custom / Other'],
    };
  }
  return {
    name: custom.name,
    defaultSections: [],
    optionalSections: [...COMMON_DEFAULT_SECTIONS, 'Custom / Other'],
  };
}

export function buildEffectiveAreaCatalog(
  customAreas: CustomAreaDefinition[] = [],
): InspectionAreaDefinition[] {
  const builtInNames = new Set(
    INSPECTION_AREA_CATALOG.map((area) => area.name.toLowerCase()),
  );
  const seen = new Set(builtInNames);
  const extras: InspectionAreaDefinition[] = [];

  for (const custom of customAreas) {
    const name = custom.name.trim();
    if (!name) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    extras.push(customAreaToDefinition({ ...custom, name }));
  }

  return [...INSPECTION_AREA_CATALOG, ...extras];
}

export function resolveAreaDefinition(
  areaName: string,
  customAreas: CustomAreaDefinition[] = [],
): InspectionAreaDefinition {
  const builtIn = INSPECTION_AREA_CATALOG.find((area) => area.name === areaName);
  if (builtIn) return builtIn;

  const custom = customAreas.find(
    (area) => area.name.trim().toLowerCase() === areaName.trim().toLowerCase(),
  );
  if (custom) return customAreaToDefinition(custom);

  return {
    name: areaName,
    defaultSections: [],
    optionalSections: [...COMMON_DEFAULT_SECTIONS, 'Custom / Other'],
  };
}

export function isCustomAreaName(
  areaName: string,
  customAreas: CustomAreaDefinition[] = [],
): boolean {
  return customAreas.some(
    (area) => area.name.trim().toLowerCase() === areaName.trim().toLowerCase(),
  );
}

export function normalizeCustomAreaName(name: string): string {
  return name.trim().replace(/\s+/g, ' ');
}

export function validateNewCustomAreaName(
  name: string,
  customAreas: CustomAreaDefinition[] = [],
): string | null {
  const normalized = normalizeCustomAreaName(name);
  if (normalized.length < 2) {
    return 'Enter an area name (at least 2 characters).';
  }
  const key = normalized.toLowerCase();
  if (
    INSPECTION_AREA_CATALOG.some((area) => area.name.toLowerCase() === key) ||
    customAreas.some((area) => area.name.trim().toLowerCase() === key)
  ) {
    return 'An area with this name already exists.';
  }
  return null;
}
