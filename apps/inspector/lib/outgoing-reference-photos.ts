import type { InspectorInspectionDetail } from '@/lib/crossub-api/inspector-client';

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

/** Photos already saved on this OUTGOING job under `Room (Ingoing)`. */
export function outgoingSavedIngoingPhotos(
  detail: InspectorInspectionDetail,
  roomName: string,
): string[] {
  const target = normalizeAreaKey(roomName);
  const urls: string[] = [];
  for (const area of detail.areas) {
    const name = area.name?.trim() ?? '';
    if (!INGOING_SUFFIX.test(name)) continue;
    if (normalizeAreaKey(name) !== target) continue;
    for (const photo of area.photos ?? []) {
      if (photo.url) urls.push(photo.url);
    }
  }
  return urls;
}
