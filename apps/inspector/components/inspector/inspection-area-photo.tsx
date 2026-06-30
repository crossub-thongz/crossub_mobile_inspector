'use client';

import { useId, useState } from 'react';
import { Camera, CheckCircle2, ImagePlus, X } from 'lucide-react';
import { toast } from 'sonner';

import { KeyCameraCapture } from '@/components/inspector/key-camera-capture';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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

export function InspectionAreaPhotoRow({
  area,
  photoUrl,
  onChange,
  disabled = false,
}: {
  area: string;
  photoUrl?: string;
  onChange: (dataUrl: string | undefined) => void;
  disabled?: boolean;
}) {
  const uploadId = useId();
  const nativeCameraId = useId();
  const [cameraOpen, setCameraOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const addDataUrl = (dataUrl: string) => {
    if (disabled) return;
    onChange(dataUrl);
  };

  const addFile = async (files: FileList | null) => {
    if (!files?.length || disabled) return;
    try {
      onChange(await readFileAsDataUrl(files[0]));
    } catch {
      toast.error('Could not read the photo');
    }
  };

  const openSnap = () => {
    if (disabled) return;
    if (typeof navigator.mediaDevices?.getUserMedia === 'function') {
      setCameraOpen(true);
      return;
    }
    // Programmatic click is blocked on iOS — KeyCameraCapture falls back to a label tap.
    setCameraOpen(true);
  };

  return (
    <div
      className={cn(
        'space-y-2 rounded-lg border px-3 py-3',
        photoUrl ? 'border-primary bg-primary/10' : 'border-border',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-sm font-medium">
          {photoUrl && <CheckCircle2 className="text-primary size-4 shrink-0" />}
          {area}
        </span>
        {photoUrl && (
          <button
            type="button"
            onClick={() => setPreviewOpen(true)}
            className="size-11 shrink-0 overflow-hidden rounded-md border border-border bg-secondary/30 ring-offset-background transition hover:ring-2 hover:ring-primary/40"
            aria-label={`View ${area} photo`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photoUrl}
              alt={`${area} thumbnail`}
              className="size-full object-cover"
            />
          </button>
        )}
      </div>

      {!disabled && (
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={openSnap}
          >
            <Camera className="size-4" />
            {photoUrl ? 'Retake' : 'Snap photo'}
          </Button>
          <label
            htmlFor={uploadId}
            className={cn(
              'inline-flex flex-1 cursor-pointer items-center justify-center gap-2',
              'rounded-md border border-input bg-background px-3 text-sm font-medium',
              'shadow-xs hover:bg-accent hover:text-accent-foreground',
              'h-8',
            )}
          >
            <ImagePlus className="size-4" />
            Upload
          </label>
        </div>
      )}

      {photoUrl && !disabled && (
        <button
          type="button"
          onClick={() => onChange(undefined)}
          className="text-muted-foreground hover:text-foreground text-xs underline-offset-2 hover:underline"
        >
          Remove photo
        </button>
      )}

      <input
        id={nativeCameraId}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => {
          void addFile(e.target.files);
          e.target.value = '';
        }}
      />
      <input
        id={uploadId}
        type="file"
        accept="image/*"
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => {
          void addFile(e.target.files);
          e.target.value = '';
        }}
      />

      <KeyCameraCapture
        open={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onCapture={addDataUrl}
        nativeInputId={nativeCameraId}
      />

      {previewOpen && photoUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`${area} photo preview`}
          onClick={() => setPreviewOpen(false)}
        >
          <button
            type="button"
            onClick={() => setPreviewOpen(false)}
            className="absolute top-4 right-4 flex size-9 items-center justify-center rounded-full bg-white/10 text-white"
            aria-label="Close preview"
          >
            <X className="size-5" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photoUrl}
            alt={`${area} photo`}
            className="max-h-[85vh] max-w-full rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
