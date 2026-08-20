'use client';

import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type RenameLabelDialogProps = {
  open: boolean;
  title: string;
  description?: string;
  label?: string;
  initialValue: string;
  confirmLabel?: string;
  onClose: () => void;
  onConfirm: (value: string) => string | null | void;
};

export function RenameLabelDialog({
  open,
  title,
  description,
  label = 'Name',
  initialValue,
  confirmLabel = 'Save',
  onClose,
  onConfirm,
}: RenameLabelDialogProps) {
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setValue(initialValue);
    setError(null);
  }, [open, initialValue]);

  if (!open) return null;

  const handleConfirm = () => {
    const result = onConfirm(value);
    if (typeof result === 'string' && result.trim()) {
      setError(result);
      return;
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:items-center">
      <div
        className="border-border bg-card w-full max-w-md rounded-2xl border p-4 shadow-xl"
        role="dialog"
        aria-labelledby="rename-label-title"
      >
        <h2 id="rename-label-title" className="text-foreground text-base font-semibold">
          {title}
        </h2>
        {description ? (
          <p className="text-muted-foreground mt-1 text-xs">{description}</p>
        ) : null}
        <div className="mt-4 space-y-2">
          <Label htmlFor="rename-label-input">{label}</Label>
          <Input
            id="rename-label-input"
            value={value}
            autoFocus
            onChange={(event) => {
              setValue(event.target.value);
              setError(null);
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                handleConfirm();
              }
            }}
          />
          {error ? <p className="text-destructive text-xs">{error}</p> : null}
        </div>
        <div className="mt-4 flex gap-2">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" className="flex-1" onClick={handleConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
