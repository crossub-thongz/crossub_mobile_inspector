import {
  buildEffectiveAreaCatalog,
  resolveAreaDefinition,
  type CustomAreaDefinition,
} from '@/lib/custom-inspection-areas';
import { INSPECTION_AREA_CATALOG, parseSectionAreaName } from '@/constants/inspection-areas';
import type { InspectorInspectionDetail } from '@/lib/crossub-api/inspector-client';
import {
  type IngoingAreaEntryDraft,
  type IngoingExecutionDraft,
  type OutgoingAreaIssueDraft,
  type OutgoingExecutionDraft,
  type RoutineAreaIssueDraft,
  type RoutineExecutionDraft,
  type SectionBeforeAfterDraft,
  mergePhotoUrlLists,
} from '@/lib/inspection-execution-draft';

const INGOING_SUFFIX = /\s*\(ingoing\)\s*$/i;
const OUTGOING_SUFFIX = /\s*\(outgoing\)\s*$/i;

function isPersistedPhotoUrl(url: string): boolean {
  return /^https?:\/\//i.test(url.trim());
}

function areaPhotoUrls(area: InspectorInspectionDetail['areas'][number]): string[] {
  return [
    ...area.photos.map((photo) => photo.url),
    ...area.items.flatMap((item) => item.photos.map((photo) => photo.url)),
  ].filter(isPersistedPhotoUrl);
}

function conditionFromRating(
  area: InspectorInspectionDetail['areas'][number],
): string {
  if (area.ratingRaw?.trim()) return area.ratingRaw.trim();
  if (!area.rating) return '';
  const labels: Record<string, string> = {
    EXCELLENT: 'Excellent',
    GOOD: 'Good',
    FAIR: 'Fair',
    POOR: 'Poor',
    DAMAGED: 'Damaged',
  };
  return labels[area.rating] ?? area.rating;
}

function notesFromArea(area: InspectorInspectionDetail['areas'][number]): string {
  const notes = area.items.find((item) => item.name === 'Notes');
  return notes?.comment?.trim() ?? '';
}

export function emptyIngoingEntry(
  areaName: string,
  customAreas: CustomAreaDefinition[] = [],
): IngoingAreaEntryDraft {
  const def = resolveAreaDefinition(areaName, customAreas);
  return {
    available: null,
    condition: '',
    comments: '',
    activeSections: [],
    photosBySection: {},
  };
}

export function emptyRoutineIssue(areaName: string): RoutineAreaIssueDraft {
  const def = resolveAreaDefinition(areaName);
  return {
    available: null,
    notes: '',
    activeSections: [],
    photosBySection: {},
  };
}

export function emptyOutgoingIssue(
  areaName: string,
  seed?: { available: boolean | null; activeSections: string[] },
  customAreas: CustomAreaDefinition[] = [],
): OutgoingAreaIssueDraft {
  const def = resolveAreaDefinition(areaName, customAreas);
  return {
    available: seed?.available ?? null,
    note: '',
    responsibility: '',
    activeSections: seed?.activeSections ?? [],
    photosBySection: {},
  };
}

const emptySectionPhotos = (): SectionBeforeAfterDraft => ({
  ingoingPhotoUrls: [],
  outgoingPhotoUrls: [],
});

function mergeIngoingEntry(
  base: IngoingAreaEntryDraft,
  overlay: Partial<IngoingAreaEntryDraft> | undefined,
): IngoingAreaEntryDraft {
  if (!overlay) return base;
  const photosBySection = { ...base.photosBySection };
  for (const [section, urls] of Object.entries(overlay.photosBySection ?? {})) {
    photosBySection[section] = mergePhotoUrlLists(
      base.photosBySection[section],
      urls,
    );
  }
  return {
    available: overlay.available ?? base.available,
    condition: overlay.condition || base.condition,
    comments: overlay.comments || base.comments,
    activeSections:
      overlay.activeSections && overlay.activeSections.length > 0
        ? overlay.activeSections
        : base.activeSections,
    photosBySection,
  };
}

