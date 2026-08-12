'use client';

import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  type CustomAreaSectionMode,
  validateNewCustomAreaName,
} from '@/lib/custom-inspection-areas';
import type { CustomAreaDefinition } from '@/lib/custom-inspection-areas';
import { cn } from '@/lib/utils';

type AddCustomAreaDialogProps = {
  open: boolean;
  existingCustomAreas: CustomAreaDefinition[];
  onClose: () => void;
  onConfirm: (name: string, sectionMode: CustomAreaSectionMode) => void;
};

export function AddCustomAreaDialog({
  open,
  existingCustomAreas,
  onClose,
  onConfirm,
}: AddCustomAreaDialogProps) {
  const [name, setName] = useState('');
  const [sectionMode, setSectionMode] = useState<CustomAreaSectionMode>('standard');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName('');
    setSectionMode('standard');
    setError(null);
  }, [open]);

  if (!open) return null;

  const handleConfirm = () => {
    const validationError = validateNewCustomAreaName(name, existingCustomAreas);
    if (validationError) {
      setError(validationError);
      return;
    }
    onConfirm(name.trim(), sectionMode);
    onClose();
  };

  return (
    // Above the shell bottom nav (z-60) so Cancel / Add area stay tappable.
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:items-center">
      <div
        className="border-border bg-card flex max-h-[min(85dvh,40rem)] w-full max-w-md flex-col rounded-2xl border shadow-xl"
        role="dialog"
        aria-labelledby="add-custom-area-title"
      >
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <h2 id="add-custom-area-title" className="text-foreground text-base font-semibold">
            Add area
          </h2>
          <p className="text-muted-foreground mt-1 text-xs">
            Name the area, then choose standard wall-to-floor sections or add sections
            manually.
          </p>

          <div className="mt-4 space-y-2">
            <Label htmlFor="custom-area-name">Area name</Label>
            <Input
              id="custom-area-name"
              value={name}
              placeholder="e.g. Rumpus room, Studio, Shed"
              onChange={(event) => {
                setName(event.target.value);
                setError(null);
              }}
            />
            {error ? <p className="text-destructive text-xs">{error}</p> : null}
          </div>

          <div className="mt-4 space-y-2">
            <Label>Sections</Label>
            <div className="grid gap-2">
              <button
                type="button"
                className={cn(
                  'rounded-lg border px-3 py-2 text-left text-sm transition-colors',
                  sectionMode === 'standard'
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:bg-muted/50',
                )}
                onClick={() => setSectionMode('standard')}
              >
                <span className="font-medium">Standard sections</span>
                <span className="text-muted-foreground mt-0.5 block text-xs">
                  Walls, floors, doors, windows, and other common checklist items.
                </span>
              </button>
              <button
                type="button"
                className={cn(
                  'rounded-lg border px-3 py-2 text-left text-sm transition-colors',
                  sectionMode === 'manual'
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:bg-muted/50',
                )}
                onClick={() => setSectionMode('manual')}
              >
                <span className="font-medium">Add sections manually</span>
                <span className="text-muted-foreground mt-0.5 block text-xs">
                  Start with no sections — pick each one from the list as you go.
                </span>
              </button>
            </div>
          </div>
        </div>

        <div className="border-border flex shrink-0 gap-2 border-t p-4">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" className="flex-1" onClick={handleConfirm}>
            Add area
          </Button>
        </div>
      </div>
    </div>
  );
}
