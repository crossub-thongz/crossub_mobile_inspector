'use client';

import { useParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, Mic, Plus } from 'lucide-react';
import { toast } from 'sonner';

import { AddCustomAreaDialog } from '@/components/inspector/add-custom-area-dialog';
import { AreaAvailablePrompt } from '@/components/inspector/area-available-prompt';
import { InspectionAreaSetupPanel } from '@/components/inspector/inspection-area-setup-panel';
import { InspectionSectionPhotos } from '@/components/inspector/inspection-section-photos';
import { InspectorShell } from '@/components/layout/inspector-shell';
import { JobWorkflowToolbar } from '@/components/inspector/job-workflow-toolbar';
import { useInspectorData } from '@/components/providers/inspector-data-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  sectionAreaName,
} from '@/constants/inspection-areas';
import { jobDetail, ROUTES } from '@/constants/routes';
import { useFinishInspection } from '@/hooks/use-finish-inspection';
import { useInspectionExecutionDraft } from '@/hooks/use-inspection-execution-draft';
import type { InspectorFindingAreaPayload } from '@/lib/crossub-api/inspector-client';
import { fetchInspectionDetail } from '@/lib/crossub-api/inspector-client';
import {
  applyIngoingDetailPhotos,
  emptyIngoingEntry,
  mergeIngoingExecutionDraft,
} from '@/lib/inspection-execution-hydration';
import type { IngoingAreaEntryDraft, IngoingExecutionDraft } from '@/lib/inspection-execution-draft';
import {
  buildExecutionAreaCatalog,
  inferSelectedAreaNamesFromDraft,
  normalizeCustomAreaName,
  type CustomAreaSectionMode,
} from '@/lib/custom-inspection-areas';
import { inspectionPhotoAreaLabel } from '@/lib/inspection-area-photos';
import {
  useInspectionFinishedGate,
  useInspectionInProgress,
  useKeyCollectGate,
} from '@/hooks/use-key-collect-gate';
import { cn } from '@/lib/utils';

const CONDITIONS = ['Excellent', 'Good', 'Fair', 'Poor', 'Damaged'];

type AreaEntry = IngoingAreaEntryDraft;

function emptyEntry(areaName: string, customAreas: IngoingExecutionDraft['customAreas']): AreaEntry {
  return emptyIngoingEntry(areaName, customAreas ?? []);
}