function mergeSectionPhotos(
  base: SectionBeforeAfterDraft,
  overlay: SectionBeforeAfterDraft | undefined,
): SectionBeforeAfterDraft {
  if (!overlay) return base;
  return {
    ingoingPhotoUrls: mergePhotoUrlLists(
      base.ingoingPhotoUrls,
      overlay.ingoingPhotoUrls,
    ),
    outgoingPhotoUrls: mergePhotoUrlLists(
      base.outgoingPhotoUrls,
      overlay.outgoingPhotoUrls,
    ),
  };
}

function mergeRoutineIssue(
  base: RoutineAreaIssueDraft,
  overlay: Partial<RoutineAreaIssueDraft> | undefined,
): RoutineAreaIssueDraft {
  if (!overlay) return base;
  const photosBySection = { ...base.photosBySection };
  for (const section of new Set([
    ...Object.keys(base.photosBySection),
    ...Object.keys(overlay.photosBySection ?? {}),
  ])) {
    photosBySection[section] = mergeSectionPhotos(
      base.photosBySection[section] ?? emptySectionPhotos(),
      overlay.photosBySection?.[section],
    );
  }
  return {
    available: overlay.available ?? base.available,
    notes: overlay.notes || base.notes,
    activeSections:
      overlay.activeSections && overlay.activeSections.length > 0
        ? overlay.activeSections
        : base.activeSections,
    photosBySection,
  };
}

function mergeOutgoingIssue(
  base: OutgoingAreaIssueDraft,
  overlay: Partial<OutgoingAreaIssueDraft> | undefined,
): OutgoingAreaIssueDraft {
  if (!overlay) return base;
  const photosBySection = { ...base.photosBySection };
  for (const section of new Set([
    ...Object.keys(base.photosBySection),
    ...Object.keys(overlay.photosBySection ?? {}),
  ])) {
    photosBySection[section] = mergeSectionPhotos(
      base.photosBySection[section] ?? emptySectionPhotos(),
      overlay.photosBySection?.[section],
    );
  }
  return {
    available: overlay.available ?? base.available,
    note: overlay.note || base.note,
    responsibility: overlay.responsibility || base.responsibility,
    activeSections:
      overlay.activeSections && overlay.activeSections.length > 0
        ? overlay.activeSections
        : base.activeSections,
    photosBySection,
  };
}

export function applyIngoingDetailPhotos(
  entries: Record<string, IngoingAreaEntryDraft>,
  detail: InspectorInspectionDetail,
  customAreas: CustomAreaDefinition[] = [],
): Record<string, IngoingAreaEntryDraft> {
  const next = { ...entries };
  for (const def of buildEffectiveAreaCatalog(customAreas)) {
    if (!next[def.name]) next[def.name] = emptyIngoingEntry(def.name, customAreas);
  }

  for (const area of detail.areas) {
    const rawName = area.name?.trim() ?? '';
    const photos = areaPhotoUrls(area);
    const parsed = parseSectionAreaName(
      rawName.replace(INGOING_SUFFIX, '').replace(OUTGOING_SUFFIX, '').trim(),
    );

    if (parsed) {
      const current = next[parsed.area] ?? emptyIngoingEntry(parsed.area, customAreas);
      const photosBySection = { ...current.photosBySection };
      if (photos.length > 0) {
        photosBySection[parsed.section] = mergePhotoUrlLists(
          photosBySection[parsed.section],
          photos,
        );
      }
      next[parsed.area] = {
        ...current,
        available: current.available ?? (photos.length > 0 ? true : null),
        activeSections: photos.length
          ? [...new Set([...current.activeSections, parsed.section])]
          : current.activeSections,
        photosBySection,
      };
      continue;
    }

    const known =
      INSPECTION_AREA_CATALOG.some((def) => def.name === rawName) ||
      customAreas.some((custom) => custom.name.trim() === rawName) ||
      Boolean(next[rawName]);
    if (!known) continue;
    const current = next[rawName] ?? emptyIngoingEntry(rawName, customAreas);
    next[rawName] = {
      ...current,
      available: current.available ?? true,
      condition: current.condition || conditionFromRating(area),
      comments: current.comments || notesFromArea(area),
    };
  }

  return next;
}

