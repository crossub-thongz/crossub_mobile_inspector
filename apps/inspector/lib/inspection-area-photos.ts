import {
  compressImageForUpload,
  shrinkDataUrlForUpload,
} from '@/lib/compress-image';
import { sectionAreaName } from '@/constants/inspection-areas';

export function isPendingPhotoUrl(url: string): boolean {
  return url.startsWith('data:image/');
}

export function isPersistedPhotoUrl(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

export async function compressPhotoSources(
  sources: Array<File | string>,
): Promise<string[]> {
  return Promise.all(
    sources.map((source) =>
      source instanceof File
        ? compressImageForUpload(source)
        : shrinkDataUrlForUpload(source),
    ),
  );
}

export function pendingPhotoSources(urls: readonly string[]): string[] {
  return urls.filter(isPendingPhotoUrl);
}

/** Facade area name for incremental photo uploads during an inspection. */
export function inspectionPhotoAreaLabel(
  room: string,
  section: string,
  side: 'ingoing' | 'outgoing' | 'single',
): string {
  const base = sectionAreaName(room, section);
  if (side === 'ingoing') return `${base} (Ingoing)`;
  if (side === 'outgoing') return `${base} (Outgoing)`;
  return base;
}

export function inspectionAreaOverallPhotoLabel(room: string): string {
  return room;
}
