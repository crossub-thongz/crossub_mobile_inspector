import type { InspectionJob } from '@/lib/types';

export type HandoverParty = 'tenant' | 'agent';
export type KeyCondition = 'good' | 'damaged';

export interface KeyPhaseRecord {
  completedAt: string;
  stepsConfirmed: boolean;
  photoConfirmed?: boolean;
  /** Data URLs of snapped or uploaded proof photos (persisted in workflowData). */
  photoUrls?: string[];
  notes?: string;
  handoverParty?: HandoverParty;
  keySets?: number;
  keyCondition?: KeyCondition;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  agencyName?: string;
}

export interface KeyWorkflowData {
  collect?: KeyPhaseRecord;
  return?: KeyPhaseRecord;
}

const KEY_WORKFLOW_KEY = 'keyWorkflow';
const INSPECTION_FINISHED_KEY = 'inspectionFinished';

export function getKeyWorkflow(job: InspectionJob): KeyWorkflowData | undefined {
  const raw = job.workflowData?.[KEY_WORKFLOW_KEY];
  if (!raw || typeof raw !== 'object') return undefined;
  return raw as KeyWorkflowData;
}

function hasServerKeyProof(record?: KeyPhaseRecord): boolean {
  return Boolean(
    record?.photoUrls?.some(
      (url) => url.startsWith('http://') || url.startsWith('https://'),
    ),
  );
}

export function isKeyCollectComplete(job: InspectionJob): boolean {
  if (!job.keyAccess) return true;
  const collect = getKeyWorkflow(job)?.collect;
  if (!collect?.stepsConfirmed) return false;
  // Handover always needs at least one proof photo.
  if (!collect.photoUrls?.length) return false;
  // Assigned API jobs must have server-hosted proof — not browser-only state.
  if (job.source === 'assigned' && !hasServerKeyProof(collect)) return false;
  return true;
}

/** Persist handover extras in the notes field the key-custody API already stores. */
export function formatHandoverNotes(
  record: KeyPhaseRecord,
  phase: 'collect' | 'return' = 'collect',
): string | undefined {
  const lines: string[] = [];
  if (record.handoverParty) {
    const label =
      phase === 'return'
        ? 'Handover (returning keys)'
        : 'Handover (collecting keys)';
    lines.push(`${label} with ${record.handoverParty}`);
  }
  if (record.contactName) lines.push(`Contact: ${record.contactName}`);
  if (record.agencyName) lines.push(`Agency: ${record.agencyName}`);
  if (record.contactPhone) lines.push(`Phone: ${record.contactPhone}`);
  if (record.contactEmail) lines.push(`Email: ${record.contactEmail}`);
  if (record.keySets != null) lines.push(`Key sets: ${record.keySets}`);
  if (record.keyCondition) {
    lines.push(`Condition: ${record.keyCondition}`);
  }
  if (record.notes?.trim()) lines.push(record.notes.trim());
  return lines.length ? lines.join('\n') : undefined;
}

const HANDOVER_PARTY_RE = /Handover(?: \([^)]+\))? with (tenant|agent)/i;

export function parseHandoverPartyFromNotes(
  notes: string | null | undefined,
): HandoverParty | undefined {
  if (!notes) return undefined;
  const match = notes.match(HANDOVER_PARTY_RE);
  return match ? (match[1].toLowerCase() as HandoverParty) : undefined;
}

/** Keep structured handover fields after the server round-trip overwrites photo URLs. */
export function mergeKeyPhaseExtras(
  server: KeyWorkflowData | undefined,
  submitted: KeyPhaseRecord,
  phase: 'collect' | 'return',
): KeyWorkflowData {
  const base = server ?? {};
  const existing = base[phase];
  return {
    ...base,
    [phase]: {
      ...(existing ?? submitted),
      ...submitted,
      photoUrls: existing?.photoUrls?.length ? existing.photoUrls : submitted.photoUrls,
      completedAt: existing?.completedAt ?? submitted.completedAt,
    },
  };
}

export function isKeyReturnComplete(job: InspectionJob): boolean {
  if (!job.keyAccess) return true;
  const ret = getKeyWorkflow(job)?.return;
  if (!ret?.stepsConfirmed) return false;
  // Returning keys uses the same handover form as collecting — photos always required.
  if (!ret.photoUrls?.length) return false;
  if (job.source === 'assigned' && !hasServerKeyProof(ret)) return false;
  return true;
}

/** Inspection report/workflow submitted — required before the return-key step unlocks. */
export function isInspectionWorkflowFinished(job: InspectionJob): boolean {
  if (!job.keyAccess) return true;
  if (job.status === 'completed' || job.status === 'awaiting_approval') return true;
  return Boolean(job.workflowData?.[INSPECTION_FINISHED_KEY]);
}

export function buildInspectionFinishedPatch(): Record<string, unknown> {
  return {
    [INSPECTION_FINISHED_KEY]: true,
    inspectionFinishedAt: new Date().toISOString(),
  };
}

export function canStartInspection(job: InspectionJob): boolean {
  if (job.keyAccess && !isKeyCollectComplete(job)) return false;
  return true;
}

export function canAccessKeyReturnTab(job: InspectionJob): boolean {
  if (!job.keyAccess) return false;
  if (!isKeyCollectComplete(job)) return false;
  return isInspectionWorkflowFinished(job);
}

export function buildKeyWorkflowPatch(
  job: InspectionJob,
  phase: 'collect' | 'return',
  record: KeyPhaseRecord,
): Record<string, unknown> {
  const existing = getKeyWorkflow(job) ?? {};
  return {
    [KEY_WORKFLOW_KEY]: {
      ...existing,
      [phase]: record,
    },
  };
}
