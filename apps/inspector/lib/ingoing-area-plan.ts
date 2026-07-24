import type { InspectorInspectionDetail } from '@/lib/crossub-api/inspector-client';
import {
  getInspectionAreaDefinition,
  type InspectionAreaDefinition,
} from '@/constants/inspection-areas';

export type IngoingAreaPlan = {
  rooms: Array<{ name: string; sections: string[] }>;
};

export type IngoingAreaPlanRoom = IngoingAreaPlan['rooms'][number];

export function referenceIngoingAreaPlan(
  detail: InspectorInspectionDetail,
): IngoingAreaPlan | null {
  const plan = detail.referenceIngoing?.areaPlan;
  if (!plan?.rooms?.length) return null;
  return plan;
}

export function findIngoingPlanRoom(
  plan: IngoingAreaPlan | null | undefined,
  roomName: string,
): IngoingAreaPlanRoom | undefined {
  if (!plan) return undefined;
  const target = roomName.trim().toLowerCase();
  return plan.rooms.find((room) => room.name.trim().toLowerCase() === target);
}

export function isRoomInIngoingPlan(
  plan: IngoingAreaPlan | null | undefined,
  roomName: string,
): boolean {
  return findIngoingPlanRoom(plan, roomName) != null;
}

/** Sections for an outgoing room — ingoing plan wins over catalog defaults. */
export function outgoingSectionsForRoom(
  plan: IngoingAreaPlan | null | undefined,
  roomName: string,
): string[] {
  const fromPlan = findIngoingPlanRoom(plan, roomName)?.sections;
  if (fromPlan?.length) return [...fromPlan];
  const def = getInspectionAreaDefinition(roomName);
  return [...(def?.defaultSections ?? [])];
}

export function buildOutgoingIssueSeed(
  def: InspectionAreaDefinition,
  plan: IngoingAreaPlan | null,
): {
  available: boolean | null;
  activeSections: string[];
} {
  if (!plan) {
    return { available: null, activeSections: [...def.defaultSections] };
  }
  const planRoom = findIngoingPlanRoom(plan, def.name);
  if (!planRoom) {
    return { available: false, activeSections: [] };
  }
  return {
    available: true,
    activeSections: [...planRoom.sections],
  };
}
