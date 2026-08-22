'use client';

import { useId, useState } from 'react';
import { Camera } from 'lucide-react';

import { KeyCameraCapture } from '@/components/inspector/key-camera-capture';
import { dataUrlToFile, IMAGE_UPLOAD_ACCEPT } from '@/lib/compress-image';
import { cn } from '@/lib/utils';

type NativeCameraSnapButtonProps = {
  disabled?: boolean;
  uploading?: boolean;
  multiple?: boolean;
  label?: string;
  className?: string;
  sessionKey?: string;
  onFiles: (files: FileList | null) => void;
  onDataUrls?: (urls: string[]) => void;
};

function filesFromDataUrls(urls: string[]): FileList | null {
  const transfer = new DataTransfer();
  urls.forEach((url, index) => {
    const file = dataUrlToFile(url, `snap-${Date.now()}-${index}.jpg`);
    if (file) transfer.items.add(file);
  });
  return transfer.files.length ? transfer.files : null;
}

/**
 * In-app burst camera: snap many photos in one session, with 0.5× / 1× / 2×
 * and pinch-zoom when the phone exposes those lenses. Falls back to the
 * native Camera app if getUserMedia is blocked.
 */
export function NativeCameraSnapButton({
  disabled = false,
  uploading = false,
  label = 'Snap photos',
  className,
  onFiles,
  onDataUrls,
}: NativeCameraSnapButtonProps) {
  const nativeId = useId();
  const [open, setOpen] = useState(false);

  const takeFiles = (files: FileList | null) => {
    if (!files?.length) return;
    onFiles(files);
  };

  const takeDataUrls = (urls: string[]) => {
    if (!urls.length) return;
    if (onDataUrls) {
      onDataUrls(urls);
      return;
    }
    takeFiles(filesFromDataUrls(urls));
  };

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (disabled) return;
          setOpen(true);
        }}
        className={cn(
          'inline-flex flex-1 cursor-pointer items-center justify-center gap-2',
          'rounded-md border border-input bg-background px-3 text-sm font-medium',
          'shadow-xs hover:bg-accent hover:text-accent-foreground',
          'h-8',
          disabled && 'pointer-events-none opacity-60',
          className,
        )}
      >
        <Camera className="size-4" />
        {uploading ? 'Uploading…' : label}
      </button>

      <input
        id={nativeId}
        type="file"
        accept={IMAGE_UPLOAD_ACCEPT}
        capture="environment"
        className="sr-only"
        tabIndex={-1}
        disabled={disabled}
        onChange={(event) => {
          takeFiles(event.target.files);
          event.target.value = '';
        }}
      />

      <KeyCameraCapture
        open={open}
        captureMode="burst"
        nativeInputId={nativeId}
        onClose={() => setOpen(false)}
        onCapture={(dataUrl) => takeDataUrls([dataUrl])}
        onBurstComplete={(urls) => takeDataUrls(urls)}
      />
    </>
  );
}
