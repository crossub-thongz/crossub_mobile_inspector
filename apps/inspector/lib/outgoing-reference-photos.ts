import type { InspectorInspectionDetail } from '@/lib/crossub-api/inspector-client';
import { parseSectionAreaName, sectionAreaName } from '@/constants/inspection-areas';

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
