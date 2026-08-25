'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

import type { InspectionAreaDefinition } from '@/constants/inspection-areas';
import { cn } from '@/lib/utils';

/** Current = amber, completed = brand green, otherwise white. */
export function inspectionAreaProgressBarClass(
  current: boolean,
  complete: boolean,
): string {
  if (current) return 'bg-amber-400';
  if (complete) return 'bg-primary';
  return 'bg-white ring-1 ring-black/20 dark:ring-white/30';
}

type InspectionAreaNavProps = {
  areaCatalog: InspectionAreaDefinition[];
  areaIndex: number;
  progressTone: (index: number, areaName: string) => string;
  onGoToArea: (index: number) => void;
};

export function InspectionAreaNav({
  areaCatalog,
  areaIndex,
  progressTone,
  onGoToArea,
}: InspectionAreaNavProps) {
  const totalAreas = areaCatalog.length;
  const current = areaCatalog[areaIndex];
  const canPrev = areaIndex > 0;
  const canNext = areaIndex < totalAreas - 1;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          disabled={!canPrev}
          aria-label="Previous area"
          className="text-foreground flex size-9 items-center justify-center rounded-full disabled:opacity-30"
          onClick={() => onGoToArea(areaIndex - 1)}
        >
          <ChevronLeft className="size-5" />
        </button>
        <div className="min-w-0 text-center">
          <p className="text-foreground truncate text-base font-semibold">
            {current?.name ?? 'Area'}
          </p>
          <p className="text-muted-foreground text-[11px]">
            {totalAreas === 0 ? '0 of 0' : `${areaIndex + 1} of ${totalAreas}`}
          </p>
        </div>
        <button
          type="button"
          disabled={!canNext}
          aria-label="Next area"
          className="text-foreground flex size-9 items-center justify-center rounded-full disabled:opacity-30"
          onClick={() => onGoToArea(areaIndex + 1)}
        >
          <ChevronRight className="size-5" />
        </button>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex min-w-0 flex-1 gap-1">
          {areaCatalog.map((item, index) => (
            <button
              key={`${index}:${item.name}`}
              type="button"
              title={item.name}
              aria-label={`Go to ${item.name}`}
              className={cn('h-1.5 flex-1 rounded-full', progressTone(index, item.name))}
              onClick={() => onGoToArea(index)}
            />
          ))}
        </div>
        <span className="text-muted-foreground shrink-0 text-[11px] font-semibold tabular-nums">
          {totalAreas === 0 ? '0/0' : `${areaIndex + 1}/${totalAreas}`}
        </span>
      </div>
    </div>
  );
}
