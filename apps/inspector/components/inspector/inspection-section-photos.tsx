'use client';

import { X } from 'lucide-react';
import { useMemo } from 'react';

import { AddSectionControl } from '@/components/inspector/add-section-control';
import { InspectionAreaPhotosField } from '@/components/inspector/inspection-area-photos-field';
import type { InspectionAreaDefinition } from '@/constants/inspection-areas';
import { COMMON_DEFAULT_SECTIONS } from '@/constants/inspection-areas';

type InspectionSectionPhotosProps = {
  definition: InspectionAreaDefinition;
  activeSections: string[];
  photosBySection: Record<string, string[]>;
  busy?: boolean;
  onAddSection: (section: string) => void;
  onRemoveSection: (section: string) => void;
  onAddFiles: (section: string, files: File[]) => void | Promise<void>;
  onAddDataUrl: (section: string, dataUrl: string) => void | Promise<void>;
  onRemovePhoto: (section: string, index: number) => void;
};

export function InspectionSectionPhotos({
  definition,
  activeSections,
  photosBySection,
  busy = false,
  onAddSection,
  onRemoveSection,
  onAddFiles,
  onAddDataUrl,
  onRemovePhoto,
}: InspectionSectionPhotosProps) {
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
          const urls = photosBySection[section] ?? [];
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
              <InspectionAreaPhotosField
                label="Photos"
                photoUrls={urls}
                uploading={busy}
                emptyLabel="Snap or upload at least one photo for this section."
                onAddFiles={(files) => onAddFiles(section, files)}
                onAddDataUrl={(dataUrl) => onAddDataUrl(section, dataUrl)}
                onRemove={(index) => onRemovePhoto(section, index)}
              />
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
