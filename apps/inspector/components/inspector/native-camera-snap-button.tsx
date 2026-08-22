'use client';

import { useEffect, useId, useState } from 'react';
import { createPortal } from 'react-dom';
import { Camera, Check } from 'lucide-react';

import { IMAGE_UPLOAD_ACCEPT } from '@/lib/compress-image';
import { cn } from '@/lib/utils';

type NativeCameraSnapButtonProps = {
  disabled?: boolean;
  uploading?: boolean;
  /** When true, after each native shot we offer Snap another for the same area. */
  multiple?: boolean;
  label?: string;
  className?: string;
  /** Reset the keep-shooting sheet when the area (or slot) changes. */
  sessionKey?: string;
  onFiles: (files: FileList | null) => void;
};

/**
 * Opens the phone's native Camera app (`capture="environment"`) so wide-angle
 * and zoom controls stay available. In-app getUserMedia previews cannot do that.
 *
 * `capture` and `multiple` cannot be combined on iOS/Android — the camera
 * returns one photo. For one area we keep the native camera, then show a
 * keep-shooting sheet so the next tap is a real gesture (programmatic
 * re-open is blocked after the camera dismisses).
 */
export function NativeCameraSnapButton({
  disabled = false,
  uploading = false,
  multiple = true,
  label = 'Snap photos',
  className,
  sessionKey,
  onFiles,
}: NativeCameraSnapButtonProps) {
  const startId = useId();
  const nextId = useId();
  const [shotCount, setShotCount] = useState(0);
  const [sessionOpen, setSessionOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setSessionOpen(false);
    setShotCount(0);
  }, [sessionKey]);

  const takeFiles = (files: FileList | null) => {
    if (!files?.length) return;
    onFiles(files);
    if (!multiple) return;
    setShotCount((count) => count + files.length);
    setSessionOpen(true);
  };

  return (
    <>
      <label
        htmlFor={startId}
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
        {uploading && !sessionOpen ? 'Uploading…' : label}
        <input
          id={startId}
          type="file"
          accept={IMAGE_UPLOAD_ACCEPT}
          capture="environment"
          className="sr-only"
          disabled={disabled}
          onChange={(event) => {
            takeFiles(event.target.files);
            event.target.value = '';
          }}
        />
      </label>

      {mounted && sessionOpen
        ? createPortal(
            <div className="fixed inset-x-0 bottom-0 z-[80] border-t border-border bg-background/95 px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_-12px_40px_rgba(0,0,0,0.18)] backdrop-blur-md">
              <p className="text-sm font-medium text-foreground">
                {shotCount} photo{shotCount === 1 ? '' : 's'} added to this area
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Keep using the phone camera’s wide-angle or zoom. Snap another, or
                Done when this area is covered.
              </p>
              <div className="mt-3 flex gap-2">
                <label
                  htmlFor={nextId}
                  className={cn(
                    'inline-flex h-10 flex-1 cursor-pointer items-center justify-center gap-2',
                    'rounded-md border border-input bg-background px-3 text-sm font-medium',
                    'shadow-xs hover:bg-accent hover:text-accent-foreground',
                  )}
                >
                  <Camera className="size-4" />
                  Snap another
                  <input
                    id={nextId}
                    type="file"
                    accept={IMAGE_UPLOAD_ACCEPT}
                    capture="environment"
                    className="sr-only"
                    onChange={(event) => {
                      takeFiles(event.target.files);
                      event.target.value = '';
                    }}
                  />
                </label>
                <button
                  type="button"
                  className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground shadow-xs"
                  onClick={() => {
                    setSessionOpen(false);
                    setShotCount(0);
                  }}
                >
                  <Check className="size-4" />
                  Done
                </button>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
