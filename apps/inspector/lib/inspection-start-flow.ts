import type { InspectionAreaKind } from '@/lib/inspection-area-workflow';
import type { InspectionJob, InspectionType } from '@/lib/types';

export type InspectionLayoutSource = 'template' | 'copied' | 'manual';

const START_COPY: Record<
  InspectionAreaKind,
  {
    title: string;
    body: string;
    startLabel: string;
    continueLabel: string;
    sectionsHint: string;
    firstRoomHint: string;
  }
> = {
  ingoing: {
    title: 'Start ingoing',
    body: 'Condition report at lease start. Rooms are pre-loaded from the property layout — add or remove any that do not match, then walk room by room.',
    startLabel: 'Start ingoing',
    continueLabel: 'Continue ingoing',
    sectionsHint: 'Photograph clockwise from the door. Extra close-ups for damage and safety.',
    firstRoomHint:
      'Start at the door and photograph clockwise around the room. Add close-ups of damage and safety items such as blind cords.',
  },
  outgoing: {
    title: 'Start outgoing',
    body: 'Exit inspection compared with the move-in report. Rooms and baseline photos copy across so you only record what changed.',
    startLabel: 'Start outgoing',
    continueLabel: 'Continue outgoing',
    sectionsHint: 'Move-in photos load beside each section for comparison.',
    firstRoomHint:
      'Compare each section with the move-in photos. Photograph changes, damage, and make-good items.',
  },
  routine: {
    title: 'Start routine',
    body: 'Periodic inspection. Rooms copy from the last condition report — skip areas that are in order and only photograph exceptions.',
    startLabel: 'Start routine',
    continueLabel: 'Continue routine',
    sectionsHint: 'Exception-based: skip rooms that are fine, photograph issues only.',
    firstRoomHint:
      'Is there anything to note? Yes to photograph issues. No if this area is in order.',
  },
};

export function inspectionStartCopy(kind: InspectionAreaKind) {
  return START_COPY[kind];
}

export function setupStartLabel(
  kind: InspectionAreaKind,
  continuing: boolean,
): string {
  const copy = START_COPY[kind];
  return continuing ? copy.continueLabel : copy.startLabel;
}

export function jobStartCta(
  type: InspectionType,
  started: boolean,
): string {
  if (type === 'ingoing' || type === 'outgoing' || type === 'routine') {
    return setupStartLabel(type, started);
  }
  return started ? 'Continue inspection' : 'Start inspection';
}

export function layoutSourceLabel(
  source: InspectionLayoutSource,
  roomCount: number,
): string | null {
  if (roomCount === 0) return null;
  if (source === 'copied') {
    return `${roomCount} area${roomCount === 1 ? '' : 's'} copied from the last ingoing report`;
  }
  if (source === 'template') {
    return `${roomCount} area${roomCount === 1 ? '' : 's'} loaded from the property layout`;
  }
  return null;
}

function smsDigits(phone: string): string {
  return phone.replace(/[^\d+]/g, '');
}

export function preInspectionSmsHref(job: InspectionJob): string | null {
  if (!job.tenantPhone?.trim()) return null;
  const name = job.tenantName?.trim() || 'there';
  const when = job.scheduledTime || job.scheduledDate;
  const body = `Hi ${name}, reminder that your routine inspection at ${job.propertyAddress} is scheduled for ${when}. Please ensure access. — Crossub Inspections`;
  return `sms:${smsDigits(job.tenantPhone)}?body=${encodeURIComponent(body)}`;
}
