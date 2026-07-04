/**
 * Downscale + re-encode proof photos before base64 upload.
 * Staging (and default Express) JSON bodies cap at ~100 KB — we target ~80 KB base64.
 */
const MAX_BASE64_CHARS = 80_000;

/** Base64 payload length inside a data URL (excludes the `data:...;base64,` prefix). */
export function dataUrlBase64Length(dataUrl: string): number {
  const comma = dataUrl.indexOf(',');
  return comma >= 0 ? dataUrl.length - comma - 1 : dataUrl.length;
}

/** Re-encode an existing data URL if it exceeds the upload payload budget. */
export async function shrinkDataUrlForUpload(dataUrl: string): Promise<string> {
  if (!dataUrl.startsWith('data:image/')) return dataUrl;
  if (dataUrlBase64Length(dataUrl) <= MAX_BASE64_CHARS) return dataUrl;

  const objectUrl = dataUrl;
  try {
    const image = await loadImage(objectUrl);
    const canvas = document.createElement('canvas');
    const maxEdge = 1280;
    const longest = Math.max(image.width, image.height);
    const scale = longest > maxEdge ? maxEdge / longest : 1;
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));
    const ctx = canvas.getContext('2d');
    if (!ctx) return dataUrl;
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    return compressCanvasToDataUrl(canvas);
  } catch {
    return dataUrl;
  }
}

export async function compressImageForUpload(
  file: File,
  maxEdge = 1280,
): Promise<string> {
  if (!file.type.startsWith('image/')) {
    return readFileAsDataUrl(file);
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await loadImage(objectUrl);
    const longest = Math.max(image.width, image.height);
    const scale = longest > maxEdge ? maxEdge / longest : 1;
    const width = Math.max(1, Math.round(image.width * scale));
    const height = Math.max(1, Math.round(image.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return readFileAsDataUrl(file);
    ctx.drawImage(image, 0, 0, width, height);
    return compressCanvasToDataUrl(canvas);
  } catch {
    return readFileAsDataUrl(file);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

/** JPEG re-encode loop — keeps proof photos under the JSON body limit. */
export function compressCanvasToDataUrl(canvas: HTMLCanvasElement): string {
  let quality = 0.82;
  let dataUrl = canvas.toDataURL('image/jpeg', quality);

  while (dataUrlBase64Length(dataUrl) > MAX_BASE64_CHARS && quality > 0.35) {
    quality -= 0.08;
    dataUrl = canvas.toDataURL('image/jpeg', quality);
  }

  if (dataUrlBase64Length(dataUrl) <= MAX_BASE64_CHARS) {
    return dataUrl;
  }

  const smaller = document.createElement('canvas');
  smaller.width = Math.max(1, Math.round(canvas.width * 0.72));
  smaller.height = Math.max(1, Math.round(canvas.height * 0.72));
  const ctx = smaller.getContext('2d');
  if (!ctx) return dataUrl;
  ctx.drawImage(canvas, 0, 0, smaller.width, smaller.height);
  return compressCanvasToDataUrl(smaller);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not decode image'));
    img.src = src;
  });
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result);
      else reject(new Error('Failed to read photo'));
    };
    reader.onerror = () =>
      reject(reader.error ?? new Error('Failed to read photo'));
    reader.readAsDataURL(file);
  });
}
