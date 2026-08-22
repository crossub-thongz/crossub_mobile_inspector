/** Shared default sections for rooms that use the standard condition checklist. */
export const COMMON_DEFAULT_SECTIONS = [
  'Walls / Picture Hooks',
  'Doors / Door Frames',
  'Windows / Screens / Window Safety Devices',
  'Ceiling / Light Fittings',
  'Blinds / Curtains',
  'Lights / Power Points',
  'Skirting Boards',
  'Floor Coverings',
] as const;

/** Inspection Express bathroom items, in template order. */
export const BATHROOM_DEFAULT_SECTIONS = [
  'Walls/tiles',
  'Floor tiles/floor coverings',
  'Doors/doorway frames',
  'Windows/screens/window safety devices',
  'Ceiling/light fittings',
  'Blinds/curtains',
  'Lights/power points',
  'Bath/taps',
  'Shower/screen/taps',
  'Wash basin/taps',
  'Mirror/cabinet/vanity',
  'Towel rails',
  'Toilet/cistern/seat',
  'Toilet roll holder',
  'Heating/exhaust fan/vent',
  'Other',
] as const;

/** Inspection Express laundry items, in template order. */
export const LAUNDRY_DEFAULT_SECTIONS = [
  'Walls/tiles',
  'Floor tiles/floor coverings',
  'Doors/doorway frames',
  'Windows/screens/window safety devices',
  'Ceiling/light fittings',
  'Blinds/curtains',
  'Lights/power points',
  'Washing machine/taps',
  'Exhaust fan/vent',
  'Washing tub',
  'Dryer',
  'Other',
] as const;

export type InspectionAreaDefinition = {
  name: string;
  /** Always shown when the area is available. */
  defaultSections: readonly string[];
  /** Offered in “Add section” dropdown. */
  optionalSections: readonly string[];
};

/**
 * Ingoing / outgoing room catalog.
 * Defaults = common wall-to-floor checklist; area-specific extras are optional adds.
 * Garage / Security / General have no common defaults — everything is opt-in via dropdown.
 */
export const INSPECTION_AREA_CATALOG: readonly InspectionAreaDefinition[] = [
  {
    name: 'Entry',
    defaultSections: COMMON_DEFAULT_SECTIONS,
    optionalSections: ['Custom / Other'],
  },
  {
    name: 'Lounge Room',
    defaultSections: COMMON_DEFAULT_SECTIONS,
    optionalSections: ['Custom / Other'],
  },
  {
    name: 'Dining Room',
    defaultSections: COMMON_DEFAULT_SECTIONS,
    optionalSections: ['Custom / Other'],
  },
  {
    name: 'Living Room',
    defaultSections: COMMON_DEFAULT_SECTIONS,
    optionalSections: ['Custom / Other'],
  },
  {
    name: 'Kitchen',
    defaultSections: COMMON_DEFAULT_SECTIONS,
    optionalSections: [
      'Cupboards / Drawers',
      'Bench Tops / Tiling',
      'Sink / Taps / Disposal Unit',
      'Stove Top / Hot Plates',
      'Oven / Grill',
      'Exhaust Fan / Hood',
      'Dishwasher',
      'Custom / Other',
    ],
  },
  {
    name: 'Laundry',
    defaultSections: LAUNDRY_DEFAULT_SECTIONS,
    optionalSections: [
      'Cupboards / Drawers',
      'Bench Tops / Tiling',
      'Sink / Taps / Disposal Unit',
      'Custom / Other',
    ],
  },
  {
    name: 'Bedroom',
    defaultSections: COMMON_DEFAULT_SECTIONS,
    optionalSections: ['Custom / Other'],
  },
  {
    name: 'Bathroom',
    defaultSections: BATHROOM_DEFAULT_SECTIONS,
    optionalSections: ['Custom / Other'],
  },
  {
    name: 'Ensuite',
    defaultSections: BATHROOM_DEFAULT_SECTIONS,
    optionalSections: ['Custom / Other'],
  },
  {
    name: 'Balcony',
    defaultSections: COMMON_DEFAULT_SECTIONS,
    optionalSections: ['Balustrade / Railings', 'Custom / Other'],
  },
  {
    name: 'Garage',
    defaultSections: [],
    optionalSections: [
      'Garage Door & Remote Control',
      'Walls / Ceiling',
      'Floor / Concrete Slab',
      'Lights / Power Points',
      'Shelving / Storage Areas',
      'Custom / Other',
    ],
  },
  {
    name: 'Security',
    defaultSections: [],
    optionalSections: [
      'External Door Locks',
      'Window Locks',
      'Keys / Security Remotes / Fobs',
      'Security Cameras',
      'Security Alarms',
      'Smoke Alarms',
      'Electrical Safety Switches',
      'Custom / Other',
    ],
  },
  {
    name: 'General & Exterior',
    defaultSections: [],
    optionalSections: [
      'Heating / Air Conditioning',
      'Staircase / Handrails',
      'External Television Antenna / TV Points',
      'Lawn & Garden',
      'Garden Hose / Fittings / Watering System',
      'Gates & Fences / Pool Fence & Gate',
      'Letterbox / Street Number',
      'Water Tanks / Septic Tanks',
      'Garbage Bins',
      'Pavement / Driveway',
      'Clothes Line',
      'Garage / Carport / Storeroom',
      'Hot Water System',
      'Gutters / Downpipes',
      'Custom / Other',
    ],
  },
] as const;

/** Ordered area names used by ingoing / outgoing workflows. */
export const INSPECTION_AREAS = INSPECTION_AREA_CATALOG.map((a) => a.name);

/**
 * Catalog match for a room name, including numbered copies
 * (`Bathroom 2` → Bathroom, `Laundry 2` → Laundry).
 */
export function catalogAreaNameFor(name: string): string | undefined {
  const trimmed = name.trim();
  if (!trimmed) return undefined;
  const lower = trimmed.toLowerCase();
  const exact = INSPECTION_AREA_CATALOG.find(
    (area) => area.name.toLowerCase() === lower,
  );
  if (exact) return exact.name;
  const numbered = /^(.+?)\s+\d+$/.exec(trimmed);
  if (!numbered) return undefined;
  const base = numbered[1].trim().toLowerCase();
  return INSPECTION_AREA_CATALOG.find((area) => area.name.toLowerCase() === base)
    ?.name;
}

export function getInspectionAreaDefinition(
  name: string,
): InspectionAreaDefinition | undefined {
  const catalogName = catalogAreaNameFor(name);
  if (!catalogName) return undefined;
  const def = INSPECTION_AREA_CATALOG.find((area) => area.name === catalogName);
  if (!def) return undefined;
  const trimmed = name.trim();
  return def.name === trimmed ? def : { ...def, name: trimmed };
}

/** Photo / findings key for a room section. */
export function sectionAreaName(area: string, section: string): string {
  return `${area} · ${section}`;
}

export function parseSectionAreaName(
  combined: string,
): { area: string; section: string } | null {
  const sep = ' · ';
  const idx = combined.indexOf(sep);
  if (idx <= 0) return null;
  return {
    area: combined.slice(0, idx).trim(),
    section: combined.slice(idx + sep.length).trim(),
  };
}
