'use client';

import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import type { InspectionAreaDefinition } from '@/constants/inspection-areas';
import { cn } from '@/lib/utils';

type InspectionAreaNavProps = {
  areaCatalog: InspectionAreaDefinition[];
  areaIndex: number;
  progressTone: (index: number, areaName: string) => string;
  onGoToArea: (index: number) => void;
  onAddArea?: () => void;
  addAreaLabel?: string;
};

export function InspectionAreaNav({
  areaCatalog,
  areaIndex,
  progressTone,
  onGoToArea,
  onAddArea,
  addAreaLabel = 'Add area',
}: InspectionAreaNavProps) {
  const totalAreas = areaCatalog.length;
  const current = areaCatalog[areaIndex];

  return (
    <div className="space-y-2">
      <div className="flex gap-1">
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

      <div className="space-y-2">
        <Label htmlFor="inspection-area-nav">Current area</Label>
        <select
          id="inspection-area-nav"
          key={areaCatalog.map((item) => item.name).join('|')}
          className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
          value={String(areaIndex)}
          onChange={(event) => onGoToArea(Number(event.target.value))}
        >
          {areaCatalog.map((item, index) => (
            <option key={`${index}:${item.name}`} value={String(index)}>
              {index + 1} of {totalAreas}: {item.name}
            </option>
          ))}
        </select>
        {current ? (
          <p className="text-muted-foreground text-xs">
            Area {areaIndex + 1} of {totalAreas} — {current.name}
          </p>
        ) : null}
      </div>

      {onAddArea ? (
        <Button type="button" variant="outline" size="sm" className="w-full" onClick={onAddArea}>
          <Plus className="size-4" />
          {addAreaLabel}
        </Button>
      ) : null}
    </div>
  );
}
