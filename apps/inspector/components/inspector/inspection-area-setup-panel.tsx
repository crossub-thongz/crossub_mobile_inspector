'use client';

import { Trash2 } from 'lucide-react';
import { useState } from 'react';

import { AddCustomAreaDialog } from '@/components/inspector/add-custom-area-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  INSPECTION_AREA_CATALOG,
  type InspectionAreaDefinition,
} from '@/constants/inspection-areas';
import {
  customAreaToDefinition,
  normalizeCustomAreaName,
  type CustomAreaDefinition,
  type CustomAreaSectionMode,
} from '@/lib/custom-inspection-areas';
import { setupStartLabel } from '@/lib/inspection-area-workflow';

const OTHER_AREA_VALUE = '__other__';

type InspectionAreaSetupPanelProps = {
  selectedAreaNames: string[];
  customAreas: CustomAreaDefinition[];
  existingAreaNames?: string[];
  continuing?: boolean;
  sectionsHint?: string;
  busy?: boolean;
  onAddBuiltInArea: (name: string) => void;
  onAddCustomArea: (name: string, sectionMode: CustomAreaSectionMode) => void;
  onRemoveArea: (name: string) => void;
  onAddAllExisting?: () => void;
  onComplete: () => void;
};

export function InspectionAreaSetupPanel({
  selectedAreaNames,
  customAreas,
  existingAreaNames = [],
  continuing = false,
  sectionsHint,
  busy = false,
  onAddBuiltInArea,
  onAddCustomArea,
  onRemoveArea,
  onAddAllExisting,
  onComplete,
}: InspectionAreaSetupPanelProps) {
  const [pick, setPick] = useState('');
  const [customOpen, setCustomOpen] = useState(false);

  const selectedSet = new Set(selectedAreaNames.map((name) => name.toLowerCase()));
  const availableExisting = existingAreaNames.filter(
    (name) => !selectedSet.has(name.toLowerCase()),
  );
  const availableBuiltIn = INSPECTION_AREA_CATALOG.filter(
    (area) => !selectedSet.has(area.name.toLowerCase()),
  );
  const hasMoreAreasToAdd =
    availableExisting.length > 0 || availableBuiltIn.length > 0;

  const resolveDefinition = (name: string): InspectionAreaDefinition | undefined => {
    const builtIn = INSPECTION_AREA_CATALOG.find((area) => area.name === name);
    if (builtIn) return builtIn;
    const custom = customAreas.find(
      (area) => area.name.trim().toLowerCase() === name.trim().toLowerCase(),
    );
    if (custom) return customAreaToDefinition(custom);
    return undefined;
  };

  const defaultSectionsHint =
    sectionsHint ??
    (existingAreaNames.length > 0
      ? 'Sections from the ingoing report load when you reach each area'
      : 'Standard sections load when you reach each area — add more as needed');

  const handlePickChange = (value: string) => {
    setPick(value);
    if (value === OTHER_AREA_VALUE) {
      setCustomOpen(true);
      setPick('');
      return;
    }
    if (value) {
      onAddBuiltInArea(value);
      setPick('');
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>
            {continuing ? 'Continue inspection' : 'Start inspection'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-sm">
            Add each room or space you will inspect. Choose an existing area from the
            ingoing report, pick a standard room, or enter a custom name. You will
            photograph sections inside each area before moving on.
          </p>

          {availableExisting.length > 0 && onAddAllExisting ? (
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              disabled={busy}
              onClick={onAddAllExisting}
            >
              Add all areas from ingoing report ({availableExisting.length})
            </Button>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="add-area">Add area</Label>
            <select
              id="add-area"
              className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
              value={pick}
              disabled={busy}
              onChange={(event) => handlePickChange(event.target.value)}
            >
              <option value="">Select or choose existing area…</option>
              {availableExisting.length > 0 ? (
                <optgroup label="From ingoing report">
                  {availableExisting.map((name) => (
                    <option key={`existing-${name}`} value={name}>
                      {name}
                    </option>
                  ))}
                </optgroup>
              ) : null}
              {availableBuiltIn.length > 0 ? (
                <optgroup label="Standard areas">
                  {availableBuiltIn.map((area) => (
                    <option key={area.name} value={area.name}>
                      {area.name}
                    </option>
                  ))}
                </optgroup>
              ) : null}
              <option value={OTHER_AREA_VALUE}>Other — enter a custom name</option>
            </select>
          </div>

          {selectedAreaNames.length > 0 ? (
            <ul className="divide-y rounded-lg border">
              {selectedAreaNames.map((name) => (
                <li
                  key={name}
                  className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm"
                >
                  <div className="min-w-0">
                    <p className="font-medium">{name}</p>
                    <p className="text-muted-foreground text-xs">{defaultSectionsHint}</p>
                  </div>
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-destructive shrink-0 rounded-md p-1"
                    aria-label={`Remove ${name}`}
                    onClick={() => onRemoveArea(name)}
                  >
                    <Trash2 className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground rounded-lg border border-dashed p-4 text-center text-xs">
              No areas added yet. Select at least one area to begin.
            </p>
          )}

          <Button
            type="button"
            className="w-full"
            disabled={busy || selectedAreaNames.length === 0}
            onClick={onComplete}
          >
            {setupStartLabel(continuing)}
          </Button>

          {selectedAreaNames.length > 0 && !hasMoreAreasToAdd ? (
            <p className="text-muted-foreground text-center text-xs">
              All available areas are added — use {setupStartLabel(continuing).toLowerCase()} when
              ready.
            </p>
          ) : null}
        </CardContent>
      </Card>

      <AddCustomAreaDialog
        open={customOpen}
        existingCustomAreas={customAreas}
        onClose={() => setCustomOpen(false)}
        onConfirm={(name, sectionMode) => {
          onAddCustomArea(normalizeCustomAreaName(name), sectionMode);
          setCustomOpen(false);
        }}
      />
    </>
  );
}
