import type { InspectionType } from '@/lib/types';

export const INSPECTOR_PAY_CURRENCY = 'AUD' as const;

/** Inspector pay rate — $45/hr. No fuel or mileage allowance. */
export const INSPECTOR_HOURLY_RATE_AUD = 45;

/**
 * Estimated on-site hours per inspection type (confirmed with Inspection Dept).
 * Final fee = hours × INSPECTOR_HOURLY_RATE_AUD, synced to Accounting.
 */
export const ESTIMATED_HOURS_BY_TYPE: Record<InspectionType, number> = {
  open: 1.5,
  ingoing: 2,
  outgoing: 2.5,
  routine: 1,
  tribunal: 3,
};

/** @deprecated Flat per-job rates replaced by hourly billing */
export const INSPECTION_PAY_RATES_AUD: Record<InspectionType, number> = {
  open: 67.5,
  ingoing: 90,
  outgoing: 112.5,
  routine: 45,
  tribunal: 135,
};

export const INSPECTION_PAY_LABEL: Record<InspectionType, string> = {
  open: 'Open',
  ingoing: 'Ingoing',
  outgoing: 'Outgoing',
  routine: 'Routine',
  tribunal: 'Tribunal',
};

/** Core field inspection types (excludes tribunal — separate module). */
export const CORE_INSPECTION_TYPES = [
  'open',
  'ingoing',
  'outgoing',
  'routine',
] as const;

export type CoreInspectionType = (typeof CORE_INSPECTION_TYPES)[number];

export const INSPECTION_TYPE_LABEL: Record<CoreInspectionType, string> = {
  open: 'OPEN',
  ingoing: 'INGOING',
  outgoing: 'OUTGOING',
  routine: 'ROUTINE',
};

export const INSPECTION_TYPE_DESCRIPTION: Record<CoreInspectionType, string> = {
  open: 'Property readiness, QR registration, and open reports',
  ingoing: 'Room-by-room condition at lease start',
  outgoing: 'Bond claims, damage comparison, end of lease',
  routine: 'Physical or tenant self-inspection during tenancy',
};

export const INGOING_AREAS = [
  'Entry',
  'Living Room',
  'Kitchen',
  'Laundry',
  'Bedroom',
  'Bathroom',
  'Balcony',
  'Garage',
] as const;

export const OPEN_READINESS_PHOTOS = [
  'Front Entrance',
  'Living Room',
  'Kitchen',
  'Bathroom',
  'Bedroom',
  'Outdoor Area',
] as const;

export const OPEN_FINISH_CHECKS = [
  'Doors Locked',
  'Windows Closed',
  'Lights Off',
  'Keys Collected',
] as const;

export const ROUTINE_AREAS = [
  'Property Condition',
  'Maintenance Issues',
  'Lease Breaches',
  'Pets',
  'Cleanliness',
  'Safety Issues',
] as const;

export const TRIBUNAL_OUTCOMES = [
  'claim_successful',
  'partially_successful',
  'rejected',
  'adjourned',
] as const;
