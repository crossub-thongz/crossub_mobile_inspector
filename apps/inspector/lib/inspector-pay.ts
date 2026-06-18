import {
  ESTIMATED_HOURS_BY_TYPE,
  INSPECTOR_HOURLY_RATE_AUD,
} from '@/constants/inspection';
import type { InspectionType } from '@/lib/types';

export function calculateInspectionFee(hours: number): number {
  return Math.round(hours * INSPECTOR_HOURLY_RATE_AUD * 100) / 100;
}

export function estimatedFeeForType(type: InspectionType): number {
  return calculateInspectionFee(ESTIMATED_HOURS_BY_TYPE[type]);
}

export function formatHourlyRate(): string {
  return `$${INSPECTOR_HOURLY_RATE_AUD}/hr`;
}
