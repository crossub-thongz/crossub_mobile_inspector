import {
  FUEL_RATE_PER_KM_AUD,
  INSPECTOR_HOURLY_RATE_AUD,
  ROUTINE_OPEN_INSPECTOR_FEE_INC_GST_AUD,
} from '@/constants/inspection-rates';
import { agentCatalogFeeIncGst } from '@/lib/agent-inspection-pricing';
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

function inspectorFlatFeeIncGst(type: InspectionType): number | null {
  if (type === 'routine' || type === 'open') {
    return ROUTINE_OPEN_INSPECTOR_FEE_INC_GST_AUD;
  }
  return null;
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
  const flatFee = inspectorFlatFeeIncGst(type);
  const catalogFee = flatFee ?? agentCatalogFeeIncGst(type, spec);
  const laborAmount = catalogFee ?? calculateLaborFee(estimatedHours);
  const displayHours =
    flatFee != null ? 1 : estimatedHours;
  const fuelAllowance =
    type === 'tribunal' ? 0 : calculateFuelAllowance(travelKmOneWay);

  return {
    estimatedHours: displayHours,
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
