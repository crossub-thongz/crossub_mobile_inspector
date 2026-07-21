'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';
import { ChevronLeft, Mic } from 'lucide-react';
import { toast } from 'sonner';

import { AreaAvailablePrompt } from '@/components/inspector/area-available-prompt';
import { InspectionSectionPhotos } from '@/components/inspector/inspection-section-photos';
import { InspectorShell } from '@/components/layout/inspector-shell';
import { JobWorkflowToolbar } from '@/components/inspector/job-workflow-toolbar';
import { useInspectorData } from '@/components/providers/inspector-data-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  INSPECTION_AREA_CATALOG,
  getInspectionAreaDefinition,
  sectionAreaName,
} from '@/constants/inspection-areas';
import { jobDetail, ROUTES } from '@/constants/routes';
import { useFinishInspection } from '@/hooks/use-finish-inspection';
import type { InspectorFindingAreaPayload } from '@/lib/crossub-api/inspector-client';
import { compressPhotoSources } from '@/lib/inspection-area-photos';
import {
  useInspectionFinishedGate,
  useInspectionInProgress,
  useKeyCollectGate,
} from '@/hooks/use-key-collect-gate';
import { cn } from '@/lib/utils';

const CONDITIONS = ['Excellent', 'Good', 'Fair', 'Poor', 'Damaged'];

type AreaEntry = {
  /** null = not answered yet */
  available: boolean | null;
  condition: string;
  comments: string;
  activeSections: string[];
  photosBySection: Record<string, string[]>;
};

function emptyEntry(areaName: string): AreaEntry {
  const def = getInspectionAreaDefinition(areaName);
  return {
    available: null,
    condition: '',
    comments: '',
    activeSections: [...(def?.defaultSections ?? [])],
    photosBySection: {},
  };
}

