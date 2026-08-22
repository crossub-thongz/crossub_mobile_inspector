import type { InspectionJob } from '@/lib/types';

/** Split a full address into street line + suburb/postcode line for property cards. */
export function propertyAddressLines(job: InspectionJob): {
  street: string;
  locality: string;
} {
  const full = job.propertyAddress.trim();
  const suburb = job.suburb?.trim();
  if (suburb && full.toLowerCase().includes(suburb.toLowerCase())) {
    const index = full.toLowerCase().indexOf(suburb.toLowerCase());
    return {
      street: full.slice(0, index).replace(/,\s*$/, '').trim() || full,
      locality: full.slice(index).trim(),
    };
  }
  const comma = full.lastIndexOf(',');
  if (comma > 0) {
    return {
      street: full.slice(0, comma).trim(),
      locality: full.slice(comma + 1).trim() || suburb || '',
    };
  }
  return { street: full, locality: suburb ?? '' };
}
