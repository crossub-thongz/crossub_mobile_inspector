'use client';

import { useId, useRef, useState } from 'react';
import { ImagePlus, X } from 'lucide-react';

import { NativeCameraSnapButton } from '@/components/inspector/native-camera-snap-button';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { IMAGE_UPLOAD_ACCEPT } from '@/lib/compress-image';
import { cn } from '@/lib/utils';

type InspectionAreaPhotosFieldProps = {
  label?: string;
  photoUrls: string[];
  uploading?: boolean;
  disabled?: boolean;
  emptyLabel?: string;
  /** Stable id for the keep-shooting camera sheet (usually the area name). */
  sessionKey?: string;
  onAddFiles: (files: File[]) => void | Promise<void>;
  onAddDataUrl?: (dataUrl: string) => void | Promise<void>;
  onAddDataUrls?: (dataUrls: string[]) => void | Promise<void>;
  onRemove?: (index: number) => void;
};

export function InspectionAreaPhotosField({
  label = 'Photos',
  photoUrls,
  uploading = false,
  disabled = false,
  emptyLabel = 'Add at least one photo for this area.',
  sessionKey,
  onAddFiles,
  onAddDataUrls,
  onRemove,
}: InspectionAreaPhotosFieldProps) {
  const uploadId = useId();
  const uploadRef = useRef<HTMLInputElement>(null);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files?.length || disabled) return;
    void onAddFiles(Array.from(files));
  };

  const previewUrl = previewIndex != null ? photoUrls[previewIndex] : null;

  return (
    <div className="space-y-2">
      <Label>{label}</Label>

      {!disabled && (
        <div className="flex gap-2">
          <NativeCameraSnapButton
            disabled={disabled}
            uploading={uploading}
            sessionKey={sessionKey ?? label}
            onFiles={handleFiles}
            onDataUrls={onAddDataUrls}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="flex-1"
            disabled={disabled}
            onClick={() => {
              if (disabled) return;
              uploadRef.current?.click();
            }}
          >
            <ImagePlus className="size-4" />
            Upload
          </Button>
        </div>
      )}

      <input
        id={uploadId}
        ref={uploadRef}
        type="file"
        accept={IMAGE_UPLOAD_ACCEPT}
        multiple
        className="sr-only"
        tabIndex={-1}
        disabled={disabled}
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = '';
        }}
      />

      {photoUrls.length === 0 ? (
        <p className="text-muted-foreground text-xs">{emptyLabel}</p>
      ) : (
        <ul className="grid grid-cols-3 gap-2">
          {photoUrls.map((url, index) => (
            <li
              key={`${url.slice(0, 32)}-${index}`}
              className="relative aspect-square overflow-hidden rounded-lg border border-border bg-secondary/30"
            >
              <button
                type="button"
                onClick={() => setPreviewIndex(index)}
                className="size-full"
                aria-label={`View photo ${index + 1}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={`Photo ${index + 1}`}
                  className="size-full object-cover"
                />
              </button>
              {!disabled && onRemove ? (
                <button
                  type="button"
                  onClick={() => onRemove(index)}
                  className={cn(
                    'absolute top-1 right-1 flex size-6 items-center justify-center',
                    'rounded-full bg-background/90 text-foreground shadow-sm',
                  )}
                  aria-label="Remove photo"
                >
                  <X className="size-3.5" />
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {previewUrl ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Photo preview"
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
            alt="Photo preview"
            className="max-h-[85vh] max-w-full rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      ) : null}
    </div>
  );
}
