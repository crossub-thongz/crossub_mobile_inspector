import {
  compressImageForUpload,
  shrinkDataUrlForUpload,
} from '@/lib/compress-image';

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
