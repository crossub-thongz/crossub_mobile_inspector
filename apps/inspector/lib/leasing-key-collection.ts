import type {
  InspectorLeasingKeyContext,
  InspectionJob,
  KeyAccess,
  LeasingKeyCollectionState,
  LeasingKeyCustody,
} from '@/lib/types';
import { formatDateTime } from '@/lib/utils';

import {
  fetchKeyCollection,
  type InspectorKeyCollection,
} from '@/lib/crossub-api/inspector-client';

export const KEY_CUSTODY_LABEL: Record<LeasingKeyCustody, string> = {
  crossub: 'CROSSUB manages keys',
  agent: 'Agent manages keys',
};

function formatScheduledTime(iso: string | null): string {
  return iso ? formatDateTime(iso) : 'TBD';
}

function buildCollectSteps(
  keyCustody: LeasingKeyCustody,
  location: string,
  time: string | null,
): string[] {
  const scheduled = formatScheduledTime(time);
  const custodian =
    keyCustody === 'crossub' ? 'CROSSUB' : 'the managing agent';
  return [
    `Go to ${location}`,
    time ? `Scheduled pickup: ${scheduled}` : `Confirm time with ${custodian}`,
    'Collect keys and snap a photo of keys in hand',
    'Verify items match the tenant handover report when provided',
  ];
}

function buildReturnSteps(location: string, keyCustody: LeasingKeyCustody): string[] {
  const custodian = keyCustody === 'crossub' ? 'CROSSUB' : 'the agent';
  return [
    `Return keys to ${location}`,
    'Snap photo of keys returned',
    `Confirm handover with ${custodian}`,
  ];
}

/** Map the inspector key-collection API DTO onto FE view-models. */
export function mapKeyCollectionFromApi(dto: InspectorKeyCollection): {
  leasingKeyCollection: InspectorLeasingKeyContext;
  keyAccess: KeyAccess;
} {
  const keyCustody = (dto.keyCustody === 'agent' ? 'agent' : 'crossub') as LeasingKeyCustody;
  const location = dto.keyCollection.location?.trim() || 'TBD — confirm pickup location';
  const keyCollection: LeasingKeyCollectionState = {
    status: (dto.keyCollection.status ?? 'not_started') as LeasingKeyCollectionState['status'],
    time: dto.keyCollection.time ?? null,
    location: dto.keyCollection.location ?? null,
    photos: dto.keyCollection.photos ?? [],
    tenantReport: dto.keyCollection.tenantReport ?? null,
  };

  return {
    leasingKeyCollection: {
      cycleId: dto.cycleId,
      propertyId: dto.propertyId,
      propertyAddress: dto.propertyAddress,
      keyCustody,
      keyCollection,
    },
    keyAccess: {
      method: keyCustody === 'crossub' ? 'office' : 'agent',
      location,
      collectSteps: buildCollectSteps(keyCustody, location, keyCollection.time),
      returnSteps: buildReturnSteps(location, keyCustody),
      photoRequired: true,
    },
  };
}

export function hasTenantKeyReport(keyCollection: LeasingKeyCollectionState): boolean {
  return keyCollection.tenantReport != null;
}

export function hasKeyCollectionPhotos(keyCollection: LeasingKeyCollectionState): boolean {
  return (keyCollection.photos?.length ?? 0) > 0;
}

/** Fetch leasing key-collection for an API job and merge onto the card. */
export async function enrichJobWithKeyCollection(
  job: InspectionJob,
): Promise<InspectionJob> {
  try {
    const dto = await fetchKeyCollection(job.id);
    if (!dto) return job;
    const { keyAccess, leasingKeyCollection } = mapKeyCollectionFromApi(dto);
    return { ...job, keyAccess, leasingKeyCollection };
  } catch {
    return job;
  }
}

export async function enrichJobsWithKeyCollection(
  jobs: InspectionJob[],
): Promise<InspectionJob[]> {
  return Promise.all(jobs.map((job) => enrichJobWithKeyCollection(job)));
}
