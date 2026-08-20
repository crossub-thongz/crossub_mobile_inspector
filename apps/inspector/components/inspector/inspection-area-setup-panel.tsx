'use client';

import { MessageSquare, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState, type ReactNode } from 'react';

import { DraggableNamedList } from '@/components/inspector/draggable-named-list';
import { RenameLabelDialog } from '@/components/inspector/rename-label-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { INSPECTION_AREA_CATALOG } from '@/constants/inspection-areas';
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
  customAreas: _customAreas,
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
  const [newName, setNewName] = useState('');
  const [addError, setAddError] = useState<string | null>(null);
  const [renameFrom, setRenameFrom] = useState<string | null>(null);
  const copy = inspectionStartCopy(kind);

  const selectedSet = new Set(selectedAreaNames.map((name) => name.toLowerCase()));
  const availableExisting = existingAreaNames.filter(
    (name) => !selectedSet.has(name.toLowerCase()),
  );
  const sourceLabel = layoutSourceLabel(layoutSource, selectedAreaNames.length);

  const submitNewArea = () => {
    const normalized = normalizeCustomAreaName(newName);
    const error = validateUniqueLabel(normalized, selectedAreaNames);
    if (error) {
      setAddError(error);
      return;
    }
    const fromIngoing = existingAreaNames.find(
      (name) => name.trim().toLowerCase() === normalized.toLowerCase(),
    );
    if (fromIngoing) {
      onAddBuiltInArea(fromIngoing);
    } else {
      const catalog = INSPECTION_AREA_CATALOG.find(
        (area) => area.name.toLowerCase() === normalized.toLowerCase(),
      );
      if (catalog) onAddBuiltInArea(catalog.name);
      else onAddCustomArea(normalized, 'standard');
    }
    setNewName('');
    setAddError(null);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{continuing ? copy.continueLabel : copy.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-sm">{copy.body}</p>
          <p className="text-muted-foreground text-xs">
            Hold a row and drag to reorder. Type a name in the last row to add an area.
          </p>

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

          <ul className="divide-y rounded-lg border">
            <DraggableNamedList
              items={selectedAreaNames}
              disabled={busy}
              onReorder={onMoveArea}
              renderItem={(name) => (
                <>
                  <p className="min-w-0 flex-1 font-medium">{name}</p>
                  <button
                    type="button"
                    data-no-drag
                    className="text-muted-foreground hover:text-foreground shrink-0 rounded-md p-1"
                    aria-label={`Rename ${name}`}
                    disabled={busy}
                    onClick={() => setRenameFrom(name)}
                  >
                    <Pencil className="size-4" />
                  </button>
                  <button
                    type="button"
                    data-no-drag
                    className="text-muted-foreground hover:text-destructive shrink-0 rounded-md p-1"
                    aria-label={`Remove ${name}`}
                    disabled={busy}
                    onClick={() => onRemoveArea(name)}
                  >
                    <Trash2 className="size-4" />
                  </button>
                </>
              )}
            />
            <li className="flex items-center gap-2 px-2 py-2">
              <Plus className="text-muted-foreground size-4 shrink-0" />
              <Input
                value={newName}
                placeholder="Type an area name"
                disabled={busy}
                className="h-9"
                onChange={(event) => {
                  setNewName(event.target.value);
                  setAddError(null);
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    submitNewArea();
                  }
                }}
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="shrink-0"
                disabled={busy || !newName.trim()}
                onClick={submitNewArea}
              >
                Add
              </Button>
            </li>
          </ul>
          {addError ? <p className="text-destructive text-xs">{addError}</p> : null}

          {selectedAreaNames.length === 0 ? (
            <p className="text-muted-foreground text-center text-xs">
              Add at least one room, drag to arrange, then start.
            </p>
          ) : null}

          <Button
            type="button"
            className="w-full"
            disabled={busy || selectedAreaNames.length === 0}
            onClick={onComplete}
          >
            {setupStartLabel(kind, continuing)}
          </Button>
        </CardContent>
      </Card>

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
