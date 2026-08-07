'use client';

import { CheckCircle2 } from 'lucide-react';

import { Button } from '@/components/ui/button';

export function InspectionCompleteOverlay({
  open,
  title,
  subtitle,
  onDone,
}: {
  open: boolean;
  title: string;
  subtitle?: string;
  onDone: () => void;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background/92 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-live="polite"
      aria-label={title}
    >
      <div className="inspection-complete-pop flex max-w-xs flex-col items-center gap-4 px-8 text-center">
        <div className="inspection-complete-ring relative flex size-28 items-center justify-center rounded-full bg-primary/10">
          <span className="inspection-complete-pulse absolute inset-0 rounded-full border-2 border-primary/40" />
          <CheckCircle2
            className="inspection-complete-check size-16 text-primary"
            strokeWidth={2}
          />
        </div>
        <div className="inspection-complete-copy space-y-1">
          <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
          {subtitle ? (
            <p className="text-muted-foreground text-sm leading-relaxed">{subtitle}</p>
          ) : null}
        </div>
        <Button type="button" className="mt-1 w-full" onClick={onDone}>
          Continue
        </Button>
      </div>
    </div>
  );
}
