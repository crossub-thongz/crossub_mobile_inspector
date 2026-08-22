'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';

export function InspectionAreaActionBar({
  checked,
  total,
  issues,
  busy,
  isLast,
  onBack,
  onNext,
}: {
  checked: number;
  total: number;
  issues: number;
  busy?: boolean;
  isLast: boolean;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="size-10 shrink-0"
        disabled={busy}
        onClick={onBack}
        aria-label="Back"
      >
        <ChevronLeft className="size-4" />
      </Button>
      <div className="min-w-0 flex-1">
        <p className="text-foreground text-xs font-semibold">
          {checked}/{total} Items checked
        </p>
        <p
          className={
            issues > 0
              ? 'text-destructive text-[11px]'
              : 'text-muted-foreground text-[11px]'
          }
        >
          {issues > 0
            ? `${issues} issue${issues === 1 ? '' : 's'} found`
            : 'No issues found'}
        </p>
      </div>
      <Button
        type="button"
        className="h-11 min-w-[8.5rem] flex-[1.2]"
        disabled={busy}
        onClick={onNext}
      >
        {busy ? 'Uploading photos…' : isLast ? 'Complete' : 'Next area'}
        {!busy ? <ChevronRight className="size-4" /> : null}
      </Button>
    </div>
  );
}
