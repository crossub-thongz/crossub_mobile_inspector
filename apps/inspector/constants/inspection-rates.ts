/** Inspector Rates & Property Inspection Time Guidelines */

export const INSPECTOR_HOURLY_RATE_AUD = 45;

/** Fuel reimbursed one-way from regional midpoint → property ($/km). */
export const FUEL_RATE_PER_KM_AUD = 0.8;

export const SERVICE_REGION_KEYS = [
  'cbd_inner',
  'eastern_suburbs',
  'western_sydney',
  'northern_sydney',
] as const;

export type ServiceRegionKey = (typeof SERVICE_REGION_KEYS)[number];

export const REGIONAL_MIDPOINTS: Record<
  ServiceRegionKey,
  { label: string; midpoint: string }
> = {
  cbd_inner: {
    label: 'CBD & Inner City',
    midpoint: 'Broadway Shopping Centre',
  },
  eastern_suburbs: {
    label: 'Eastern Suburbs',
    midpoint: 'Westfield Bondi Junction',
  },
  western_sydney: {
    label: 'Western Sydney',
    midpoint: 'Westfield Parramatta',
  },
  northern_sydney: {
    label: 'Northern Sydney',
    midpoint: 'Westfield Chatswood',
  },
};

/** Apartment allocated time (hours) by bedrooms / bathrooms. */
export const APARTMENT_INSPECTION_HOURS: Record<string, number> = {
  '1-1': 1,
  '2-2': 1.5,
  '3-2': 2,
  '4-3': 2.5,
};

/** House area time estimates (minutes per area). */
export const HOUSE_AREA_MINUTES = {
  bedroom: 10,
  bathroom: 10,
  livingArea: 10,
  kitchen: 20,
  laundry: 10,
  yardsCombined: 10,
} as const;

/** Tribunal hearings — fixed on-site allocation (not in property tables). */
export const TRIBUNAL_INSPECTION_HOURS = 2;
