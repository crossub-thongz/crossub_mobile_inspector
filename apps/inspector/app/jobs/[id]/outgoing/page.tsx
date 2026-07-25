'use client';

import { useParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, Plus } from 'lucide-react';
import { toast } from 'sonner';

import { AddCustomAreaDialog } from '@/components/inspector/add-custom-area-dialog';
import { AreaAvailablePrompt } from '@/components/inspector/area-available-prompt';
import {
  OutgoingSectionPhotos,
  type SectionBeforeAfter,
} from '@/components/inspector/outgoing-section-photos';
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
import { compressPhotoSources } from '@/lib/inspection-area-photos';
import {
  useInspectionFinishedGate,
  useInspectionInProgress,
  useKeyCollectGate,
} from '@/hooks/use-key-collect-gate';
import { fetchInspectionDetail } from '@/lib/crossub-api/inspector-client';
import {
  applyOutgoingDetailPhotos,
  emptyOutgoingIssue,
  mergeOutgoingExecutionDraft,
} from '@/lib/inspection-execution-hydration';
import type { OutgoingAreaIssueDraft, OutgoingExecutionDraft } from '@/lib/inspection-execution-draft';
import {
  buildEffectiveAreaCatalog,
  isCustomAreaName,
  normalizeCustomAreaName,
  type CustomAreaSectionMode,
} from '@/lib/custom-inspection-areas';
import {
  matchReferenceSectionPhotos,
  outgoingSavedIngoingPhotos,
} from '@/lib/outgoing-reference-photos';
import {
  buildOutgoingIssueSeed,
  outgoingSectionsForRoom,
  referenceIngoingAreaPlan,
  type IngoingAreaPlan,
} from '@/lib/ingoing-area-plan';
import { cn } from '@/lib/utils';

const RESPONSIBILITY = [
  'Tenant Responsible',
  'Landlord Responsible',
  'Fair Wear & Tear',
] as const;

type AreaIssue = OutgoingAreaIssueDraft;

const emptySectionPhotos = (): SectionBeforeAfter => ({
  ingoingPhotoUrls: [],
  outgoingPhotoUrls: [],
});

function emptyAreaIssue(
  areaName: string,
  seed?: { available: boolean | null; activeSections: string[] },
  customAreas?: OutgoingExecutionDraft['customAreas'],
): AreaIssue {
  return emptyOutgoingIssue(areaName, seed, customAreas ?? []);
}

