import type {
  InspectorLeasingKeyContext,
  InspectionJob,
  KeyAccess,
  LeasingKeyCollectionState,
  LeasingKeyCustody,
} from '@/lib/types';
import {
  getKeyWorkflow,
  type KeyPhaseRecord,
  type KeyWorkflowData,
} from '@/lib/key-access-workflow';
import { shrinkDataUrlForUpload } from '@/lib/compress-image';
import { formatDateTime } from '@/lib/utils';

import {
  acceptInspection,
  claimInspection,
  fetchKeyCollection,
  recordKeyCustody,
  uploadKeyCustodyPhoto,
  type InspectorKeyCollection,
  type InspectorKeyCustody,
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
      photoRequired: dto.photoRequired ?? true,
    },
  };
}

/**
 * Build the local key-workflow overlay from the server-recorded custody, so
 * recorded collect/return (and their R2 proof photos) survive a new device or
 * cleared browser storage.
 */
export function keyWorkflowFromCustody(
  custody: InspectorKeyCustody | null | undefined,
): KeyWorkflowData | undefined {
  if (!custody) return undefined;
  const workflow: KeyWorkflowData = {};
  if (custody.collectComplete && custody.collectedAt) {
    workflow.collect = {
      completedAt: custody.collectedAt,
      stepsConfirmed: true,
      photoConfirmed: custody.collectPhotos.length > 0 || undefined,
      photoUrls: custody.collectPhotos.length ? custody.collectPhotos : undefined,
      notes: custody.collectNotes ?? undefined,
    };
  }
  if (custody.returnComplete && custody.returnedAt) {
    workflow.return = {
      completedAt: custody.returnedAt,
      stepsConfirmed: true,
      photoConfirmed: custody.returnPhotos.length > 0 || undefined,
      photoUrls: custody.returnPhotos.length ? custody.returnPhotos : undefined,
      notes: custody.returnNotes ?? undefined,
    };
  }
  return workflow.collect || workflow.return ? workflow : undefined;
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
    if (!dto) {
      // Clear any stale arrangement from a previous poll / wrong cycle match.
      if (!job.keyAccess && !job.leasingKeyCollection) return job;
      const { keyAccess: _ka, leasingKeyCollection: _lkc, ...rest } = job;
      return rest;
    }
    const { keyAccess, leasingKeyCollection } = mapKeyCollectionFromApi(dto);
    // Server custody fills cross-device gaps; local records win while a
    // submission is mid-flight on this device (richer data-URL photos).
    const localWorkflow = getKeyWorkflow(job) ?? {};
    const serverWorkflow = keyWorkflowFromCustody(dto.custody) ?? {};
    // Server custody wins once recorded; keep local drafts only while sync is pending.
    const keyWorkflow = serverWorkflow.collect?.completedAt
      ? { ...localWorkflow, ...serverWorkflow }
      : { ...serverWorkflow, ...localWorkflow };
    const workflowData = {
      ...job.workflowData,
      keyWorkflow,
    };
    return { ...job, keyAccess, leasingKeyCollection, workflowData };
  } catch {
    return job;
  }
}

export async function enrichJobsWithKeyCollection(
  jobs: InspectionJob[],
): Promise<InspectionJob[]> {
  return Promise.all(jobs.map((job) => enrichJobWithKeyCollection(job)));
}

import { dataUrlToUploadParts } from '@/lib/compress-image';

/**
 * Push a locally-recorded key phase to the server: proof photos first
 * (base64 → R2, appended to the phase's proof array), then the record call.
 * Photos that are already https URLs (server-hydrated) are skipped. Note the
 * server rejects a `return` record until the inspection is completed — the
 * caller sequences that.
 */
/** Claim + accept on the server so key-custody writes pass assignment scope checks. */
export async function ensureInspectionReadyForKeySync(
  inspectionId: string,
  fromPool: boolean,
): Promise<void> {
  if (fromPool) {
    try {
      await claimInspection(inspectionId);
    } catch {
      // Already claimed by this inspector — continue.
    }
  }
  try {
    await acceptInspection(inspectionId);
  } catch {
    // Already IN_PROGRESS — continue.
  }
}

export async function syncKeyCustodyToServer(
  inspectionId: string,
  phase: 'collect' | 'return',
  record: KeyPhaseRecord,
  options?: { fromPool?: boolean },
): Promise<InspectorKeyCustody> {
  await ensureInspectionReadyForKeySync(inspectionId, options?.fromPool ?? false);

  const photos = record.photoUrls ?? [];
  let uploaded = 0;
  for (const [index, photo] of photos.entries()) {
    if (photo.startsWith('http://') || photo.startsWith('https://')) {
      uploaded += 1;
      continue;
    }
    const uploadable = await shrinkDataUrlForUpload(photo);
    const parts = dataUrlToUploadParts(uploadable);
    if (!parts) continue;
    const extension = parts.mimeType.split('/')[1]?.replace('jpeg', 'jpg') ?? 'jpg';
    await uploadKeyCustodyPhoto(inspectionId, {
      phase,
      fileName: `key-${phase}-${index + 1}.${extension}`,
      ...parts,
    });
    uploaded += 1;
  }
  if (photos.length > 0 && uploaded === 0) {
    throw new Error('Could not read proof photo — try snapping again.');
  }
  return await recordKeyCustody(
    inspectionId,
    phase,
    record.notes ? { notes: record.notes } : {},
  );
}
