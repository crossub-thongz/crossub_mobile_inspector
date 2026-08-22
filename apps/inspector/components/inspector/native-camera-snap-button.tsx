'use client';

import { Camera } from 'lucide-react';

import { IMAGE_UPLOAD_ACCEPT } from '@/lib/compress-image';
import { cn } from '@/lib/utils';

type NativeCameraSnapButtonProps = {
  disabled?: boolean;
  uploading?: boolean;
  multiple?: boolean;
  label?: string;
  className?: string;
  onFiles: (files: FileList | null) => void;
};

/**
 * Opens the phone's native Camera app (`capture="environment"`) so wide-angle
 * and zoom controls stay available. In-app getUserMedia previews cannot do that.
 */
export function NativeCameraSnapButton({
  disabled = false,
  uploading = false,
  multiple = true,
  label = 'Snap photos',
  className,
  onFiles,
}: NativeCameraSnapButtonProps) {
  return (
    <label
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
      <input
        type="file"
        accept={IMAGE_UPLOAD_ACCEPT}
        capture="environment"
        multiple={multiple}
        className="sr-only"
        disabled={disabled}
        onChange={(event) => {
          onFiles(event.target.files);
          event.target.value = '';
        }}
      />
    </label>
  );
}
