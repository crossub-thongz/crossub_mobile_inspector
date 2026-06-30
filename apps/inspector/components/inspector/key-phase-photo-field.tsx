'use client';

import { useId, useRef, useState } from 'react';
import { Camera, ImagePlus, X } from 'lucide-react';
import { toast } from 'sonner';

import { KeyCameraCapture } from '@/components/inspector/key-camera-capture';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

const MAX_PHOTOS = 5;

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

export function KeyPhasePhotoField({
  label = 'Proof photos',
  photos,
  onChange,
  disabled = false,
}: {
  label?: string;
  photos: string[];
  onChange: (photos: string[]) => void;
  disabled?: boolean;
}) {
  const uploadId = useId();
  const nativeCameraId = useId();
  const nativeCameraRef = useRef<HTMLInputElement>(null);
  const [cameraOpen, setCameraOpen] = useState(false);

  const addDataUrl = (dataUrl: string) => {
    if (disabled) return;
    if (photos.length >= MAX_PHOTOS) {
      toast.error(`Maximum ${MAX_PHOTOS} photos`);
      return;
    }
    onChange([...photos, dataUrl]);
  };

  const addFiles = async (files: FileList | null) => {
    if (!files?.length || disabled) return;
    const remaining = MAX_PHOTOS - photos.length;
    if (remaining <= 0) {
      toast.error(`Maximum ${MAX_PHOTOS} photos`);
      return;
    }
    const picked = Array.from(files).slice(0, remaining);
    try {
      const urls = await Promise.all(picked.map(readFileAsDataUrl));
      onChange([...photos, ...urls]);
    } catch {
      toast.error('Could not read one of the photos');
    }
  };

  const removeAt = (index: number) => {
    if (disabled) return;
    onChange(photos.filter((_, i) => i !== index));
  };

  const openSnap = () => {
    if (disabled) return;
    if (photos.length >= MAX_PHOTOS) {
      toast.error(`Maximum ${MAX_PHOTOS} photos`);
      return;
    }
    // Prefer live camera preview (works on desktop webcam + mobile with permission).
    if (typeof navigator.mediaDevices?.getUserMedia === 'function') {
      setCameraOpen(true);
      return;
    }
    // Fallback: native picker / camera sheet (must be a direct label tap, not .click()).
    nativeCameraRef.current?.click();
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
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
            Snap photo
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

      {/* Native camera fallback — sr-only (not display:none) so mobile Safari allows it */}
      <input
        id={nativeCameraId}
        ref={nativeCameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => {
          void addFiles(e.target.files);
          e.target.value = '';
        }}
      />
      <input
        id={uploadId}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => {
          void addFiles(e.target.files);
          e.target.value = '';
        }}
      />

      <KeyCameraCapture
        open={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onCapture={addDataUrl}
        nativeInputId={nativeCameraId}
      />

      {photos.length === 0 ? (
        <p className="text-muted-foreground text-xs">
          {disabled ? 'No photos recorded.' : 'Add at least one photo to continue.'}
        </p>
      ) : (
        <ul className="grid grid-cols-3 gap-2">
          {photos.map((url, index) => (
            <li
              key={`${url.slice(0, 32)}-${index}`}
              className="relative aspect-square overflow-hidden rounded-lg border border-border bg-secondary/30"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={`Proof ${index + 1}`}
                className="size-full object-cover"
              />
              {!disabled && (
                <button
                  type="button"
                  onClick={() => removeAt(index)}
                  className={cn(
                    'absolute top-1 right-1 flex size-6 items-center justify-center',
                    'rounded-full bg-background/90 text-foreground shadow-sm',
                  )}
                  aria-label="Remove photo"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