export default function OutgoingInspectionPage() {
  const { id } = useParams<{ id: string }>();
  const {
    getJob,
    commitInspectionAreaPhotos,
    saveInspectionFindings,
    updateJobStatus,
    apiConnected,
  } = useInspectorData();
  const job = getJob(id);
  const { finish: submitInspection, Celebration } = useFinishInspection(id);
  useKeyCollectGate(job, id);
  useInspectionFinishedGate(job, id);
  useInspectionInProgress(job, id, updateJobStatus);

  const { draft, setDraft, clearDraft, localDraftLoaded } =
    useInspectionExecutionDraft(id, job, 'outgoing', () => ({
      kind: 'outgoing',
      areaIndex: 0,
      issues: {},
      customAreas: [],
    }));
  const [busy, setBusy] = useState(false);
  const [addAreaOpen, setAddAreaOpen] = useState(false);
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
        const plan = referenceIngoingAreaPlan(detail);
        setIngoingAreaPlan(plan);

        setDraft((prev) => {
          const catalog = buildEffectiveAreaCatalog(prev.customAreas ?? []);
          const nextIssues: Record<string, AreaIssue> = { ...prev.issues };
          let seededFromReference = false;

          for (const def of catalog) {
            if (nextIssues[def.name]) continue;
            const seed = buildOutgoingIssueSeed(def, plan);
            const sectionsToSeed =
              seed.available === true
                ? seed.activeSections
                : isCustomAreaName(def.name, prev.customAreas)
                  ? def.defaultSections
                  : outgoingSectionsForRoom(plan, def.name);
            const photosBySection: Record<string, SectionBeforeAfter> = {};
            for (const section of sectionsToSeed) {
              const savedIngoing = outgoingSavedIngoingPhotos(
                detail,
                def.name,
                section,
              );
              const referenceUrls = reference
                ? matchReferenceSectionPhotos(def.name, section, refAreas)
                : [];
              const ingoingPhotoUrls =
                savedIngoing.length > 0 ? savedIngoing : referenceUrls;
              if (savedIngoing.length === 0 && referenceUrls.length > 0) {
                seededFromReference = true;
              }
              photosBySection[section] = {
                ...emptySectionPhotos(),
                ingoingPhotoUrls,
              };
            }
            nextIssues[def.name] = {
              ...emptyAreaIssue(def.name, seed, prev.customAreas),
              photosBySection,
            };
          }

          const withServerPhotos = applyOutgoingDetailPhotos(
            nextIssues,
            detail,
            prev.customAreas ?? [],
          );
          const merged = mergeOutgoingExecutionDraft(
            {
              kind: 'outgoing',
              areaIndex: prev.areaIndex,
              issues: withServerPhotos,
              customAreas: prev.customAreas ?? [],
            },
            prev,
          );
          if (plan) {
            const firstAvailable = catalog.findIndex(
              (def) => merged.issues[def.name]?.available === true,
            );
            if (firstAvailable >= 0 && prev.areaIndex === 0) {
              merged.areaIndex = firstAvailable;
            }
          }
          setIngoingFromReference(seededFromReference || Boolean(reference));
          return merged;
        });
        if (plan) {
          toast.success(
            `Loaded ${plan.rooms.length} area(s) from the ingoing report`,
          );
        } else if (reference && seededFromReference) {
          toast.success('Ingoing photos loaded from the latest ingoing report');
        } else if (!reference) {
          toast.message('No completed ingoing report found for this property');
        }
      } catch {
        if (!cancelled) {
          toast.error('Could not load ingoing reference photos');
        }
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

  const customAreas = draft.customAreas ?? [];
  const areaCatalog = useMemo(
    () => buildEffectiveAreaCatalog(customAreas),
    [customAreas],
  );
  const areaIndex = Math.min(
    Math.max(draft.areaIndex, 0),
    Math.max(areaCatalog.length - 1, 0),
  );
  const issues = draft.issues;

  const handleAddCustomArea = (name: string, sectionMode: CustomAreaSectionMode) => {
    const normalized = normalizeCustomAreaName(name);
    setDraft((prev) => {
      const nextCustomAreas = [
        ...(prev.customAreas ?? []),
        { name: normalized, sectionMode },
      ];
      const nextCatalog = buildEffectiveAreaCatalog(nextCustomAreas);
      const def = nextCatalog[nextCatalog.length - 1];
      return {
        ...prev,
        customAreas: nextCustomAreas,
        areaIndex: nextCatalog.length - 1,
        issues: {
          ...prev.issues,
          [normalized]: emptyAreaIssue(
            normalized,
            {
              available: null,
              activeSections: [...def.defaultSections],
            },
            nextCustomAreas,
          ),
        },
      };
    });
    toast.success(`Added “${normalized}”`);
  };

  if (!job) {
    return (
      <InspectorShell title="Job not found" backHref={ROUTES.INSPECTIONS}>
        <p className="text-muted-foreground text-sm">Job not found.</p>
      </InspectorShell>
    );
  }

  const areaDef = areaCatalog[areaIndex];
  const area = areaDef?.name ?? areaCatalog[0]?.name ?? 'Area';
  const issue = issues[area] ?? emptyAreaIssue(area, undefined, customAreas);
  const isLast = areaIndex === areaCatalog.length - 1;

  const updateIssue = (patch: Partial<AreaIssue>) => {
    setDraft((prev) => {
      const current = prev.issues[area] ?? emptyAreaIssue(area, undefined, prev.customAreas);
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

  const seedSectionIngoing = (section: string): string[] => {
    if (!ingoingFromReference || referenceAreas.length === 0) return [];
    return matchReferenceSectionPhotos(area, section, referenceAreas);
  };

  const markAvailable = (available: boolean) => {
    if (!available) {
      setDraft((prev) => ({
        ...prev,
        issues: {
          ...prev.issues,
          [area]: {
            ...emptyAreaIssue(area, undefined, prev.customAreas),
            available: false,
            activeSections: [],
            photosBySection: {},
          },
        },
        areaIndex: !isLast ? prev.areaIndex + 1 : prev.areaIndex,
      }));
      return;
    }

    const photosBySection: Record<string, SectionBeforeAfter> = {
      ...(issues[area]?.photosBySection ?? {}),
    };
    const sections = isCustomAreaName(area, customAreas)
      ? [...areaDef.defaultSections]
      : outgoingSectionsForRoom(ingoingAreaPlan, area);
    for (const section of sections) {
      if (!photosBySection[section]) {
        photosBySection[section] = {
          ...emptySectionPhotos(),
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
    const current = issues[area] ?? emptyAreaIssue(area, undefined, customAreas);
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
      const previewUrls = await compressPhotoSources(sources);
      setDraft((prev) => {
        const rec = prev.issues[area] ?? emptyAreaIssue(area, undefined, prev.customAreas);
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
                  [key]: [...existing[key], ...previewUrls],
                },
              },
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

  const removePhoto = (
    section: string,
    side: 'ingoing' | 'outgoing',
    index: number,
  ) => {
    const current = issues[area] ?? emptyAreaIssue(area, undefined, customAreas);
    const sectionPhotos = current.photosBySection[section] ?? emptySectionPhotos();
    if (
      side === 'ingoing' &&
      ingoingFromReference &&
      sectionPhotos.ingoingPhotoUrls.length > 0
    ) {
      return;
    }
    setDraft((prev) => {
      const rec = prev.issues[area] ?? emptyAreaIssue(area, undefined, prev.customAreas);
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
      const current = prev.issues[area] ?? emptyAreaIssue(area, undefined, prev.customAreas);
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
    const planRoomSections = ingoingAreaPlan?.rooms.find(
      (room) => room.name === area,
    )?.sections;
    if (planRoomSections?.includes(section)) return;
    if (areaDef.defaultSections.includes(section)) return;
    setDraft((prev) => {
      const current = prev.issues[area] ?? emptyAreaIssue(area, undefined, prev.customAreas);
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
        toast.error(`Add at least one outgoing photo for “${section}”`);
        return;
      }
      if (!photos.ingoingPhotoUrls.length && !ingoingFromReference) {
        toast.error(`Add at least one ingoing photo for “${section}”`);
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
        const ingoingAreaName = `${sectionAreaName(area, section)} (Ingoing)`;
        const outgoingAreaName = `${sectionAreaName(area, section)} (Outgoing)`;
        const [ingoingUrls, outgoingUrls] = await Promise.all([
          photos.ingoingPhotoUrls.length > 0
            ? commitInspectionAreaPhotos(id, ingoingAreaName, photos.ingoingPhotoUrls)
            : Promise.resolve([] as string[]),
          commitInspectionAreaPhotos(id, outgoingAreaName, photos.outgoingPhotoUrls),
        ]);
        nextPhotos[section] = {
          ingoingPhotoUrls:
            ingoingUrls.length > 0 ? ingoingUrls : photos.ingoingPhotoUrls,
          outgoingPhotoUrls: outgoingUrls,
        };
      }

      const committedIssue: AreaIssue = {
        ...issue,
        photosBySection: nextPhotos,
      };
      const nextIssues = { ...issues, [area]: committedIssue };
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

  const finalizeAndSubmit = async (finalIssues: Record<string, AreaIssue>) => {
    await saveInspectionFindings(
      id,
      areaCatalog.filter((def) => {
        const rec = finalIssues[def.name];
        return (
          rec &&
          rec.available === true &&
          (rec.note.trim() ||
            rec.responsibility ||
            rec.activeSections.some((section) => {
              const p = rec.photosBySection[section];
              return (
                (p?.ingoingPhotoUrls.length ?? 0) > 0 ||
                (p?.outgoingPhotoUrls.length ?? 0) > 0
              );
            }))
        );
      }).map((def) => {
        const rec = finalIssues[def.name];
        return {
          name: def.name,
          items: [
            {
              name: 'Issue',
              comment: rec.note.trim() || undefined,
              flagged: true,
              conditionTags: rec.responsibility ? [rec.responsibility] : [],
            },
            ...rec.activeSections.map((section) => ({
              name: section,
              flagged: true,
              comment: undefined as string | undefined,
            })),
          ],
        };
      }),
    );
    clearDraft();
    submitInspection('Outgoing report synced with bond claims and accounting');
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
      <InspectorShell title="Outgoing Inspection" backHref={jobDetail(id)}>
        <div className="space-y-4">
          <JobWorkflowToolbar job={job} />

          <p className="text-muted-foreground text-xs">
            Confirm each area, then photograph sections. Rooms and sections follow
            the latest ingoing report when available.
          </p>

          {loadingReference ? (
            <p className="text-muted-foreground text-xs">
              Loading ingoing reference photos…
            </p>
          ) : null}

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
                <p className="text-muted-foreground text-sm">
                  This area was marked unavailable. You can change that and photograph
                  it, or continue.
                </p>
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
                      disabled={busy || loadingReference}
                      onClick={() => void completeFromSkippedLast()}
                    >
                      {busy ? 'Submitting…' : 'Complete Outgoing Report'}
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
                  {area} — Before / After ({areaIndex + 1}/
                  {areaCatalog.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <OutgoingSectionPhotos
                  definition={areaDef}
                  activeSections={issue.activeSections}
                  photosBySection={issue.photosBySection}
                  busy={busy || loadingReference}
                  ingoingReadOnly={ingoingFromReference}
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

                {ingoingFromReference ? (
                  <p className="text-muted-foreground text-[11px]">
                    Ingoing photos are from the property&apos;s latest ingoing report
                    and can&apos;t be replaced here.
                  </p>
                ) : null}

                <div className="space-y-2">
                  <Label>Issue notes</Label>
                  <Input
                    value={issue.note}
                    onChange={(e) => updateIssue({ note: e.target.value })}
                    placeholder="Damage, cleaning, missing items..."
                  />
                </div>

                <div className="space-y-2">
                  <Label>Responsibility</Label>
                  <div className="flex flex-wrap gap-2">
                    {RESPONSIBILITY.map((r) => (
                      <Button
                        key={r}
                        size="sm"
                        variant={issue.responsibility === r ? 'default' : 'outline'}
                        onClick={() => updateIssue({ responsibility: r })}
                      >
                        {r}
                      </Button>
                    ))}
                  </div>
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
                    disabled={busy || loadingReference}
                    onClick={() => void next()}
                  >
                    {busy
                      ? 'Uploading photos…'
                      : isLast
                        ? 'Complete Outgoing Report'
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
