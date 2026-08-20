import {
  COMMON_DEFAULT_SECTIONS,
  INSPECTION_AREA_CATALOG,
  type InspectionAreaDefinition,
} from '@/constants/inspection-areas';

export type CustomAreaSectionMode = 'standard' | 'manual';

export type CustomAreaDefinition = {
  name: string;
  sectionMode: CustomAreaSectionMode;
  /** Copied from the source area when an inspector renames a catalog room. */
  defaultSections?: string[];
  optionalSections?: string[];
};

export function customAreaToDefinition(
  custom: CustomAreaDefinition,
): InspectionAreaDefinition {
  if (custom.defaultSections || custom.optionalSections) {
    return {
      name: custom.name,
      defaultSections:
        custom.defaultSections && custom.defaultSections.length > 0
          ? [...custom.defaultSections]
          : custom.sectionMode === 'standard'
            ? [...COMMON_DEFAULT_SECTIONS]
            : [],
      optionalSections: custom.optionalSections?.length
        ? [...custom.optionalSections]
        : ['Custom / Other'],
    };
  }
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
  const custom = customAreas.find(
    (area) => area.name.trim().toLowerCase() === areaName.trim().toLowerCase(),
  );
  if (custom?.defaultSections || custom?.optionalSections) {
    return customAreaToDefinition(custom);
  }

  const builtIn = INSPECTION_AREA_CATALOG.find((area) => area.name === areaName);
  if (builtIn) return builtIn;
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

export function buildExecutionAreaCatalog(
  selectedAreaNames: string[] | undefined,
  customAreas: CustomAreaDefinition[] = [],
): InspectionAreaDefinition[] {
  if (!selectedAreaNames?.length) {
    return buildEffectiveAreaCatalog(customAreas);
  }
  return selectedAreaNames.map((name) =>
    resolveAreaDefinition(name, customAreas),
  );
}

export function inferSelectedAreaNamesFromDraft(
  entries: Record<string, unknown>,
  customAreas: CustomAreaDefinition[] = [],
): string[] {
  const keys = Object.keys(entries).filter(Boolean);
  if (keys.length === 0) return [];
  const full = buildEffectiveAreaCatalog(customAreas);
  const order = new Map(full.map((area, index) => [area.name.toLowerCase(), index]));
  return [...keys].sort(
    (a, b) => (order.get(a.toLowerCase()) ?? 999) - (order.get(b.toLowerCase()) ?? 999),
  );
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
