'use client';

import { Camera, Plus, X } from 'lucide-react';
import { useId, useRef, useState } from 'react';

import { NativeCameraSnapButton } from '@/components/inspector/native-camera-snap-button';
import { Button } from '@/components/ui/button';
import { IMAGE_UPLOAD_ACCEPT } from '@/lib/compress-image';

type InspectionAreaPhotosFieldProps = {
  label?: string;
  photoUrls: string[];
  uploading?: boolean;
  disabled?: boolean;
  emptyLabel?: string;
  sessionKey?: string;
  compact?: boolean;
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
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium">
          {label}
          {photoUrls.length > 0 ? (
            <span className="bg-primary/20 text-primary ml-2 inline-flex min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-semibold">
              {photoUrls.length}
            </span>
          ) : null}
        </p>
      </div>

      {!disabled && (
        <div className="flex gap-2">
          <NativeCameraSnapButton
            disabled={disabled}
            uploading={uploading}
            sessionKey={sessionKey ?? label}
            label="Take photos"
            className="bg-primary text-primary-foreground hover:bg-primary/90 h-10 flex-[2] border-0"
            onFiles={handleFiles}
            onDataUrls={onAddDataUrls}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-10 flex-1"
            disabled={disabled}
            onClick={() => uploadRef.current?.click()}
          >
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
        <button
          type="button"
          disabled={disabled}
          onClick={() => uploadRef.current?.click()}
          className="border-border text-muted-foreground flex w-full items-center justify-center gap-2 rounded-lg border border-dashed py-6 text-xs"
        >
          <Plus className="size-4" />
          {emptyLabel}
        </button>
      ) : (
        <ul className="grid w-full grid-cols-3 gap-2">
          {photoUrls.map((url, index) => (
            <li
              key={`${url.slice(0, 32)}-${index}`}
              className="relative aspect-square min-w-0 overflow-hidden rounded-lg border border-border bg-secondary/30"
            >
              <button
                type="button"
                onClick={() => setPreviewIndex(index)}
                className="size-full"
                aria-label={`View photo ${index + 1}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`Photo ${index + 1}`} className="size-full object-cover" />
              </button>
              {!disabled && onRemove ? (
                <button
                  type="button"
                  onClick={() => onRemove(index)}
                  className="absolute top-1 right-1 flex size-5 items-center justify-center rounded-full bg-black/70 text-white"
                  aria-label="Remove photo"
                >
                  <X className="size-3" />
                </button>
              ) : null}
            </li>
          ))}
          {!disabled ? (
            <li className="min-w-0">
              <button
                type="button"
                onClick={() => uploadRef.current?.click()}
                className="border-border text-muted-foreground flex aspect-square w-full items-center justify-center rounded-lg border border-dashed"
                aria-label="Add photo"
              >
                <Camera className="size-5" />
              </button>
            </li>
          ) : null}
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