export function applyRoutineDetailPhotos(
  issues: Record<string, RoutineAreaIssueDraft>,
  detail: InspectorInspectionDetail,
): Record<string, RoutineAreaIssueDraft> {
  const next = { ...issues };
  for (const area of detail.areas) {
    const rawName = area.name?.trim() ?? '';
    if (INGOING_SUFFIX.test(rawName) || OUTGOING_SUFFIX.test(rawName)) continue;
    const photos = areaPhotoUrls(area);
    if (photos.length === 0) continue;

    const parsed = parseSectionAreaName(rawName);
    if (!parsed) continue;

    const current = next[parsed.area] ?? emptyRoutineIssue(parsed.area);
    const photosBySection = { ...current.photosBySection };
    const sectionPhotos = photosBySection[parsed.section] ?? emptySectionPhotos();
    photosBySection[parsed.section] = {
      ...sectionPhotos,
      outgoingPhotoUrls: mergePhotoUrlLists(sectionPhotos.outgoingPhotoUrls, photos),
    };
    next[parsed.area] = {
      ...current,
      available: current.available ?? true,
      activeSections: [...new Set([...current.activeSections, parsed.section])],
      photosBySection,
    };
  }
  return next;
}

export function applyOutgoingDetailPhotos(
  issues: Record<string, OutgoingAreaIssueDraft>,
  detail: InspectorInspectionDetail,
  customAreas: CustomAreaDefinition[] = [],
): Record<string, OutgoingAreaIssueDraft> {
  const next = { ...issues };

  for (const area of detail.areas) {
    const rawName = area.name?.trim() ?? '';
    const photos = areaPhotoUrls(area);
    if (photos.length === 0 && !area.items.some((item) => item.flagged)) continue;

    if (INGOING_SUFFIX.test(rawName) || OUTGOING_SUFFIX.test(rawName)) {
      const stripped = rawName
        .replace(INGOING_SUFFIX, '')
        .replace(OUTGOING_SUFFIX, '')
        .trim();
      const parsed = parseSectionAreaName(stripped);
      const room = parsed?.area ?? stripped;
      const section = parsed?.section;
      if (!room) continue;

      const current = next[room] ?? emptyOutgoingIssue(room, undefined, customAreas);
      const photosBySection = { ...current.photosBySection };
      const sectionKey = section ?? current.activeSections[0] ?? 'General';
      const sectionPhotos = photosBySection[sectionKey] ?? emptySectionPhotos();
      const key = INGOING_SUFFIX.test(rawName)
        ? 'ingoingPhotoUrls'
        : 'outgoingPhotoUrls';
      photosBySection[sectionKey] = {
        ...sectionPhotos,
        [key]: mergePhotoUrlLists(sectionPhotos[key], photos),
      };
      next[room] = {
        ...current,
        available: current.available ?? true,
        activeSections: section
          ? [...new Set([...current.activeSections, section])]
          : current.activeSections,
        photosBySection,
      };
      continue;
    }

    const parsed = parseSectionAreaName(rawName);
    if (parsed) {
      const current = next[parsed.area] ?? emptyOutgoingIssue(parsed.area, undefined, customAreas);
      const photosBySection = { ...current.photosBySection };
      const sectionPhotos = photosBySection[parsed.section] ?? emptySectionPhotos();
      photosBySection[parsed.section] = {
        ...sectionPhotos,
        outgoingPhotoUrls: mergePhotoUrlLists(sectionPhotos.outgoingPhotoUrls, photos),
      };
      next[parsed.area] = {
        ...current,
        available: current.available ?? true,
        note: current.note || notesFromArea(area),
        activeSections: [...new Set([...current.activeSections, parsed.section])],
        photosBySection,
      };
      continue;
    }

    const known =
      INSPECTION_AREA_CATALOG.some((def) => def.name === rawName) ||
      customAreas.some((custom) => custom.name.trim() === rawName) ||
      Boolean(next[rawName]);
    if (!known) continue;
    const current = next[rawName] ?? emptyOutgoingIssue(rawName, undefined, customAreas);
    const issueItem = area.items.find((item) => item.name === 'Issue');
    next[rawName] = {
      ...current,
      available: current.available ?? true,
      note: current.note || issueItem?.comment?.trim() || notesFromArea(area),
      responsibility:
        current.responsibility ||
        issueItem?.conditionTags?.[0]?.trim() ||
        '',
    };
  }

  return next;
}

