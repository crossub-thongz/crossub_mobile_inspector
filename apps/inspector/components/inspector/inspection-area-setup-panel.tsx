'use client';

import { ChevronDown, ChevronUp, MessageSquare, Pencil, Trash2 } from 'lucide-react';
import { useState, type ReactNode } from 'react';

import { AddCustomAreaDialog } from '@/components/inspector/add-custom-area-dialog';
import { RenameLabelDialog } from '@/components/inspector/rename-label-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  INSPECTION_AREA_CATALOG,
} from '@/constants/inspection-areas';
import {
  normalizeCustomAreaName,
  type CustomAreaDefinition,
  type CustomAreaSectionMode,
} from '@/lib/custom-inspection-areas';
import type { InspectionAreaKind } from '@/lib/inspection-area-workflow';
import { validateUniqueLabel } from '@/lib/inspection-layout-edit';
import {
  inspectionStartCopy,
  layoutSourceLabel,
  setupStartLabel,
  type InspectionLayoutSource,
} from '@/lib/inspection-start-flow';

const OTHER_AREA_VALUE = '__other__';

type InspectionAreaSetupPanelProps = {
  kind: InspectionAreaKind;
  selectedAreaNames: string[];
  customAreas: CustomAreaDefinition[];
  existingAreaNames?: string[];
  continuing?: boolean;
  layoutSource?: InspectionLayoutSource;
  busy?: boolean;
  extraActions?: ReactNode;
  onAddBuiltInArea: (name: string) => void;
  onAddCustomArea: (name: string, sectionMode: CustomAreaSectionMode) => void;
  onRemoveArea: (name: string) => void;
  onRenameArea: (from: string, to: string) => void;
  onMoveArea: (from: number, to: number) => void;
  onAddAllExisting?: () => void;
  onComplete: () => void;
};

export function InspectionAreaSetupPanel({
  kind,
  selectedAreaNames,
  customAreas,
  existingAreaNames = [],
  continuing = false,
  layoutSource = 'manual',
  busy = false,
  extraActions,
  onAddBuiltInArea,
  onAddCustomArea,
  onRemoveArea,
  onRenameArea,
  onMoveArea,
  onAddAllExisting,
  onComplete,
}: InspectionAreaSetupPanelProps) {
  const [pick, setPick] = useState('');
  const [customOpen, setCustomOpen] = useState(false);
  const [renameFrom, setRenameFrom] = useState<string | null>(null);
  const copy = inspectionStartCopy(kind);

  const selectedSet = new Set(selectedAreaNames.map((name) => name.toLowerCase()));
  const availableExisting = existingAreaNames.filter(
    (name) => !selectedSet.has(name.toLowerCase()),
  );
  const availableBuiltIn = INSPECTION_AREA_CATALOG.filter(
    (area) => !selectedSet.has(area.name.toLowerCase()),
  );
  const hasMoreAreasToAdd =
    availableExisting.length > 0 || availableBuiltIn.length > 0;
  const sourceLabel = layoutSourceLabel(layoutSource, selectedAreaNames.length);

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
          <CardTitle>{continuing ? copy.continueLabel : copy.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-sm">{copy.body}</p>

          {sourceLabel ? (
            <p className="rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-xs text-foreground">
              {sourceLabel}
            </p>
          ) : null}

          {extraActions}

          {availableExisting.length > 0 && onAddAllExisting ? (
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              disabled={busy}
              onClick={onAddAllExisting}
            >
              Add remaining from ingoing report ({availableExisting.length})
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
              <option value="">Add another area…</option>
              {availableExisting.length > 0 ? (
                <optgroup label="From last ingoing">
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
              {selectedAreaNames.map((name, index) => (
                <li
                  key={name}
                  className="flex items-center gap-2 px-2 py-2 text-sm"
                >
                  <div className="flex shrink-0 flex-col">
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-foreground rounded-md p-1 disabled:opacity-30"
                      aria-label={`Move ${name} up`}
                      disabled={busy || index === 0}
                      onClick={() => onMoveArea(index, index - 1)}
                    >
                      <ChevronUp className="size-4" />
                    </button>
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-foreground rounded-md p-1 disabled:opacity-30"
                      aria-label={`Move ${name} down`}
                      disabled={busy || index === selectedAreaNames.length - 1}
                      onClick={() => onMoveArea(index, index + 1)}
                    >
                      <ChevronDown className="size-4" />
                    </button>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{name}</p>
                    <p className="text-muted-foreground text-xs">{copy.sectionsHint}</p>
                  </div>
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-foreground shrink-0 rounded-md p-1"
                    aria-label={`Rename ${name}`}
                    disabled={busy}
                    onClick={() => setRenameFrom(name)}
                  >
                    <Pencil className="size-4" />
                  </button>
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-destructive shrink-0 rounded-md p-1"
                    aria-label={`Remove ${name}`}
                    disabled={busy}
                    onClick={() => onRemoveArea(name)}
                  >
                    <Trash2 className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground rounded-lg border border-dashed p-4 text-center text-xs">
              No areas yet. Add at least one room, arrange the list, then start.
            </p>
          )}

          <Button
            type="button"
            className="w-full"
            disabled={busy || selectedAreaNames.length === 0}
            onClick={onComplete}
          >
            {setupStartLabel(kind, continuing)}
          </Button>

          {selectedAreaNames.length > 0 && !hasMoreAreasToAdd ? (
            <p className="text-muted-foreground text-center text-xs">
              Layout is ready — {setupStartLabel(kind, continuing).toLowerCase()} when you are
              on site.
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

      <RenameLabelDialog
        open={Boolean(renameFrom)}
        title="Rename area"
        initialValue={renameFrom ?? ''}
        onClose={() => setRenameFrom(null)}
        onConfirm={(value) => {
          if (!renameFrom) return null;
          const error = validateUniqueLabel(value, selectedAreaNames, renameFrom);
          if (error) return error;
          onRenameArea(renameFrom, normalizeCustomAreaName(value));
          return null;
        }}
      />
    </>
  );
}

export function RoutinePreInspectionSmsButton({
  href,
  disabled,
}: {
  href: string;
  disabled?: boolean;
}) {
  return (
    <Button type="button" variant="outline" className="w-full" disabled={disabled} asChild>
      <a href={href}>
        <MessageSquare className="size-4" />
        Send pre-inspection SMS
      </a>
    </Button>
  );
}
