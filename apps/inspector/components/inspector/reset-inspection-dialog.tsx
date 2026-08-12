'use client';

import { Button } from '@/components/ui/button';

export function ResetInspectionDialog({
  open,
  title = 'Reset inspection?',
  description = 'This clears your area checklist, section progress, and uploaded photos for this inspection on this device. You will start again from area setup.',
  confirmLabel = 'Reset inspection',
  busy = false,
  onClose,
  onConfirm,
}: {
  open: boolean;
  title?: string;
  description?: string;
  confirmLabel?: string;
  busy?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:items-center">
      <div
        className="border-border bg-card w-full max-w-md rounded-2xl border p-4 shadow-xl"
        role="dialog"
        aria-labelledby="reset-inspection-title"
      >
        <h2 id="reset-inspection-title" className="text-foreground text-base font-semibold">
          {title}
        </h2>
        <p className="text-muted-foreground mt-2 text-sm">{description}</p>
        <div className="mt-4 flex gap-2">
          <Button variant="outline" className="flex-1" disabled={busy} onClick={onClose}>
            Keep progress
          </Button>
          <Button
            variant="destructive"
            className="flex-1"
            disabled={busy}
            onClick={onConfirm}
          >
            {busy ? 'Resetting…' : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
