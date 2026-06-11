import type { InspectionType } from '@/lib/types';

export const INSPECTOR_PAY_CURRENCY = 'AUD' as const;

export const INSPECTION_PAY_RATES_AUD: Record<InspectionType, number> = {
  open: 25,
  ingoing: 40,
  outgoing: 50,
  routine: 35,
  tribunal: 120,
};

export const INSPECTION_PAY_LABEL: Record<InspectionType, string> = {
  open: 'Open',
  ingoing: 'Ingoing',
  outgoing: 'Outgoing',
  routine: 'Routine',
  tribunal: 'Tribunal',
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
