import {
  INSPECTOR_HOURLY_RATE_AUD,
  TRIBUNAL_INSPECTION_HOURS,
} from '@/constants/inspection-rates';
import { calculateJobPay } from '@/lib/inspector-pay';
import { formatPropertyDurationLabel } from '@/lib/inspection-duration';
import type {
  InspectionJob,
  InspectionType,
  PropertyInspectionSpec,
  ServiceRegionKey,
} from '@/lib/types';

type JobPayFields = Pick<
  InspectionJob,
  | 'estimatedHours'
  | 'laborAmount'
  | 'travelKmOneWay'
  | 'fuelAllowance'
  | 'payAmount'
  | 'durationLabel'
  | 'serviceRegion'
  | 'property'
>;

export function buildJobPayFields(
  property: PropertyInspectionSpec,
  serviceRegion: ServiceRegionKey,
  travelKmOneWay: number,
  type: InspectionType,
): JobPayFields {
  const pay = calculateJobPay(property, travelKmOneWay, type);
  return {
    property,
    serviceRegion,
    durationLabel: formatPropertyDurationLabel(property),
    travelKmOneWay: pay.travelKmOneWay,
    estimatedHours: pay.estimatedHours,
    laborAmount: pay.laborAmount,
    fuelAllowance: pay.fuelAllowance,
    payAmount: pay.payAmount,
  };
}

export function buildTribunalPayFields(travelKmOneWay = 0): JobPayFields {
  const hours = TRIBUNAL_INSPECTION_HOURS;
  const laborAmount = Math.round(hours * INSPECTOR_HOURLY_RATE_AUD * 100) / 100;
  return {
    property: { propertyKind: 'apartment', bedrooms: 0, bathrooms: 0 },
    serviceRegion: 'cbd_inner',
    durationLabel: `Tribunal hearing — ${hours}h`,
    travelKmOneWay,
    estimatedHours: hours,
    laborAmount,
    fuelAllowance: 0,
    payAmount: laborAmount,
  };
}
