import {
  FUEL_RATE_PER_KM_AUD,
  INSPECTOR_HOURLY_RATE_AUD,
} from '@/constants/inspection-rates';
import {
  calculateInspectionDuration,
  tribunalInspectionHours,
} from '@/lib/inspection-duration';
import type { InspectionType, PropertyInspectionSpec } from '@/lib/types';

export interface JobPayBreakdown {
  estimatedHours: number;
  laborAmount: number;
  travelKmOneWay: number;
  fuelAllowance: number;
  payAmount: number;
}

export function calculateLaborFee(hours: number): number {
  return Math.round(hours * INSPECTOR_HOURLY_RATE_AUD * 100) / 100;
}

export function calculateFuelAllowance(travelKmOneWay: number): number {
  return Math.round(travelKmOneWay * FUEL_RATE_PER_KM_AUD * 100) / 100;
}

export function calculateJobPay(
  spec: PropertyInspectionSpec,
  travelKmOneWay: number,
  type: InspectionType = 'routine',
): JobPayBreakdown {
  const estimatedHours =
    type === 'tribunal'
      ? tribunalInspectionHours()
      : calculateInspectionDuration(spec);
  const laborAmount = calculateLaborFee(estimatedHours);
  const fuelAllowance =
    type === 'tribunal' ? 0 : calculateFuelAllowance(travelKmOneWay);

  return {
    estimatedHours,
    laborAmount,
    travelKmOneWay,
    fuelAllowance,
    payAmount: Math.round((laborAmount + fuelAllowance) * 100) / 100,
  };
}

/** @deprecated Use calculateLaborFee */
export function calculateInspectionFee(hours: number): number {
  return calculateLaborFee(hours);
}

export function formatHourlyRate(): string {
  return `$${INSPECTOR_HOURLY_RATE_AUD}/hr`;
}

export function formatFuelRate(): string {
  return `$${FUEL_RATE_PER_KM_AUD.toFixed(2)}/km`;
}
