'use client';

import { Plus, Trash2 } from 'lucide-react';
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

const OTHER_AREA_VALUE = '__other__';

type InspectionAreaSetupPanelProps = {
  selectedAreaNames: string[];
  customAreas: CustomAreaDefinition[];
  busy?: boolean;
  onAddBuiltInArea: (name: string) => void;
  onAddCustomArea: (name: string, sectionMode: CustomAreaSectionMode) => void;
  onRemoveArea: (name: string) => void;
  onComplete: () => void;
};

export function InspectionAreaSetupPanel({
  selectedAreaNames,
  customAreas,
  busy = false,
  onAddBuiltInArea,
  onAddCustomArea,
  onRemoveArea,
  onComplete,
}: InspectionAreaSetupPanelProps) {
  const [pick, setPick] = useState('');
  const [customOpen, setCustomOpen] = useState(false);

  const selectedSet = new Set(selectedAreaNames.map((name) => name.toLowerCase()));
  const availableBuiltIn = INSPECTION_AREA_CATALOG.filter(
    (area) => !selectedSet.has(area.name.toLowerCase()),
  );

  const resolveDefinition = (name: string): InspectionAreaDefinition | undefined => {
    const builtIn = INSPECTION_AREA_CATALOG.find((area) => area.name === name);
    if (builtIn) return builtIn;
    const custom = customAreas.find(
      (area) => area.name.trim().toLowerCase() === name.trim().toLowerCase(),
    );
    if (custom) return customAreaToDefinition(custom);
    return undefined;
  };

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
          <CardTitle>Set up areas for this inspection</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-sm">
            Add each room or space you will inspect. Choose from the list or enter a
            custom name. You will photograph sections inside each area before moving
            on.
          </p>

          <div className="space-y-2">
            <Label htmlFor="add-area">Add area</Label>
            <select
              id="add-area"
              className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
              value={pick}
              disabled={busy}
              onChange={(event) => handlePickChange(event.target.value)}
            >
              <option value="">Select an area…</option>
              {availableBuiltIn.map((area) => (
                <option key={area.name} value={area.name}>
                  {area.name}
                </option>
              ))}
              <option value={OTHER_AREA_VALUE}>Other — enter a custom name</option>
            </select>
          </div>

          {selectedAreaNames.length > 0 ? (
            <ul className="divide-y rounded-lg border">
              {selectedAreaNames.map((name) => {
                const def = resolveDefinition(name);
                const sectionHint = 'Add sections when you reach this area';
                return (
                  <li
                    key={name}
                    className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="font-medium">{name}</p>
                      <p className="text-muted-foreground text-xs">{sectionHint}</p>
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
                );
              })}
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
            Begin inspection
          </Button>
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
