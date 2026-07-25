'use client';

import { useParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';

import { AreaAvailablePrompt } from '@/components/inspector/area-available-prompt';
import { InspectionAreaSetupPanel } from '@/components/inspector/inspection-area-setup-panel';
import {
  OutgoingSectionPhotos,
  type SectionBeforeAfter,
} from '@/components/inspector/outgoing-section-photos';
import { InspectorShell } from '@/components/layout/inspector-shell';
import { ResetInspectionDialog } from '@/components/inspector/reset-inspection-dialog';
import { useInspectorData } from '@/components/providers/inspector-data-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  INSPECTION_AREA_CATALOG,
  sectionAreaName,
} from '@/constants/inspection-areas';
import {
  buildEffectiveAreaCatalog,
  buildExecutionAreaCatalog,
  customAreaToDefinition,
  inferSelectedAreaNamesFromDraft,
  normalizeCustomAreaName,
  type CustomAreaSectionMode,
} from '@/lib/custom-inspection-areas';
import { jobDetail, ROUTES } from '@/constants/routes';
import { useFinishInspection } from '@/hooks/use-finish-inspection';
import { useInspectionExecutionDraft } from '@/hooks/use-inspection-execution-draft';
import { inspectionPhotoAreaLabel } from '@/lib/inspection-area-photos';
import {
  useInspectionFinishedGate,
  useInspectionInProgress,
  useKeyCollectGate,
} from '@/hooks/use-key-collect-gate';
import { fetchInspectionDetail, clearInspectionAreaPhotos } from '@/lib/crossub-api/inspector-client';
import {
  applyRoutineDetailPhotos,
  emptyRoutineIssue,
  mergeRoutineExecutionDraft,
} from '@/lib/inspection-execution-hydration';
import type { RoutineAreaIssueDraft, RoutineExecutionDraft } from '@/lib/inspection-execution-draft';
import { matchReferenceSectionPhotos } from '@/lib/outgoing-reference-photos';
import { cn } from '@/lib/utils';

type AreaIssue = RoutineAreaIssueDraft;

const emptySectionPhotos = (): SectionBeforeAfter => ({
  ingoingPhotoUrls: [],
  outgoingPhotoUrls: [],
});

function emptyAreaIssue(areaName: string): AreaIssue {
  return emptyRoutineIssue(areaName);
}