export default function IngoingInspectionPage() {
  const { id } = useParams<{ id: string }>();
  const {
    getJob,
    commitInspectionAreaPhotos,
    uploadInspectionPhotos,
    saveInspectionFindings,
    updateJobStatus,
    apiConnected,
  } = useInspectorData();
  const job = getJob(id);
  const { finish: submitInspection, Celebration } = useFinishInspection(id);
  useKeyCollectGate(job, id);
  useInspectionFinishedGate(job, id);
  useInspectionInProgress(job, id, updateJobStatus);
  const { draft, setDraft, clearDraft, localDraftLoaded } = useInspectionExecutionDraft(
    id,
    job,
    'ingoing',
    (): IngoingExecutionDraft => ({
      kind: 'ingoing',
      areaIndex: 0,
      entries: {},
      customAreas: [],
      selectedAreaNames: [],
      areaSetupComplete: false,
    }),
  );
  const [busy, setBusy] = useState(false);
  const [addAreaOpen, setAddAreaOpen] = useState(false);
  const serverHydrated = useRef(false);

  useEffect(() => {
    if (!apiConnected || !id || !localDraftLoaded.current || serverHydrated.current) {
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const detail = await fetchInspectionDetail(id);
        if (cancelled) return;
        setDraft((prev) =>
          mergeIngoingExecutionDraft(
            {
              kind: 'ingoing',
              areaIndex: prev.areaIndex,
              entries: applyIngoingDetailPhotos(
                prev.entries,
                detail,
                prev.customAreas ?? [],
              ),
              customAreas: prev.customAreas ?? [],
            },
            prev,
          ),
        );
      } catch {
        // Offline or demo — local draft still applies.
      } finally {
        if (!cancelled) serverHydrated.current = true;
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [apiConnected, id, setDraft, localDraftLoaded]);

  const customAreas = draft.customAreas ?? [];
  const areaSetupComplete =
    draft.areaSetupComplete ?? Object.keys(draft.entries).length > 0;
  const selectedAreaNames =
    draft.selectedAreaNames && draft.selectedAreaNames.length > 0
      ? draft.selectedAreaNames
      : inferSelectedAreaNamesFromDraft(draft.entries, customAreas);
  const areaCatalog = useMemo(
    () =>
      areaSetupComplete
        ? buildExecutionAreaCatalog(selectedAreaNames, customAreas)
        : [],
    [areaSetupComplete, selectedAreaNames, customAreas],
  );
  const areaIndex = Math.min(
    Math.max(draft.areaIndex, 0),
    Math.max(areaCatalog.length - 1, 0),
  );
  const entries = draft.entries;

  const handleAddCustomArea = (name: string, sectionMode: CustomAreaSectionMode) => {
    const normalized = normalizeCustomAreaName(name);
    setDraft((prev) => {
      const nextCustomAreas = [
        ...(prev.customAreas ?? []),
        { name: normalized, sectionMode },
      ];
      const nextSelected = [...(prev.selectedAreaNames ?? []), normalized];
      return {
        ...prev,
        customAreas: nextCustomAreas,
        selectedAreaNames: nextSelected,
        areaIndex: areaSetupComplete ? nextSelected.length - 1 : prev.areaIndex,
        entries: {
          ...prev.entries,
          [normalized]: emptyEntry(normalized, nextCustomAreas),
        },
      };
    });
    toast.success(`Added “${normalized}”`);
  };

  const handleAddBuiltInArea = (name: string) => {
    setDraft((prev) => {
      const nextSelected = [...(prev.selectedAreaNames ?? []), name];
      return {
        ...prev,
        selectedAreaNames: nextSelected,
        entries: {
          ...prev.entries,
          [name]: emptyEntry(name, prev.customAreas ?? []),
        },
      };
    });
  };

  const handleRemoveSetupArea = (name: string) => {
    setDraft((prev) => {
      const nextSelected = (prev.selectedAreaNames ?? []).filter((item) => item !== name);
      const nextEntries = { ...prev.entries };
      delete nextEntries[name];
      const nextCustom = (prev.customAreas ?? []).filter((item) => item.name !== name);
      return {
        ...prev,
        selectedAreaNames: nextSelected,
        customAreas: nextCustom,
        entries: nextEntries,
        areaIndex: Math.min(prev.areaIndex, Math.max(nextSelected.length - 1, 0)),
      };
    });
  };

  const completeAreaSetup = () => {
    setDraft((prev) => ({
      ...prev,
      areaSetupComplete: true,
      areaIndex: 0,
    }));
  };

  if (!job) {
    return (
      <InspectorShell title="Job not found" backHref={ROUTES.INSPECTIONS}>
        <p className="text-muted-foreground text-sm">Job not found.</p>
      </InspectorShell>
    );
  }

  if (!areaSetupComplete) {
    return (
      <>
        <InspectorShell title="Ingoing Inspection" backHref={jobDetail(id)}>
          <div className="space-y-4">
            <JobWorkflowToolbar job={job} />
            <InspectionAreaSetupPanel
              selectedAreaNames={selectedAreaNames}
              customAreas={customAreas}
              busy={busy}
              onAddBuiltInArea={handleAddBuiltInArea}
              onAddCustomArea={handleAddCustomArea}
              onRemoveArea={handleRemoveSetupArea}
              onComplete={completeAreaSetup}
            />
          </div>
        </InspectorShell>
        <AddCustomAreaDialog
          open={addAreaOpen}
          existingCustomAreas={customAreas}
          onClose={() => setAddAreaOpen(false)}
          onConfirm={handleAddCustomArea}
        />
      </>
    );
  }

  if (areaCatalog.length === 0) {
    return (
      <InspectorShell title="Ingoing Inspection" backHref={jobDetail(id)}>
        <p className="text-muted-foreground text-sm">No areas selected for this inspection.</p>
      </InspectorShell>
    );
  }

  const areaDef = areaCatalog[areaIndex];
  const area = areaDef?.name ?? areaCatalog[0]?.name ?? 'Area';
  const entry = entries[area] ?? emptyEntry(area, customAreas);
  const isLast = areaIndex === areaCatalog.length - 1;

  const updateEntry = (patch: Partial<AreaEntry>) => {
    setDraft((prev) => {
      const current = prev.entries[area] ?? emptyEntry(area, prev.customAreas);
      return {
        ...prev,
        entries: { ...prev.entries, [area]: { ...current, ...patch } },
      };
    });
  };

  const goToArea = (index: number) => {
    if (index < 0 || index >= areaCatalog.length) return;
    setDraft((prev) => ({ ...prev, areaIndex: index }));
  };

  const goBackArea = () => {
    if (areaIndex > 0) {
      goToArea(areaIndex - 1);
      return;
    }
    setDraft((prev) => ({ ...prev, areaSetupComplete: false }));
  };

  const markAvailable = (available: boolean) => {
    if (!available) {
      setDraft((prev) => ({
        ...prev,
        entries: {
          ...prev.entries,
          [area]: {
            ...emptyEntry(area, prev.customAreas),
            available: false,
            activeSections: [],
            photosBySection: {},
          },
        },
        areaIndex: !isLast ? prev.areaIndex + 1 : prev.areaIndex,
      }));
      return;
    }
    updateEntry({
      available: true,
      activeSections: [],
      photosBySection: {},
    });
  };

  const addLocalPhotos = async (section: string, sources: Array<File | string>) => {
    if (sources.length === 0) return;
    setBusy(true);
    try {
      const uploadedUrls = await uploadInspectionPhotos(
        id,
        sources,
        inspectionPhotoAreaLabel(area, section, 'single'),
      );
      setDraft((prev) => {
        const current = prev.entries[area] ?? emptyEntry(area, prev.customAreas);
        return {
          ...prev,
          entries: {
            ...prev.entries,
            [area]: {
              ...current,
              photosBySection: {
                ...current.photosBySection,
                [section]: [
                  ...(current.photosBySection[section] ?? []),
                  ...uploadedUrls,
                ],
              },
            },
          },
        };
      });
    } catch {
      toast.error('Could not upload photo');
    } finally {
      setBusy(false);
    }
  };

  const removePhoto = (section: string, index: number) => {
    setDraft((prev) => {
      const current = prev.entries[area] ?? emptyEntry(area, prev.customAreas);
      return {
        ...prev,
        entries: {
          ...prev.entries,
          [area]: {
            ...current,
            photosBySection: {
              ...current.photosBySection,
              [section]: (current.photosBySection[section] ?? []).filter(
                (_, i) => i !== index,
              ),
            },
          },
        },
      };
    });
  };

  const addSection = (section: string) => {
    setDraft((prev) => {
      const current = prev.entries[area] ?? emptyEntry(area, prev.customAreas);
      if (current.activeSections.includes(section)) return prev;
      return {
        ...prev,
        entries: {
          ...prev.entries,
          [area]: {
            ...current,
            activeSections: [...current.activeSections, section],
          },
        },
      };
    });
  };

  const removeSection = (section: string) => {
    if (areaDef.defaultSections.includes(section)) return;
    setDraft((prev) => {
      const current = prev.entries[area] ?? emptyEntry(area, prev.customAreas);
      const nextPhotos = { ...current.photosBySection };
      delete nextPhotos[section];
      return {
        ...prev,
        entries: {
          ...prev.entries,
          [area]: {
            ...current,
            activeSections: current.activeSections.filter((s) => s !== section),
            photosBySection: nextPhotos,
          },
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
      setDraft((prev) => ({
        ...prev,
        entries: finalEntries,
        areaIndex: isLast ? prev.areaIndex : prev.areaIndex + 1,
      }));

      if (isLast) {
        await finalizeAndSubmit(finalEntries);
        return;
      }
    } catch {
      toast.error('Photo upload failed — please retry');
    } finally {
      setBusy(false);
    }
  };

  const finalizeAndSubmit = async (finalEntries: Record<string, AreaEntry>) => {
    // Ensure skipped trailing areas are recorded if user finishes from an earlier revisit.
    const findings: InspectorFindingAreaPayload[] = [];
    for (const def of areaCatalog) {
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
    for (const def of areaCatalog) {
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
    clearDraft();
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

          <div className="space-y-2">
            <div className="flex gap-1">
              {areaCatalog.map((a, i) => (
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
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setAddAreaOpen(true)}
            >
              <Plus className="size-4" />
              Add area
            </Button>
          </div>

          {entry.available == null ? (
            <AreaAvailablePrompt
              areaName={area}
              areaIndex={areaIndex}
              totalAreas={areaCatalog.length}
              onYes={() => markAvailable(true)}
              onNo={() => markAvailable(false)}
            />
          ) : entry.available === false ? (
            <Card>
              <CardHeader>
                <CardTitle>
                  {area} — skipped ({areaIndex + 1}/{areaCatalog.length})
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
                      activeSections: [],
                      photosBySection: {},
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
                    onClick={goBackArea}
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
                  {area} ({areaIndex + 1}/{areaCatalog.length})
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
                    disabled={busy}
                    onClick={goBackArea}
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
      <AddCustomAreaDialog
        open={addAreaOpen}
        existingCustomAreas={customAreas}
        onClose={() => setAddAreaOpen(false)}
        onConfirm={handleAddCustomArea}
      />
    </>
  );
}
