import { EMERGENCY_CANCEL_BONUS_AUD } from '@/constants/job-cancellation';
import type { InspectionJob } from '@/lib/types';

/** Short reference for Job ID on cards and admin alerts (first 8 hex chars). */
export function formatJobRefId(id: string): string {
  return id.replace(/-/g, '').slice(0, 8).toUpperCase();
}

export function emergencyCancelBonus(job: InspectionJob): number {
  return job.priority === 'urgent' ? EMERGENCY_CANCEL_BONUS_AUD : 0;
}

export function payoutWithEmergencyBonus(
  job: InspectionJob,
  bonus: number,
): Pick<InspectionJob, 'laborAmount' | 'payAmount'> {
  return {
    laborAmount: job.laborAmount + bonus,
    payAmount: job.payAmount + bonus,
  };
}