export default function RoutineInspectionPage() {
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

  const { draft, setDraft, clearDraft, resetDraft, localDraftLoaded } =
    useInspectionExecutionDraft(id, job, 'routine', (): RoutineExecutionDraft => ({
      kind: 'routine',
      areaIndex: 0,
      method: 'physical',
      issues: {},
      customAreas: [],
      selectedAreaNames: [],
      areaSetupComplete: false,
    }));
  const [busy, setBusy] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [loadingReference, setLoadingReference] = useState(apiConnected);
  const [ingoingFromReference, setIngoingFromReference] = useState(false);
  const [referenceAreas, setReferenceAreas] = useState<
    Array<{ name: string; photos: Array<{ url: string }> }>
  >([]);
  const serverHydrated = useRef(false);

  useEffect(() => {
    if (!apiConnected || !id) {
      setLoadingReference(false);
      return;
    }
    if (!localDraftLoaded.current || serverHydrated.current) return;

    let cancelled = false;
    setLoadingReference(true);
    void (async () => {
      try {
        const detail = await fetchInspectionDetail(id);
        if (cancelled) return;
        const reference = detail.referenceIngoing;
        const refAreas = reference?.areas ?? [];
        setReferenceAreas(refAreas);

        const nextIssues: Record<string, AreaIssue> = {};
        let seeded = false;
        const catalogForHydration = buildEffectiveAreaCatalog([]);
        for (const def of catalogForHydration) {
          const photosBySection: Record<string, SectionBeforeAfter> = {};
          for (const section of def.defaultSections) {
            const referenceUrls = reference
              ? matchReferenceSectionPhotos(def.name, section, refAreas)
              : [];
            if (referenceUrls.length > 0) seeded = true;
            photosBySection[section] = {
              ...emptySectionPhotos(),
              ingoingPhotoUrls: referenceUrls,
            };
          }
          nextIssues[def.name] = {
            ...emptyAreaIssue(def.name),
            photosBySection,
          };
        }

        const withServerPhotos = applyRoutineDetailPhotos(nextIssues, detail);
        setDraft((prev) =>
          mergeRoutineExecutionDraft(
            {
              kind: 'routine',
              areaIndex: prev.areaIndex,
              method: prev.method,
              issues: withServerPhotos,
            },
            prev,
          ),
        );
        setIngoingFromReference(seeded || Boolean(reference));
        if (reference && seeded) {
          toast.success('Latest ingoing photos loaded for comparison');
        } else if (!reference) {
          toast.message('No completed ingoing report found for this property');
        }
      } catch {
        if (!cancelled) toast.error('Could not load latest ingoing photos');
      } finally {
        if (!cancelled) {
          setLoadingReference(false);
          serverHydrated.current = true;
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [apiConnected, id, setDraft, localDraftLoaded]);

  const method = draft.method;
  const customAreas = draft.customAreas ?? [];
  const areaSetupComplete =
    draft.areaSetupComplete ?? Object.keys(draft.issues).length > 0;
  const selectedAreaNames =
    draft.selectedAreaNames && draft.selectedAreaNames.length > 0
      ? draft.selectedAreaNames
      : inferSelectedAreaNamesFromDraft(draft.issues, customAreas);
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
  const issues = draft.issues;

  const resetInspection = async () => {
    setResetOpen(false);
    setBusy(true);
    try {
      if (apiConnected) {
        try {
          const detail = await fetchInspectionDetail(id);
          const areaNames = [
            ...new Set(
              detail.areas
                .map((area) => area.name?.trim())
                .filter((name): name is string => Boolean(name)),
            ),
          ];
          await Promise.all(
            areaNames.map((areaName) => clearInspectionAreaPhotos(id, areaName)),
          );
        } catch {
          // Best effort — local reset still applies.
        }
      }
      resetDraft();
      toast.success('Routine inspection reset — start again from area setup');
    } catch {
      toast.error('Could not reset inspection');
    } finally {
      setBusy(false);
    }
  };

  const resetControls = (
    <>
      <Button
        type="button"
        variant="outline"
        className="border-destructive/40 text-destructive hover:bg-destructive/10 w-full"
        disabled={busy || loadingReference}
        onClick={() => setResetOpen(true)}
      >
        Reset inspection
      </Button>
      <ResetInspectionDialog
        open={resetOpen}
        busy={busy}
        onClose={() => setResetOpen(false)}
        onConfirm={() => void resetInspection()}
      />
    </>
  );

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
        issues: {
          ...prev.issues,
          [normalized]: emptyAreaIssue(normalized),
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
        issues: {
          ...prev.issues,
          [name]: emptyAreaIssue(name),
        },
      };
    });
  };

  const handleRemoveSetupArea = (name: string) => {
    setDraft((prev) => {
      const nextSelected = (prev.selectedAreaNames ?? []).filter((item) => item !== name);
      const nextIssues = { ...prev.issues };
      delete nextIssues[name];
      const nextCustom = (prev.customAreas ?? []).filter((item) => item.name !== name);
      return {
        ...prev,
        selectedAreaNames: nextSelected,
        customAreas: nextCustom,
        issues: nextIssues,
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

  function seedSectionIngoingForArea(areaName: string, section: string): string[] {
    if (!ingoingFromReference || referenceAreas.length === 0) return [];
    return matchReferenceSectionPhotos(areaName, section, referenceAreas);
  }

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
        <InspectorShell title="Routine Inspection" backHref={jobDetail(id)}>
          <div className="space-y-4">
            <JobWorkflowToolbar job={job} />
            {resetControls}
            <InspectionAreaSetupPanel
              selectedAreaNames={selectedAreaNames}
              customAreas={customAreas}
              busy={busy || loadingReference}
              onAddBuiltInArea={handleAddBuiltInArea}
              onAddCustomArea={handleAddCustomArea}
              onRemoveArea={handleRemoveSetupArea}
              onComplete={completeAreaSetup}
            />
          </div>
        </InspectorShell>
      </>
    );
  }

  if (areaCatalog.length === 0) {
    return (
      <InspectorShell title="Routine Inspection" backHref={jobDetail(id)}>
        <p className="text-muted-foreground text-sm">No areas selected for this inspection.</p>
      </InspectorShell>
    );
  }

  const areaDef = areaCatalog[areaIndex];
  const area = areaDef?.name ?? areaCatalog[0]?.name ?? 'Area';
  const issue = issues[area] ?? emptyAreaIssue(area);
  const isLast = areaIndex === areaCatalog.length - 1;

  const updateIssue = (patch: Partial<AreaIssue>) => {
    setDraft((prev) => {
      const current = prev.issues[area] ?? emptyAreaIssue(area);
      return {
        ...prev,
        issues: { ...prev.issues, [area]: { ...current, ...patch } },
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

  const seedSectionIngoing = (section: string): string[] =>
    seedSectionIngoingForArea(area, section);

  const markAvailable = (available: boolean) => {
    if (!available) {
      setDraft((prev) => ({
        ...prev,
        issues: {
          ...prev.issues,
          [area]: {
            ...emptyAreaIssue(area),
            available: false,
            activeSections: [],
            photosBySection: {},
          },
        },
        areaIndex: !isLast ? prev.areaIndex + 1 : prev.areaIndex,
      }));
      return;
    }
    updateIssue({
      available: true,
      activeSections: [],
      photosBySection: {},
    });
  };

  const addLocalPhotos = async (
    section: string,
    side: 'ingoing' | 'outgoing',
    sources: Array<File | string>,
  ) => {
    if (sources.length === 0) return;
    const current = issues[area] ?? emptyAreaIssue(area);
    const sectionPhotos = current.photosBySection[section] ?? emptySectionPhotos();
    if (
      side === 'ingoing' &&
      ingoingFromReference &&
      sectionPhotos.ingoingPhotoUrls.length > 0
    ) {
      return;
    }
    setBusy(true);
    try {
      const uploadedUrls = await uploadInspectionPhotos(
        id,
        sources,
        inspectionPhotoAreaLabel(area, section, side === 'ingoing' ? 'ingoing' : 'single'),
      );
      setDraft((prev) => {
        const rec = prev.issues[area] ?? emptyAreaIssue(area);
        const existing = rec.photosBySection[section] ?? emptySectionPhotos();
        const key = side === 'ingoing' ? 'ingoingPhotoUrls' : 'outgoingPhotoUrls';
        return {
          ...prev,
          issues: {
            ...prev.issues,
            [area]: {
              ...rec,
              photosBySection: {
                ...rec.photosBySection,
                [section]: {
                  ...existing,
                  [key]: [...existing[key], ...uploadedUrls],
                },
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

  const removePhoto = (
    section: string,
    side: 'ingoing' | 'outgoing',
    index: number,
  ) => {
    const current = issues[area] ?? emptyAreaIssue(area);
    const sectionPhotos = current.photosBySection[section] ?? emptySectionPhotos();
    if (
      side === 'ingoing' &&
      ingoingFromReference &&
      sectionPhotos.ingoingPhotoUrls.length > 0
    ) {
      return;
    }
    setDraft((prev) => {
      const rec = prev.issues[area] ?? emptyAreaIssue(area);
      const existing = rec.photosBySection[section] ?? emptySectionPhotos();
      const key = side === 'ingoing' ? 'ingoingPhotoUrls' : 'outgoingPhotoUrls';
      return {
        ...prev,
        issues: {
          ...prev.issues,
          [area]: {
            ...rec,
            photosBySection: {
              ...rec.photosBySection,
              [section]: {
                ...existing,
                [key]: existing[key].filter((_, i) => i !== index),
              },
            },
          },
        },
      };
    });
  };

  const addSection = (section: string) => {
    setDraft((prev) => {
      const current = prev.issues[area] ?? emptyAreaIssue(area);
      if (current.activeSections.includes(section)) return prev;
      return {
        ...prev,
        issues: {
          ...prev.issues,
          [area]: {
            ...current,
            activeSections: [...current.activeSections, section],
            photosBySection: {
              ...current.photosBySection,
              [section]: {
                ...emptySectionPhotos(),
                ingoingPhotoUrls: seedSectionIngoing(section),
              },
            },
          },
        },
      };
    });
  };

  const removeSection = (section: string) => {
    if (areaDef.defaultSections.includes(section)) return;
    setDraft((prev) => {
      const current = prev.issues[area] ?? emptyAreaIssue(area);
      const nextPhotos = { ...current.photosBySection };
      delete nextPhotos[section];
      return {
        ...prev,
        issues: {
          ...prev.issues,
          [area]: {
            ...current,
            activeSections: current.activeSections.filter((s) => s !== section),
            photosBySection: nextPhotos,
          },
        },
      };
    });
  };

  const finalizeAndSubmit = async (finalIssues: Record<string, AreaIssue>) => {
    await saveInspectionFindings(id, [
      {
        name: 'General',
        items: [
          {
            name: 'Method',
            comment:
              method === 'physical'
                ? 'Physical inspection'
                : 'Tenant self-assessment review',
          },
        ],
      },
      ...areaCatalog.filter((def) => {
        const rec = finalIssues[def.name];
        return rec?.available === true;
      }).map((def) => {
        const rec = finalIssues[def.name];
        return {
          name: def.name,
          items: [
            ...(rec.notes.trim()
              ? [{ name: 'Notes', comment: rec.notes.trim() }]
              : []),
            ...rec.activeSections.map((section) => ({
              name: section,
              comment: undefined as string | undefined,
            })),
          ],
        };
      }),
    ]);
    clearDraft();
    submitInspection('Routine report sent to agent and landlord');
  };

  const next = async () => {
    if (issue.available !== true) {
      toast.error('Confirm whether this area is available');
      return;
    }
    if (issue.activeSections.length === 0) {
      toast.error('Add at least one section to photograph, or skip this area');
      return;
    }
    for (const section of issue.activeSections) {
      const photos = issue.photosBySection[section] ?? emptySectionPhotos();
      if (!photos.outgoingPhotoUrls.length) {
        toast.error(`Add at least one routine photo for “${section}”`);
        return;
      }
    }

    setBusy(true);
    try {
      const nextPhotos: Record<string, SectionBeforeAfter> = {
        ...issue.photosBySection,
      };
      for (const section of issue.activeSections) {
        const photos = issue.photosBySection[section] ?? emptySectionPhotos();
        const uploaded = await commitInspectionAreaPhotos(
          id,
          sectionAreaName(area, section),
          photos.outgoingPhotoUrls,
        );
        nextPhotos[section] = {
          ...photos,
          outgoingPhotoUrls: uploaded,
        };
      }
      const committed: AreaIssue = { ...issue, photosBySection: nextPhotos };
      const nextIssues = { ...issues, [area]: committed };
      setDraft((prev) => ({
        ...prev,
        issues: nextIssues,
        areaIndex: isLast ? prev.areaIndex : prev.areaIndex + 1,
      }));
      if (isLast) {
        await finalizeAndSubmit(nextIssues);
        return;
      }
    } catch {
      toast.error('Photo upload failed — please retry');
    } finally {
      setBusy(false);
    }
  };

  const completeFromSkippedLast = async () => {
    setBusy(true);
    try {
      await finalizeAndSubmit(issues);
    } catch {
      toast.error('Could not complete the report');
    } finally {
      setBusy(false);
    }
  };

  const progressTone = (index: number, areaName: string) => {
    const rec = issues[areaName];
    if (index === areaIndex) return 'bg-primary';
    if (rec?.available === false) return 'bg-muted-foreground/40';
    if (rec?.available === true) return 'bg-primary/70';
    if (index < areaIndex) return 'bg-primary/40';
    return 'bg-secondary';
  };

  return (
    <>
      <InspectorShell title="Routine Inspection" backHref={jobDetail(id)}>
        <div className="space-y-4">
          <JobWorkflowToolbar job={job} />
          {resetControls}

          <div className="flex gap-2">
            <Button
              variant={method === 'physical' ? 'default' : 'outline'}
              className="flex-1"
              onClick={() => setDraft((prev) => ({ ...prev, method: 'physical' }))}
            >
              Physical Inspection
            </Button>
            <Button
              variant={method === 'self' ? 'default' : 'outline'}
              className="flex-1"
              onClick={() => setDraft((prev) => ({ ...prev, method: 'self' }))}
            >
              Self Inspection
            </Button>
          </div>

          <p className="text-muted-foreground text-xs">
            Confirm each area, then photograph sections beside the latest ingoing
            baseline for this property.
          </p>

          {loadingReference ? (
            <p className="text-muted-foreground text-xs">
              Loading latest ingoing photos…
            </p>
          ) : null}

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

          {issue.available == null ? (
            <AreaAvailablePrompt
              areaName={area}
              areaIndex={areaIndex}
              totalAreas={areaCatalog.length}
              onYes={() => markAvailable(true)}
              onNo={() => markAvailable(false)}
            />
          ) : issue.available === false ? (
            <Card>
              <CardHeader>
                <CardTitle>
                  {area} — skipped ({areaIndex + 1}/{areaCatalog.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  disabled={loadingReference}
                  onClick={() => markAvailable(true)}
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
                      disabled={busy || loadingReference}
                      onClick={() => void completeFromSkippedLast()}
                    >
                      {busy ? 'Submitting…' : 'Complete Routine Report'}
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
                <OutgoingSectionPhotos
                  definition={areaDef}
                  activeSections={issue.activeSections}
                  photosBySection={issue.photosBySection}
                  busy={busy || loadingReference}
                  ingoingReadOnly={ingoingFromReference}
                  currentLabel="Routine"
                  onAddSection={addSection}
                  onRemoveSection={removeSection}
                  onAddFiles={(section, side, files) =>
                    addLocalPhotos(section, side, files)
                  }
                  onAddDataUrl={(section, side, dataUrl) =>
                    addLocalPhotos(section, side, [dataUrl])
                  }
                  onRemovePhoto={removePhoto}
                />

                <div className="space-y-2">
                  <Label>Area notes</Label>
                  <Input
                    value={issue.notes}
                    onChange={(e) => updateIssue({ notes: e.target.value })}
                    placeholder={
                      method === 'physical'
                        ? 'Inspector notes'
                        : 'Review notes for tenant submission'
                    }
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
                    disabled={busy || loadingReference}
                    onClick={() => void next()}
                  >
                    {busy
                      ? 'Uploading photos…'
                      : isLast
                        ? 'Complete Routine Report'
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
