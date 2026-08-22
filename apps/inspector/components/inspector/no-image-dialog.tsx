'use client';

import { ImageOff } from 'lucide-react';

import { Button } from '@/components/ui/button';

export function NoImageDialog({
  open,
  onClose,
  message = 'No photo has been added yet. Add at least one photo to continue.',
}: {
  open: boolean;
  onClose: () => void;
  message?: string;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="no-image-title"
      onClick={onClose}
    >
      <div
        className="border-border bg-card w-full max-w-xs rounded-2xl border p-6 text-center shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="bg-secondary mx-auto flex size-14 items-center justify-center rounded-full">
          <ImageOff className="text-muted-foreground size-7" />
        </div>
        <h2
          id="no-image-title"
          className="text-foreground mt-4 text-lg font-bold tracking-wide"
        >
          NO IMAGE
        </h2>
        <p className="text-muted-foreground mt-2 text-xs leading-relaxed">{message}</p>
        <Button type="button" className="mt-5 w-full" onClick={onClose}>
          OK
        </Button>
      </div>
    </div>
  );
}
