'use client';

import { useMemo, useState } from 'react';
import { Check } from 'lucide-react';

import { AddSectionControl } from '@/components/inspector/add-section-control';
import { DraggableNamedList } from '@/components/inspector/draggable-named-list';
import { InspectionItemAccordion } from '@/components/inspector/inspection-item-accordion';
import { RenameLabelDialog } from '@/components/inspector/rename-label-dialog';
import { Button } from '@/components/ui/button';
import type { InspectionAreaDefinition } from '@/constants/inspection-areas';
import {
  allGoodMarks,
  emptyItemMarks,
  type ItemConditionKey,
  type ItemConditionMarks,
} from '@/lib/item-condition-marks';
import { validateUniqueLabel } from '@/lib/inspection-layout-edit';
import { buildSectionPickerOptions } from '@/lib/inspection-section-utils';

type InspectionSectionPhotosProps = {
  definition: InspectionAreaDefinition;
  activeSections: string[];
  photosBySection: Record<string, string[]>;
  itemMarks?: Record<string, ItemConditionMarks>;
  itemComments?: Record<string, string>;
  busy?: boolean;
  photoUploading?: boolean;
  onAddSection: (section: string) => void;
  onRemoveSection: (section: string) => void;
  onRenameSection: (from: string, to: string) => void;
  onMoveSection: (from: number, to: number) => void;
  onChangeMarks: (section: string, marks: ItemConditionMarks) => void;
  onFillColumn: (key: ItemConditionKey, value: boolean) => void;
  onMarkAllGood?: () => void;
  onChangeComment: (section: string, comment: string) => void;
  onAddFiles: (section: string, files: File[]) => void | Promise<void>;
  onAddDataUrl: (section: string, dataUrl: string) => void | Promise<void>;
  onAddDataUrls?: (section: string, dataUrls: string[]) => void | Promise<void>;
  onRemovePhoto: (section: string, index: number) => void;
};

export function InspectionSectionPhotos({
  definition,
  activeSections,
  photosBySection,
  itemMarks,
  itemComments,
  busy = false,
  photoUploading = false,
  onAddSection,
  onRemoveSection,
  onRenameSection,
  onMoveSection,
  onChangeMarks,
  onFillColumn: _onFillColumn,
  onMarkAllGood,
  onChangeComment,
  onAddFiles,
  onAddDataUrl,
  onAddDataUrls,
  onRemovePhoto,
}: InspectionSectionPhotosProps) {
  const [renameFrom, setRenameFrom] = useState<string | null>(null);

  const sectionPickerOptions = useMemo(
    () => buildSectionPickerOptions(definition),
    [definition],
  );

  return (
    <div className="space-y-4">
      {activeSections.length === 0 ? (
        <p className="text-muted-foreground text-xs">
          No items yet. Add one below, then mark Clean / Undamaged / Working.
        </p>
      ) : (
        <>
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium">
              Items in this area
              <span className="bg-primary/20 text-primary ml-2 inline-flex min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-semibold">
                {activeSections.length}
              </span>
            </p>
            {onMarkAllGood ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-emerald-400 h-8 px-2 text-xs"
                disabled={busy}
                onClick={onMarkAllGood}
              >
                <Check className="size-3.5" />
                All good
              </Button>
            ) : null}
          </div>
          <p className="text-muted-foreground text-[11px]">
            Drag a row to reorder. Tap an item to expand. Delete removes it.
          </p>
          <ul className="space-y-2">
            <DraggableNamedList
              items={activeSections}
              variant="card"
              disabled={busy}
              onReorder={onMoveSection}
              renderItem={(section) => {
                const urls = photosBySection[section] ?? [];
                return (
                  <InspectionItemAccordion
                    name={section}
                    marks={itemMarks?.[section] ?? emptyItemMarks()}
                    comment={itemComments?.[section] ?? ''}
                    photoUrls={urls}
                    busy={busy}
                    photoUploading={photoUploading}
                    onRename={() => setRenameFrom(section)}
                    onRemove={() => onRemoveSection(section)}
                    onChangeMarks={(marks) => onChangeMarks(section, marks)}
                    onChangeComment={(comment) => onChangeComment(section, comment)}
                    onAddFiles={(files) => onAddFiles(section, files)}
                    onAddDataUrl={(dataUrl) => onAddDataUrl(section, dataUrl)}
                    onAddDataUrls={
                      onAddDataUrls
                        ? (urlsToAdd) => onAddDataUrls(section, urlsToAdd)
                        : undefined
                    }
                    onRemovePhoto={(photoIndex) => onRemovePhoto(section, photoIndex)}
                  />
                );
              }}
            />
          </ul>
        </>
      )}

      <AddSectionControl
        optionalSections={sectionPickerOptions}
        activeSections={activeSections}
        busy={busy}
        onAddSection={onAddSection}
      />

      <RenameLabelDialog
        open={Boolean(renameFrom)}
        title="Rename item"
        initialValue={renameFrom ?? ''}
        onClose={() => setRenameFrom(null)}
        onConfirm={(value) => {
          if (!renameFrom) return null;
          const error = validateUniqueLabel(value, activeSections, renameFrom);
          if (error) return error;
          onRenameSection(renameFrom, value.trim().replace(/\s+/g, ' '));
          return null;
        }}
      />
    </div>
  );
}

export function markAllItemsGood(
  sections: readonly string[],
): Record<string, ItemConditionMarks> {
  const next: Record<string, ItemConditionMarks> = {};
  for (const section of sections) next[section] = allGoodMarks();
  return next;
}
