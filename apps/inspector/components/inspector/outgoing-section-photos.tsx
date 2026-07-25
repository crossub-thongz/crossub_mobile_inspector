'use client';

import { X } from 'lucide-react';
import { useMemo } from 'react';

import { AddSectionControl } from '@/components/inspector/add-section-control';
import { BeforeAfterPhotoColumn } from '@/components/inspector/before-after-photo-column';
import type { InspectionAreaDefinition } from '@/constants/inspection-areas';
import { COMMON_DEFAULT_SECTIONS } from '@/constants/inspection-areas';

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
  const defaultSet = useMemo(
    () => new Set(definition.defaultSections),
    [definition.defaultSections],
  );

  const sectionPickerOptions = useMemo(() => {
    const merged = new Set<string>([
      ...definition.optionalSections,
      ...COMMON_DEFAULT_SECTIONS,
    ]);
    return [...merged];
  }, [definition.optionalSections]);

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

      <AddSectionControl
        optionalSections={sectionPickerOptions}
        activeSections={activeSections}
        busy={busy}
        onAddSection={onAddSection}
      />
    </div>
  );
}