export default function IngoingInspectionPage() {
  const { id } = useParams<{ id: string }>();
  const {
    getJob,
    commitInspectionAreaPhotos,
    saveInspectionFindings,
    updateJobStatus,
  } = useInspectorData();
  const job = getJob(id);
  const { finish: submitInspection, Celebration } = useFinishInspection(id);
  useKeyCollectGate(job, id);
  useInspectionFinishedGate(job, id);
  useInspectionInProgress(job, id, updateJobStatus);
  const [areaIndex, setAreaIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const [entries, setEntries] = useState<Record<string, AreaEntry>>({});

  if (!job) {
    return (
      <InspectorShell title="Job not found" backHref={ROUTES.INSPECTIONS}>
        <p className="text-muted-foreground text-sm">Job not found.</p>
      </InspectorShell>
    );
  }

  const areaDef = INSPECTION_AREA_CATALOG[areaIndex];
  const area = areaDef.name;
  const entry = entries[area] ?? emptyEntry(area);
  const isLast = areaIndex === INSPECTION_AREA_CATALOG.length - 1;

  const updateEntry = (patch: Partial<AreaEntry>) => {
    setEntries((prev) => {
      const current = prev[area] ?? emptyEntry(area);
      return { ...prev, [area]: { ...current, ...patch } };
    });
  };

  const goToArea = (index: number) => {
    if (index < 0 || index >= INSPECTION_AREA_CATALOG.length) return;
    setAreaIndex(index);
  };

  const markAvailable = (available: boolean) => {
    if (!available) {
      setEntries((prev) => ({
        ...prev,
        [area]: {
          ...emptyEntry(area),
          available: false,
          activeSections: [],
          photosBySection: {},
        },
      }));
      if (!isLast) {
        setAreaIndex((i) => i + 1);
      }
      return;
    }
    updateEntry({
      available: true,
      activeSections: [...areaDef.defaultSections],
    });
  };

  const addLocalPhotos = async (section: string, sources: Array<File | string>) => {
    if (sources.length === 0) return;
    setBusy(true);
    try {
      const previewUrls = await compressPhotoSources(sources);
      setEntries((prev) => {
        const current = prev[area] ?? emptyEntry(area);
        return {
          ...prev,
          [area]: {
            ...current,
            photosBySection: {
              ...current.photosBySection,
              [section]: [
                ...(current.photosBySection[section] ?? []),
                ...previewUrls,
              ],
            },
          },
        };
      });
    } catch {
      toast.error('Could not read the photo');
    } finally {
      setBusy(false);
    }
  };

  const removePhoto = (section: string, index: number) => {
    setEntries((prev) => {
      const current = prev[area] ?? emptyEntry(area);
      return {
        ...prev,
        [area]: {
          ...current,
          photosBySection: {
            ...current.photosBySection,
            [section]: (current.photosBySection[section] ?? []).filter(
              (_, i) => i !== index,
            ),
          },
        },
      };
    });
  };

  const addSection = (section: string) => {
    setEntries((prev) => {
      const current = prev[area] ?? emptyEntry(area);
      if (current.activeSections.includes(section)) return prev;
      return {
        ...prev,
        [area]: {
          ...current,
          activeSections: [...current.activeSections, section],
        },
      };
    });
  };

  const removeSection = (section: string) => {
    if (areaDef.defaultSections.includes(section)) return;
    setEntries((prev) => {
      const current = prev[area] ?? emptyEntry(area);
      const nextPhotos = { ...current.photosBySection };
      delete nextPhotos[section];
      return {
        ...prev,
        [area]: {
          ...current,
          activeSections: current.activeSections.filter((s) => s !== section),
          photosBySection: nextPhotos,
        },
      };
    });
  };

  const saveArea = async () => {
    if (entry.available !== true) {
      toast.error('Confirm whether this area is available');
      return;
    }
    if (!entry.condition) {
      toast.error('Select a condition rating');
      return;
    }
    if (entry.activeSections.length === 0) {
      toast.error('Add at least one section to photograph, or skip this area');
      return;
    }
    const missing = entry.activeSections.find(
      (section) => !(entry.photosBySection[section]?.length > 0),
    );
    if (missing) {
      toast.error(`Add at least one photo for “${missing}”`);
      return;
    }

    setBusy(true);
    try {
      const nextPhotos: Record<string, string[]> = { ...entry.photosBySection };
      for (const section of entry.activeSections) {
        const urls = entry.photosBySection[section] ?? [];
        nextPhotos[section] = await commitInspectionAreaPhotos(
          id,
          sectionAreaName(area, section),
          urls,
        );
      }

      const committedEntry: AreaEntry = {
        ...entry,
        photosBySection: nextPhotos,
      };
      const finalEntries = { ...entries, [area]: committedEntry };
      setEntries(finalEntries);

      if (isLast) {
        await finalizeAndSubmit(finalEntries);
        return;
      }
      setAreaIndex((i) => i + 1);
    } catch {
      toast.error('Photo upload failed — please retry');
    } finally {
      setBusy(false);
    }
  };

  const finalizeAndSubmit = async (finalEntries: Record<string, AreaEntry>) => {
    // Ensure skipped trailing areas are recorded if user finishes from an earlier revisit.
    const findings: InspectorFindingAreaPayload[] = [];
    for (const def of INSPECTION_AREA_CATALOG) {
      const rec = finalEntries[def.name];
      if (!rec || rec.available !== true) continue;
      findings.push({
        name: def.name,
        rating: rec.condition as InspectorFindingAreaPayload['rating'],
        items: [
          ...(rec.comments
            ? [{ name: 'Notes', comment: rec.comments }]
            : []),
          ...rec.activeSections.map((section) => ({
            name: section,
            comment:
              (rec.photosBySection[section]?.length ?? 0) > 0
                ? `${rec.photosBySection[section].length} photo(s)`
                : undefined,
          })),
        ],
      });
    }

    // Also commit any still-local photos for available areas already visited.
    for (const def of INSPECTION_AREA_CATALOG) {
      const rec = finalEntries[def.name];
      if (!rec || rec.available !== true) continue;
      for (const section of rec.activeSections) {
        const urls = rec.photosBySection[section] ?? [];
        if (urls.length === 0) continue;
        const needsUpload = urls.some(
          (u) => u.startsWith('data:') || u.startsWith('blob:'),
        );
        if (!needsUpload) continue;
        await commitInspectionAreaPhotos(
          id,
          sectionAreaName(def.name, section),
          urls,
        );
      }
    }

    await saveInspectionFindings(id, findings);
    submitInspection('Ingoing report sent to tenant, agent, and landlord');
  };

  const completeFromSkippedLast = async () => {
    // Last area was skipped — still allow finishing the report.
    setBusy(true);
    try {
      await finalizeAndSubmit(entries);
    } catch {
      toast.error('Could not complete the report');
    } finally {
      setBusy(false);
    }
  };

  const progressTone = (index: number, areaName: string) => {
    const rec = entries[areaName];
    if (index === areaIndex) return 'bg-primary';
    if (rec?.available === false) return 'bg-muted-foreground/40';
    if (rec?.available === true && rec.condition) return 'bg-primary/70';
    if (index < areaIndex) return 'bg-primary/40';
    return 'bg-secondary';
  };

  return (
    <>
      <InspectorShell title="Ingoing Inspection" backHref={jobDetail(id)}>
        <div className="space-y-4">
          <JobWorkflowToolbar job={job} />

          <div className="flex gap-1">
            {INSPECTION_AREA_CATALOG.map((a, i) => (
              <button
                key={a.name}
                type="button"
                title={a.name}
                aria-label={`Go to ${a.name}`}
                className={cn('h-1.5 flex-1 rounded-full', progressTone(i, a.name))}
                onClick={() => goToArea(i)}
              />
            ))}
          </div>

          {entry.available == null ? (
            <AreaAvailablePrompt
              areaName={area}
              areaIndex={areaIndex}
              totalAreas={INSPECTION_AREA_CATALOG.length}
              onYes={() => markAvailable(true)}
              onNo={() => markAvailable(false)}
            />
          ) : entry.available === false ? (
            <Card>
              <CardHeader>
                <CardTitle>
                  {area} — skipped ({areaIndex + 1}/{INSPECTION_AREA_CATALOG.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-muted-foreground text-sm">
                  This area was marked unavailable. You can change that and photograph
                  it, or continue.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() =>
                    updateEntry({
                      available: true,
                      activeSections: [...areaDef.defaultSections],
                    })
                  }
                >
                  Mark available & photograph
                </Button>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    disabled={areaIndex === 0}
                    onClick={() => goToArea(areaIndex - 1)}
                  >
                    <ChevronLeft className="size-4" />
                    Back
                  </Button>
                  {isLast ? (
                    <Button
                      type="button"
                      className="flex-1"
                      disabled={busy}
                      onClick={() => void completeFromSkippedLast()}
                    >
                      {busy ? 'Submitting…' : 'Complete & Send Report'}
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      className="flex-1"
                      onClick={() => goToArea(areaIndex + 1)}
                    >
                      Next Area
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>
                  {area} ({areaIndex + 1}/{INSPECTION_AREA_CATALOG.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Condition</Label>
                  <div className="flex flex-wrap gap-2">
                    {CONDITIONS.map((c) => (
                      <Button
                        key={c}
                        size="sm"
                        variant={entry.condition === c ? 'default' : 'outline'}
                        onClick={() => updateEntry({ condition: c })}
                      >
                        {c}
                      </Button>
                    ))}
                  </div>
                </div>

                <InspectionSectionPhotos
                  definition={areaDef}
                  activeSections={entry.activeSections}
                  photosBySection={entry.photosBySection}
                  busy={busy}
                  onAddSection={addSection}
                  onRemoveSection={removeSection}
                  onAddFiles={(section, files) => addLocalPhotos(section, files)}
                  onAddDataUrl={(section, dataUrl) =>
                    addLocalPhotos(section, [dataUrl])
                  }
                  onRemovePhoto={removePhoto}
                />

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    Comments
                    <Mic className="size-3.5 text-muted-foreground" />
                  </Label>
                  <Input
                    placeholder="Room condition notes (voice-to-text supported)"
                    value={entry.comments}
                    onChange={(ev) => updateEntry({ comments: ev.target.value })}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    disabled={areaIndex === 0 || busy}
                    onClick={() => goToArea(areaIndex - 1)}
                  >
                    <ChevronLeft className="size-4" />
                    Back
                  </Button>
                  <Button
                    className="flex-[2]"
                    disabled={busy}
                    onClick={() => void saveArea()}
                  >
                    {busy
                      ? 'Uploading photos…'
                      : isLast
                        ? 'Complete & Send Report'
                        : 'Next Area'}
                  </Button>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full text-muted-foreground"
                  disabled={busy}
                  onClick={() => markAvailable(false)}
                >
                  Skip this area instead
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </InspectorShell>
      {Celebration}
    </>
  );
}
