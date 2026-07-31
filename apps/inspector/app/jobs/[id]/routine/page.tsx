'use client';

import { useParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';

import { AreaAvailablePrompt } from '@/components/inspector/area-available-prompt';
import { InspectionAreaNav } from '@/components/inspector/inspection-area-nav';
import { InspectionAreaSetupPanel } from '@/components/inspector/inspection-area-setup-panel';
import {
  OutgoingSectionPhotos,
  type SectionBeforeAfter,
} from '@/components/inspector/outgoing-section-photos';
import { JobLookupFallback } from '@/components/inspector/job-lookup-fallback';
import { KeyCollectionRequired } from '@/components/inspector/key-collection-required';
import { InspectorShell } from '@/components/layout/inspector-shell';
import { JobWorkflowToolbar } from '@/components/inspector/job-workflow-toolbar';
import { ResetInspectionDialog } from '@/components/inspector/reset-inspection-dialog';
import { useInspectorData } from '@/components/providers/inspector-data-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  sectionAreaName,
} from '@/constants/inspection-areas';
import {
  buildExecutionAreaCatalog,
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
import {
  existingAreaNamesFromPlan,
  isAreaSetupComplete,
  resolveIngoingAreaPlan,
  sectionsForAvailableArea,
} from '@/lib/inspection-area-workflow';
import {
  referenceIngoingAreaPlan,
  type IngoingAreaPlan,
} from '@/lib/ingoing-area-plan';
import { matchReferenceSectionPhotos } from '@/lib/outgoing-reference-photos';
import { jobLookupMiss } from '@/lib/job-lookup';

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
    jobsHydrated,
  } = useInspectorData();
  const job = getJob(id);
  const { finish: submitInspection, Celebration } = useFinishInspection(id);
  const keysCollected = useKeyCollectGate(job, id);
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
  const [ingoingAreaPlan, setIngoingAreaPlan] = useState<IngoingAreaPlan | null>(
    null,
  );
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
        const plan = resolveIngoingAreaPlan(
          referenceIngoingAreaPlan(detail),
          refAreas,
        );
        setIngoingAreaPlan(plan);

        setDraft((prev) => {
          const hasUserProgress =
            prev.areaSetupComplete === true ||
            (prev.selectedAreaNames?.length ?? 0) > 0 ||
            Object.values(prev.issues).some((issue) => issue.available != null);

          if (!hasUserProgress) {
            return prev;
          }

          const nextIssues: Record<string, AreaIssue> = { ...prev.issues };
          for (const name of prev.selectedAreaNames ?? []) {
            if (nextIssues[name]) continue;
            nextIssues[name] = emptyAreaIssue(name);
          }

          const withServerPhotos = applyRoutineDetailPhotos(nextIssues, detail);
          return mergeRoutineExecutionDraft(
            {
              kind: 'routine',
              areaIndex: prev.areaIndex,
              method: prev.method,
              issues: withServerPhotos,
              selectedAreaNames: prev.selectedAreaNames,
            },
            prev,
          );
        });

        setIngoingFromReference(Boolean(reference) || refAreas.length > 0);
        if (plan?.rooms.length) {
          toast.success(
            `Loaded ${plan.rooms.length} area(s) from the ingoing report`,
          );
        } else if (reference) {
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
  const areaSetupComplete = isAreaSetupComplete(draft);
  const ingoingExistingAreas = existingAreaNamesFromPlan(ingoingAreaPlan);
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

  const addAllFromIngoing = () => {
    const names = ingoingExistingAreas.filter(
      (name) =>
        !selectedAreaNames.some(
          (selected) => selected.toLowerCase() === name.toLowerCase(),
        ),
    );
    if (names.length === 0) return;
    setDraft((prev) => {
      const nextSelected = [...(prev.selectedAreaNames ?? []), ...names];
      const nextIssues = { ...prev.issues };
      for (const name of names) {
        if (!nextIssues[name]) nextIssues[name] = emptyAreaIssue(name);
      }
      return {
        ...prev,
        selectedAreaNames: nextSelected,
        issues: nextIssues,
      };
    });
    toast.success(`Added ${names.length} area(s) from the ingoing report`);
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
      <JobLookupFallback
        state={jobLookupMiss(jobsHydrated)}
        backHref={ROUTES.INSPECTIONS}
      />
    );
  }

  // The redirect useKeyCollectGate asks for is asynchronous and can fail; rendering
  // the workflow in the meantime is how a whole field pass gets typed into a screen
  // whose writes the API rejects.
  if (!keysCollected) {
    return <KeyCollectionRequired jobId={id} />;
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
              existingAreaNames={ingoingExistingAreas}
              continuing={selectedAreaNames.length > 0 || areaIndex > 0}
              busy={busy || loadingReference}
              onAddBuiltInArea={handleAddBuiltInArea}
              onAddCustomArea={handleAddCustomArea}
              onRemoveArea={handleRemoveSetupArea}
              onAddAllExisting={ingoingExistingAreas.length > 0 ? addAllFromIngoing : undefined}
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

    const sections = sectionsForAvailableArea(
      area,
      customAreas,
      ingoingAreaPlan,
      'routine',
    );
    const photosBySection: Record<string, SectionBeforeAfter> = {
      ...(issue.photosBySection ?? {}),
    };
    for (const section of sections) {
      if (!photosBySection[section]) {
        photosBySection[section] = {
          ...emptySectionPhotos(),
          ingoingPhotoUrls: seedSectionIngoing(section),
        };
      } else if (
        photosBySection[section].ingoingPhotoUrls.length === 0 &&
        ingoingFromReference
      ) {
        photosBySection[section] = {
          ...photosBySection[section],
          ingoingPhotoUrls: seedSectionIngoing(section),
        };
      }
    }
    updateIssue({
      available: true,
      activeSections: [...sections],
      photosBySection,
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
    const saved = await saveInspectionFindings(id, [
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
    // The draft is the only other copy of the field pass. Clearing it after a save
    // that never reached the server threw the whole inspection away and still marked
    // the job finished, so the workflow refused to reopen.
    if (!saved) {
      toast.error('Report not submitted — your photos and notes are still here', {
        description:
          'The findings could not be saved. Check your connection and complete the report again.',
      });
      return;
    }
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

          <InspectionAreaNav
            areaCatalog={areaCatalog}
            areaIndex={areaIndex}
            progressTone={progressTone}
            onGoToArea={goToArea}
          />

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
