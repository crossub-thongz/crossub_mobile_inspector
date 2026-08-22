'use client';

import { useId, useRef, useState } from 'react';
import { ImagePlus, X } from 'lucide-react';

import { NativeCameraSnapButton } from '@/components/inspector/native-camera-snap-button';
import { Button } from '@/components/ui/button';
import { IMAGE_UPLOAD_ACCEPT } from '@/lib/compress-image';
import { cn } from '@/lib/utils';

type BeforeAfterPhotoColumnProps = {
  title: string;
  photoUrls: string[];
  uploading?: boolean;
  disabled?: boolean;
  onAddFiles: (files: File[]) => void | Promise<void>;
  onAddDataUrl?: (dataUrl: string) => void | Promise<void>;
  onAddDataUrls?: (dataUrls: string[]) => void | Promise<void>;
  onRemove?: (index: number) => void;
};

export function BeforeAfterPhotoColumn({
  title,
  photoUrls,
  uploading = false,
  disabled = false,
  onAddFiles,
  onRemove,
}: BeforeAfterPhotoColumnProps) {
  const uploadId = useId();
  const uploadRef = useRef<HTMLInputElement>(null);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);

  const blocked = disabled || uploading;
  const primaryUrl = photoUrls[0];

  const handleFiles = (files: FileList | null) => {
    if (!files?.length || blocked) return;
    void onAddFiles(Array.from(files));
  };

  const previewUrl = previewIndex != null ? photoUrls[previewIndex] : null;

  return (
    <div className="space-y-2">
      <div
        className={cn(
          'relative flex aspect-square items-center justify-center overflow-hidden rounded-lg border border-dashed p-2',
          primaryUrl ? 'border-border bg-secondary/30' : 'border-border/80',
        )}
      >
        {primaryUrl ? (
          <button
            type="button"
            onClick={() => setPreviewIndex(0)}
            className="size-full"
            aria-label={`View ${title}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={primaryUrl}
              alt={title}
              className="size-full rounded-md object-cover"
            />
          </button>
        ) : (
          <span className="px-2 text-center text-xs text-muted-foreground">{title}</span>
        )}
        {primaryUrl && !disabled && onRemove ? (
          <button
            type="button"
            onClick={() => onRemove(0)}
            className="absolute top-1.5 right-1.5 flex size-6 items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm"
            aria-label="Remove photo"
          >
            <X className="size-3.5" />
          </button>
        ) : null}
      </div>

      {!disabled && (
        <div className="flex flex-col gap-1.5">
          <NativeCameraSnapButton
            disabled={blocked}
            uploading={uploading}
            className="w-full flex-none"
            onFiles={handleFiles}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full"
            disabled={blocked}
            onClick={() => {
              if (blocked) return;
              uploadRef.current?.click();
            }}
          >
            <ImagePlus className="size-4" />
            Upload
          </Button>
        </div>
      )}

      {photoUrls.length > 1 ? (
        <ul className="grid grid-cols-3 gap-1">
          {photoUrls.slice(1).map((url, index) => (
            <li
              key={`${url.slice(0, 24)}-${index + 1}`}
              className="relative aspect-square overflow-hidden rounded border border-border"
            >
              <button
                type="button"
                onClick={() => setPreviewIndex(index + 1)}
                className="size-full"
                aria-label={`View ${title} ${index + 2}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="size-full object-cover" />
              </button>
              {!disabled && onRemove ? (
                <button
                  type="button"
                  onClick={() => onRemove(index + 1)}
                  className="absolute top-0.5 right-0.5 flex size-5 items-center justify-center rounded-full bg-background/90"
                  aria-label="Remove photo"
                >
                  <X className="size-3" />
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}

      <input
        id={uploadId}
        ref={uploadRef}
        type="file"
        accept={IMAGE_UPLOAD_ACCEPT}
        multiple
        className="sr-only"
        tabIndex={-1}
        disabled={blocked}
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = '';
        }}
      />

      {previewUrl ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`${title} preview`}
          onClick={() => setPreviewIndex(null)}
        >
          <button
            type="button"
            onClick={() => setPreviewIndex(null)}
            className="absolute top-4 right-4 flex size-9 items-center justify-center rounded-full bg-white/10 text-white"
            aria-label="Close preview"
          >
            <X className="size-5" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt={`${title} preview`}
            className="max-h-[85vh] max-w-full rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      ) : null}
    </div>
  );
}