export function mergeIngoingExecutionDraft(
  baseline: IngoingExecutionDraft,
  saved: Partial<IngoingExecutionDraft> | null | undefined,
): IngoingExecutionDraft {
  if (!saved) return baseline;
  const customAreas = saved.customAreas ?? baseline.customAreas ?? [];
  const entries = { ...baseline.entries };
  for (const def of buildEffectiveAreaCatalog(customAreas)) {
    entries[def.name] = mergeIngoingEntry(
      baseline.entries[def.name] ?? emptyIngoingEntry(def.name, customAreas),
      saved.entries?.[def.name],
    );
  }
  for (const [name, entry] of Object.entries(saved.entries ?? {})) {
    if (entries[name]) continue;
    entries[name] = mergeIngoingEntry(
      emptyIngoingEntry(name, customAreas),
      entry,
    );
  }
  return {
    kind: 'ingoing',
    areaIndex:
      typeof saved.areaIndex === 'number' ? saved.areaIndex : baseline.areaIndex,
    entries,
    customAreas,
    selectedAreaNames: saved.selectedAreaNames ?? baseline.selectedAreaNames,
    areaSetupComplete: saved.areaSetupComplete ?? baseline.areaSetupComplete,
  };
}

export function mergeRoutineExecutionDraft(
  baseline: RoutineExecutionDraft,
  saved: Partial<RoutineExecutionDraft> | null | undefined,
): RoutineExecutionDraft {
  if (!saved) return baseline;
  const issues = { ...baseline.issues };
  for (const def of INSPECTION_AREA_CATALOG) {
    issues[def.name] = mergeRoutineIssue(
      baseline.issues[def.name] ?? emptyRoutineIssue(def.name),
      saved.issues?.[def.name],
    );
  }
  return {
    kind: 'routine',
    areaIndex:
      typeof saved.areaIndex === 'number' ? saved.areaIndex : baseline.areaIndex,
    method: saved.method ?? baseline.method,
    issues,
    customAreas: saved.customAreas ?? baseline.customAreas,
    selectedAreaNames: saved.selectedAreaNames ?? baseline.selectedAreaNames,
    areaSetupComplete: saved.areaSetupComplete ?? baseline.areaSetupComplete,
  };
}

export function mergeOutgoingExecutionDraft(
  baseline: OutgoingExecutionDraft,
  saved: Partial<OutgoingExecutionDraft> | null | undefined,
): OutgoingExecutionDraft {
  if (!saved) return baseline;
  const customAreas = saved.customAreas ?? baseline.customAreas ?? [];
  const issues = { ...baseline.issues };
  for (const def of buildEffectiveAreaCatalog(customAreas)) {
    issues[def.name] = mergeOutgoingIssue(
      baseline.issues[def.name] ??
        emptyOutgoingIssue(def.name, {
          available: null,
          activeSections: [...def.defaultSections],
        }, customAreas),
      saved.issues?.[def.name],
    );
  }
  for (const [name, issue] of Object.entries(saved.issues ?? {})) {
    if (issues[name]) continue;
    issues[name] = mergeOutgoingIssue(
      emptyOutgoingIssue(name, undefined, customAreas),
      issue,
    );
  }
  return {
    kind: 'outgoing',
    areaIndex:
      typeof saved.areaIndex === 'number' ? saved.areaIndex : baseline.areaIndex,
    issues,
    customAreas,
    selectedAreaNames: saved.selectedAreaNames ?? baseline.selectedAreaNames,
    areaSetupComplete: saved.areaSetupComplete ?? baseline.areaSetupComplete,
  };
}
