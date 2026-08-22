'use client';

import { ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function InspectionAreaActionBar({
  checked,
  total,
  issues,
  busy,
  isLast,
  onNext,
}: {
  checked: number;
  total: number;
  issues: number;
  busy?: boolean;
  isLast: boolean;
  onBack?: () => void;
  onNext: () => void;
}) {
  const ratio = total === 0 ? 0 : Math.min(checked / total, 1);
  const size = 44;
  const stroke = 4;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="flex items-center gap-3">
      <div className="relative size-11 shrink-0">
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            className="stroke-secondary"
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            className="stroke-primary"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - ratio)}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold tabular-nums">
          {checked}/{total}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-foreground text-xs font-semibold">Items checked</p>
        <p
          className={cn(
            'text-[11px]',
            issues > 0 ? 'text-destructive' : 'text-muted-foreground',
          )}
        >
          {issues > 0
            ? `${issues} issue${issues === 1 ? '' : 's'} found`
            : 'No issues found'}
        </p>
      </div>
      <Button
        type="button"
        className="h-11 min-w-[8.5rem] flex-[1.1]"
        disabled={busy}
        onClick={onNext}
      >
        {busy ? 'Uploading photos…' : isLast ? 'Complete' : 'Next area'}
        {!busy ? <ChevronRight className="size-4" /> : null}
      </Button>
    </div>
  );
}
