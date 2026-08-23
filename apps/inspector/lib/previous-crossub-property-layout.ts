import {
  buildAreaPlanFromReferenceAreas,
  resolveIngoingAreaPlan,
} from '@/lib/inspection-area-workflow';
import { emptyIngoingEntry } from '@/lib/inspection-execution-hydration';
import type { IngoingExecutionDraft } from '@/lib/inspection-execution-draft';
import type { IngoingAreaPlan } from '@/lib/ingoing-area-plan';
import {
  layoutFromIngoingPlan,
  mergeCustomAreas,
  type InspectionLayout,
} from '@/lib/inspection-layout-template';

/**
 * Previous CROSSUB tenancy layout for a new ingoing job.
 *
 * When a property already had Ingoing + Routine + Outgoing with us, the next
 * ingoing can reuse those rooms/items instead of the bedroom-count template.
 *
 * Not shown in the inspector UI yet — extract and paste only. Wire this into
 * area setup when product is ready to surface it.
 */
export type PreviousCrossubPropertyLayout = InspectionLayout & {
  areaPlan: IngoingAreaPlan;
  sourceInspectionId?: string;
};

const SPECIAL_REPORTING_AREA = /^(nsw\s+)?special reporting$/i;

function isSpecialReportingName(name: string): boolean {
  return SPECIAL_REPORTING_AREA.test(name.trim());
}

/** Turn a stored area plan into rooms the current job can paste. */
export function extractLayoutFromAreaPlan(
  plan: IngoingAreaPlan | null | undefined,
): PreviousCrossubPropertyLayout | null {
  const layout = layoutFromIngoingPlan(plan);
  if (!layout || !plan) return null;
  return { ...layout, areaPlan: plan };
}

/**
 * Turn findings rows (previous ingoing / routine / outgoing) into a pasteable
 * layout. Special Reporting is not a room and is dropped.
 */
export function extractLayoutFromPreviousAreas(
  areas: Array<{ name: string }>,
): PreviousCrossubPropertyLayout | null {
  const roomsOnly = areas.filter((area) => !isSpecialReportingName(area.name));
  const plan = buildAreaPlanFromReferenceAreas(roomsOnly);
  return extractLayoutFromAreaPlan(plan);
}

/** Prefer an API area plan; fall back to flattening reference area names. */
export function extractPreviousCrossubLayout(args: {
  areaPlan?: IngoingAreaPlan | null;
  areas?: Array<{ name: string }>;
  sourceInspectionId?: string;
}): PreviousCrossubPropertyLayout | null {
  const plan = resolveIngoingAreaPlan(args.areaPlan, args.areas ?? []);
  const layout = extractLayoutFromAreaPlan(plan);
  if (!layout) return null;
  return {
    ...layout,
    sourceInspectionId: args.sourceInspectionId,
  };
}

/**
 * Paste a previous CROSSUB layout onto the current ingoing draft.
 *
 * Replaces the selected area list with the extracted rooms and copies item
 * names onto custom area definitions so Start Inspection uses the same
 * checklist. Does not mark area setup complete — the inspector still confirms.
 */
export function pastePreviousLayoutOntoIngoingDraft(
  draft: IngoingExecutionDraft,
  layout: PreviousCrossubPropertyLayout | InspectionLayout,
): IngoingExecutionDraft {
  if (layout.names.length === 0) return draft;

  const customAreas = mergeCustomAreas(draft.customAreas ?? [], layout.customAreas);
  const entries: IngoingExecutionDraft['entries'] = { ...draft.entries };
  const sectionLookup = new Map(
    'areaPlan' in layout
      ? layout.areaPlan.rooms.map(
          (room) => [room.name.trim().toLowerCase(), room.sections] as const,
        )
      : [],
  );

  for (const name of layout.names) {
    const current = entries[name] ?? emptyIngoingEntry(name, customAreas);
    const sections = sectionLookup.get(name.trim().toLowerCase()) ?? [];
    const photosBySection = { ...current.photosBySection };
    for (const section of sections) {
      if (photosBySection[section] == null) photosBySection[section] = [];
    }
    entries[name] = {
      ...current,
      activeSections:
        current.activeSections.length > 0 ? current.activeSections : [...sections],
      photosBySection,
    };
  }

  return {
    ...draft,
    selectedAreaNames: [...layout.names],
    customAreas,
    entries,
    areaIndex: 0,
  };
}
