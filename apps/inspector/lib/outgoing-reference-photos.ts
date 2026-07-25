import type { InspectorInspectionDetail } from '@/lib/crossub-api/inspector-client';
import { parseSectionAreaName, sectionAreaName } from '@/constants/inspection-areas';
import {
  resolveAreaDefinition,
  type CustomAreaDefinition,
} from '@/lib/custom-inspection-areas';
import {
  buildOutgoingIssueSeed,
  outgoingSectionsForRoom,
  type IngoingAreaPlan,
} from '@/lib/ingoing-area-plan';
import {
  emptyOutgoingIssue,
  type OutgoingAreaIssueDraft,
} from '@/lib/inspection-execution-hydration';

const INGOING_SUFFIX = /\s*\(ingoing\)\s*$/i;
const OUTGOING_SUFFIX = /\s*\(outgoing\)\s*$/i;

function normalizeAreaKey(name: string): string {
  return name
    .replace(INGOING_SUFFIX, '')
    .replace(OUTGOING_SUFFIX, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

/** Match an outgoing UI room name to photos from the reference INGOING report. */
export function matchReferenceIngoingPhotos(
  roomName: string,
  referenceAreas: Array<{ name: string; photos: Array<{ url: string }> }>,
): string[] {
  const target = normalizeAreaKey(roomName);
  if (!target) return [];

  const exact = referenceAreas.find((area) => normalizeAreaKey(area.name) === target);
  if (exact) return exact.photos.map((p) => p.url).filter(Boolean);

  const startsWith = referenceAreas.find((area) => {
    const key = normalizeAreaKey(area.name);
    return key.startsWith(target) || target.startsWith(key);
  });
  if (startsWith) return startsWith.photos.map((p) => p.url).filter(Boolean);

  const contains = referenceAreas.find((area) => {
    const key = normalizeAreaKey(area.name);
    return key.includes(target) || target.includes(key);
  });
  return contains ? contains.photos.map((p) => p.url).filter(Boolean) : [];
}

/**
 * Match reference photos for a room section (`Room · Section`), falling back to
 * room-level photos when the prior report was area-only.
 */
export function matchReferenceSectionPhotos(
  roomName: string,
  section: string,
  referenceAreas: Array<{ name: string; photos: Array<{ url: string }> }>,
): string[] {
  const sectionTarget = normalizeAreaKey(sectionAreaName(roomName, section));
  const exactSection = referenceAreas.find(
    (area) => normalizeAreaKey(area.name) === sectionTarget,
  );
  if (exactSection) {
    return exactSection.photos.map((p) => p.url).filter(Boolean);
  }

  for (const area of referenceAreas) {
    const parsed = parseSectionAreaName(area.name.replace(INGOING_SUFFIX, '').trim());
    if (!parsed) continue;
    if (
      normalizeAreaKey(parsed.area) === normalizeAreaKey(roomName) &&
      normalizeAreaKey(parsed.section) === normalizeAreaKey(section)
    ) {
      return area.photos.map((p) => p.url).filter(Boolean);
    }
  }

  return matchReferenceIngoingPhotos(roomName, referenceAreas);
}

/** Fill empty ingoing photo slots from the latest completed ingoing report. */
export function seedOutgoingIssuesFromReference(
  issues: Record<string, OutgoingAreaIssueDraft>,
  options: {
    referenceAreas: Array<{ name: string; photos: Array<{ url: string }> }>;
    plan: IngoingAreaPlan | null;
    customAreas: CustomAreaDefinition[];
    areaNames: string[];
  },
): { issues: Record<string, OutgoingAreaIssueDraft>; seeded: boolean } {
  if (options.referenceAreas.length === 0) {
    return { issues, seeded: false };
  }

  let seeded = false;
  const next = { ...issues };

  for (const areaName of options.areaNames) {
    const def = resolveAreaDefinition(areaName, options.customAreas);
    const existing = next[areaName];
    const seed = buildOutgoingIssueSeed(def, options.plan);
    const sectionsToSeed =
      existing?.activeSections && existing.activeSections.length > 0
        ? existing.activeSections
        : seed.available === true
          ? seed.activeSections
          : outgoingSectionsForRoom(options.plan, areaName);

    if (sectionsToSeed.length === 0) continue;

    const photosBySection = { ...(existing?.photosBySection ?? {}) };
    let areaSeeded = false;
    for (const section of sectionsToSeed) {
      const current = photosBySection[section];
      if ((current?.ingoingPhotoUrls.length ?? 0) > 0) continue;
      const referenceUrls = matchReferenceSectionPhotos(
        areaName,
        section,
        options.referenceAreas,
      );
      if (referenceUrls.length === 0) continue;
      photosBySection[section] = {
        ingoingPhotoUrls: referenceUrls,
        outgoingPhotoUrls: current?.outgoingPhotoUrls ?? [],
      };
      areaSeeded = true;
      seeded = true;
    }

    if (areaSeeded || existing) {
      next[areaName] = {
        ...(existing ?? emptyOutgoingIssue(areaName, seed, options.customAreas)),
        photosBySection,
      };
    }
  }

  return { issues: next, seeded };
}

export function referenceIngoingHasPhotos(
  referenceAreas: Array<{ name: string; photos: Array<{ url: string }> }>,
): boolean {
  return referenceAreas.some((area) => area.photos.length > 0);
}

/** Photos already saved on this OUTGOING job under `Room (Ingoing)` or `Room · Section (Ingoing)`. */
export function outgoingSavedIngoingPhotos(
  detail: InspectorInspectionDetail,
  roomName: string,
  section?: string,
): string[] {
  const target = section
    ? normalizeAreaKey(sectionAreaName(roomName, section))
    : normalizeAreaKey(roomName);
  const urls: string[] = [];
  for (const area of detail.areas) {
    const name = area.name?.trim() ?? '';
    if (!INGOING_SUFFIX.test(name)) continue;
    const key = normalizeAreaKey(name);
    if (section) {
      if (key !== target) continue;
    } else if (key !== target && !key.startsWith(`${target} ·`)) {
      continue;
    }
    for (const photo of area.photos ?? []) {
      if (photo.url) urls.push(photo.url);
    }
  }
  return urls;
}
