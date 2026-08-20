'use client';

import { useMemo, useState } from 'react';

import { AddSectionControl } from '@/components/inspector/add-section-control';
import { EditableChecklistRow } from '@/components/inspector/editable-checklist-row';
import { InspectionAreaPhotosField } from '@/components/inspector/inspection-area-photos-field';
import { ItemConditionToggles } from '@/components/inspector/item-condition-toggles';
import { RenameLabelDialog } from '@/components/inspector/rename-label-dialog';
import { Input } from '@/components/ui/input';
import type { InspectionAreaDefinition } from '@/constants/inspection-areas';
import { emptyItemMarks, type ItemConditionMarks } from '@/lib/item-condition-marks';
import { validateUniqueLabel } from '@/lib/inspection-layout-edit';
import { buildSectionPickerOptions } from '@/lib/inspection-section-utils';

type InspectionSectionPhotosProps = {
  definition: InspectionAreaDefinition;
  activeSections: string[];
  photosBySection: Record<string, string[]>;
  itemMarks?: Record<string, ItemConditionMarks>;
  itemComments?: Record<string, string>;
  busy?: boolean;
  onAddSection: (section: string) => void;
  onRemoveSection: (section: string) => void;
  onRenameSection: (from: string, to: string) => void;
  onMoveSection: (from: number, to: number) => void;
  onChangeMarks: (section: string, marks: ItemConditionMarks) => void;
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
  onAddSection,
  onRemoveSection,
  onRenameSection,
  onMoveSection,
  onChangeMarks,
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
        activeSections.map((section, index) => {
          const urls = photosBySection[section] ?? [];
          return (
            <EditableChecklistRow
              key={section}
              name={section}
              index={index}
              total={activeSections.length}
              busy={busy}
              onMove={onMoveSection}
              onRename={() => setRenameFrom(section)}
              onRemove={() => onRemoveSection(section)}
            >
              <ItemConditionToggles
                marks={itemMarks?.[section] ?? emptyItemMarks()}
                disabled={busy}
                onChange={(marks) => onChangeMarks(section, marks)}
              />
              <Input
                placeholder="Comment (optional)"
                value={itemComments?.[section] ?? ''}
                disabled={busy}
                onChange={(event) => onChangeComment(section, event.target.value)}
              />
              <InspectionAreaPhotosField
                label="Item photos"
                photoUrls={urls}
                uploading={busy}
                emptyLabel="Optional close-ups for this item."
                onAddFiles={(files) => onAddFiles(section, files)}
                onAddDataUrl={(dataUrl) => onAddDataUrl(section, dataUrl)}
                onAddDataUrls={
                  onAddDataUrls
                    ? (urlsToAdd) => onAddDataUrls(section, urlsToAdd)
                    : undefined
                }
                onRemove={(photoIndex) => onRemovePhoto(section, photoIndex)}
              />
            </EditableChecklistRow>
          );
        })
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
