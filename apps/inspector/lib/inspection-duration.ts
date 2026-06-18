import {
  APARTMENT_INSPECTION_HOURS,
  HOUSE_AREA_MINUTES,
  TRIBUNAL_INSPECTION_HOURS,
} from '@/constants/inspection-rates';
import type { ApartmentSpec, HouseSpec, PropertyInspectionSpec } from '@/lib/types';

export function apartmentInspectionHours(
  bedrooms: number,
  bathrooms: number,
): number {
  const exact = APARTMENT_INSPECTION_HOURS[`${bedrooms}-${bathrooms}`];
  if (exact != null) return exact;

  if (bedrooms <= 1) return 1;
  if (bedrooms === 2) return 1.5;
  if (bedrooms === 3) return 2;
  return 2.5;
}

export function houseInspectionHours(spec: HouseSpec): number {
  const minutes =
    spec.bedrooms * HOUSE_AREA_MINUTES.bedroom +
    spec.bathrooms * HOUSE_AREA_MINUTES.bathroom +
    spec.livingAreas * HOUSE_AREA_MINUTES.livingArea +
    spec.kitchens * HOUSE_AREA_MINUTES.kitchen +
    spec.laundries * HOUSE_AREA_MINUTES.laundry +
    (spec.hasYard ? HOUSE_AREA_MINUTES.yardsCombined : 0);

  return Math.round((minutes / 60) * 100) / 100;
}

export function calculateInspectionDuration(
  spec: PropertyInspectionSpec,
): number {
  if (spec.propertyKind === 'apartment') {
    return apartmentInspectionHours(spec.bedrooms, spec.bathrooms);
  }
  return houseInspectionHours(spec);
}

export function formatPropertyDurationLabel(spec: PropertyInspectionSpec): string {
  if (spec.propertyKind === 'apartment') {
    return `${spec.bedrooms} bed / ${spec.bathrooms} bath apartment`;
  }
  const parts = [
    `${spec.bedrooms} bed`,
    `${spec.bathrooms} bath`,
    spec.livingAreas > 0 ? `${spec.livingAreas} living` : null,
    spec.kitchens > 0 ? `${spec.kitchens} kitchen` : null,
    spec.laundries > 0 ? `${spec.laundries} laundry` : null,
    spec.hasYard ? 'yard' : null,
  ].filter(Boolean);
  return `House — ${parts.join(', ')}`;
}

export function tribunalInspectionHours(): number {
  return TRIBUNAL_INSPECTION_HOURS;
}
