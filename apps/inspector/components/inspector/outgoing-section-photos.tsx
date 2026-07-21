'use client';

import { Plus, X } from 'lucide-react';
import { useMemo, useState } from 'react';

import { BeforeAfterPhotoColumn } from '@/components/inspector/before-after-photo-column';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import type { InspectionAreaDefinition } from '@/constants/inspection-areas';

export type SectionBeforeAfter = {
  ingoingPhotoUrls: string[];
  outgoingPhotoUrls: string[];
};

type OutgoingSectionPhotosProps = {
  definition: InspectionAreaDefinition;
  activeSections: string[];
  photosBySection: Record<string, SectionBeforeAfter>;
  busy?: boolean;
  ingoingReadOnly?: boolean;
  currentLabel?: string;
  onAddSection: (section: string) => void;
  onRemoveSection: (section: string) => void;
  onAddFiles: (
    section: string,
    side: 'ingoing' | 'outgoing',
    files: File[],
  ) => void | Promise<void>;
  onAddDataUrl: (
    section: string,
    side: 'ingoing' | 'outgoing',
    dataUrl: string,
  ) => void | Promise<void>;
  onRemovePhoto: (
    section: string,
    side: 'ingoing' | 'outgoing',
    index: number,
  ) => void;
};

export function OutgoingSectionPhotos({
  definition,
  activeSections,
  photosBySection,
  busy = false,
  ingoingReadOnly = false,
  currentLabel = 'Outgoing',
  onAddSection,
  onRemoveSection,
  onAddFiles,
  onAddDataUrl,
  onRemovePhoto,
}: OutgoingSectionPhotosProps) {
  const [pick, setPick] = useState('');

  const defaultSet = useMemo(
    () => new Set(definition.defaultSections),
    [definition.defaultSections],
  );

  const availableOptional = useMemo(
    () =>
      definition.optionalSections.filter(
        (section) => !activeSections.includes(section),
      ),
    [definition.optionalSections, activeSections],
  );

  const handleAdd = () => {
    if (!pick) return;
    onAddSection(pick);
    setPick('');
  };

  return (
    <div className="space-y-4">
      {activeSections.length === 0 ? (
        <p className="text-muted-foreground text-xs">
          No sections yet. Add one from the list below to start photographing.
        </p>
      ) : (
        activeSections.map((section) => {
          const isDefault = defaultSet.has(section);
          const photos = photosBySection[section] ?? {
            ingoingPhotoUrls: [],
            outgoingPhotoUrls: [],
          };
          const sectionIngoingLocked =
            ingoingReadOnly && photos.ingoingPhotoUrls.length > 0;
          return (
            <div
              key={section}
              className="space-y-2 rounded-lg border border-border p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium leading-snug">{section}</p>
                {!isDefault ? (
                  <button
                    type="button"
                    onClick={() => onRemoveSection(section)}
                    className="text-muted-foreground hover:text-foreground shrink-0 rounded-md p-1"
                    aria-label={`Remove ${section}`}
                  >
                    <X className="size-4" />
                  </button>
                ) : null}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <BeforeAfterPhotoColumn
                  title="Ingoing"
                  photoUrls={photos.ingoingPhotoUrls}
                  uploading={busy}
                  disabled={busy || sectionIngoingLocked}
                  onAddFiles={(files) => onAddFiles(section, 'ingoing', files)}
                  onAddDataUrl={(dataUrl) =>
                    onAddDataUrl(section, 'ingoing', dataUrl)
                  }
                  onRemove={
                    sectionIngoingLocked
                      ? undefined
                      : (index) => onRemovePhoto(section, 'ingoing', index)
                  }
                />
                <BeforeAfterPhotoColumn
                  title={currentLabel}
                  photoUrls={photos.outgoingPhotoUrls}
                  uploading={busy}
                  disabled={busy}
                  onAddFiles={(files) => onAddFiles(section, 'outgoing', files)}
                  onAddDataUrl={(dataUrl) =>
                    onAddDataUrl(section, 'outgoing', dataUrl)
                  }
                  onRemove={(index) => onRemovePhoto(section, 'outgoing', index)}
                />
              </div>
            </div>
          );
        })
      )}

      {availableOptional.length > 0 ? (
        <div className="space-y-2">
          <Label htmlFor="add-outgoing-section">Add section</Label>
          <div className="flex gap-2">
            <select
              id="add-outgoing-section"
              className="border-input bg-background h-9 min-w-0 flex-1 rounded-md border px-3 text-sm"
              value={pick}
              disabled={busy}
              onChange={(e) => setPick(e.target.value)}
            >
              <option value="">Select a section…</option>
              {availableOptional.map((section) => (
                <option key={section} value={section}>
                  {section}
                </option>
              ))}
            </select>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="shrink-0"
              disabled={busy || !pick}
              onClick={handleAdd}
            >
              <Plus className="size-4" />
              Add
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
