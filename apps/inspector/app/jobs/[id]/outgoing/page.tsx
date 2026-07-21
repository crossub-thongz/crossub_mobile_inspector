'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';

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
  INSPECTION_AREA_CATALOG,
  getInspectionAreaDefinition,
  sectionAreaName,
} from '@/constants/inspection-areas';
import { jobDetail, ROUTES } from '@/constants/routes';
import { useFinishInspection } from '@/hooks/use-finish-inspection';
import { compressPhotoSources } from '@/lib/inspection-area-photos';
import {
  useInspectionFinishedGate,
  useInspectionInProgress,
  useKeyCollectGate,
} from '@/hooks/use-key-collect-gate';
import { fetchInspectionDetail } from '@/lib/crossub-api/inspector-client';
import {
  matchReferenceSectionPhotos,
  outgoingSavedIngoingPhotos,
} from '@/lib/outgoing-reference-photos';
import { cn } from '@/lib/utils';

const RESPONSIBILITY = [
  'Tenant Responsible',
  'Landlord Responsible',
  'Fair Wear & Tear',
] as const;

type AreaIssue = {
  available: boolean | null;
  note: string;
  responsibility: string;
  activeSections: string[];
  photosBySection: Record<string, SectionBeforeAfter>;
};

const emptySectionPhotos = (): SectionBeforeAfter => ({
  ingoingPhotoUrls: [],
  outgoingPhotoUrls: [],
});

function emptyAreaIssue(areaName: string): AreaIssue {
  const def = getInspectionAreaDefinition(areaName);
  return {
    available: null,
    note: '',
    responsibility: '',
    activeSections: [...(def?.defaultSections ?? [])],
    photosBySection: {},
  };
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
  const [areaIndex, setAreaIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const [loadingReference, setLoadingReference] = useState(apiConnected);
  const [issues, setIssues] = useState<Record<string, AreaIssue>>({});
  const [ingoingFromReference, setIngoingFromReference] = useState(false);
  const [referenceAreas, setReferenceAreas] = useState<
    Array<{ name: string; photos: Array<{ url: string }> }>
  >([]);

  useEffect(() => {
    if (!apiConnected || !id) {
      setLoadingReference(false);
      return;
    }
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
        let seededFromReference = false;

        for (const def of INSPECTION_AREA_CATALOG) {
          const photosBySection: Record<string, SectionBeforeAfter> = {};
          for (const section of def.defaultSections) {
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
            ...emptyAreaIssue(def.name),
            photosBySection,
          };
        }

        setIssues(nextIssues);
        setIngoingFromReference(seededFromReference || Boolean(reference));
        if (reference && seededFromReference) {
          toast.success('Ingoing photos loaded from the latest ingoing report');
        } else if (!reference) {
          toast.message('No completed ingoing report found for this property');
        }
      } catch {
        if (!cancelled) {
          toast.error('Could not load ingoing reference photos');
        }
      } finally {
        if (!cancelled) setLoadingReference(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [apiConnected, id]);

  if (!job) {
    return (
      <InspectorShell title="Job not found" backHref={ROUTES.INSPECTIONS}>
        <p className="text-muted-foreground text-sm">Job not found.</p>
      </InspectorShell>
    );
  }

  const areaDef = INSPECTION_AREA_CATALOG[areaIndex];
  const area = areaDef.name;
  const issue = issues[area] ?? emptyAreaIssue(area);
  const isLast = areaIndex === INSPECTION_AREA_CATALOG.length - 1;

  const updateIssue = (patch: Partial<AreaIssue>) => {
    setIssues((prev) => {
      const current = prev[area] ?? emptyAreaIssue(area);
      return { ...prev, [area]: { ...current, ...patch } };
    });
  };

  const goToArea = (index: number) => {
    if (index < 0 || index >= INSPECTION_AREA_CATALOG.length) return;
    setAreaIndex(index);
  };

  const seedSectionIngoing = (section: string): string[] => {
    if (!ingoingFromReference || referenceAreas.length === 0) return [];
    return matchReferenceSectionPhotos(area, section, referenceAreas);
  };

  const markAvailable = (available: boolean) => {
    if (!available) {
      setIssues((prev) => ({
        ...prev,
        [area]: {
          ...emptyAreaIssue(area),
          available: false,
          activeSections: [],
          photosBySection: {},
        },
      }));
      if (!isLast) setAreaIndex((i) => i + 1);
      return;
    }

    const photosBySection: Record<string, SectionBeforeAfter> = {
      ...(issues[area]?.photosBySection ?? {}),
    };
    for (const section of areaDef.defaultSections) {
      if (!photosBySection[section]) {
        photosBySection[section] = {
          ...emptySectionPhotos(),
          ingoingPhotoUrls: seedSectionIngoing(section),
        };
      }
    }
    updateIssue({
      available: true,
      activeSections: [...areaDef.defaultSections],
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
      const previewUrls = await compressPhotoSources(sources);
      setIssues((prev) => {
        const rec = prev[area] ?? emptyAreaIssue(area);
        const existing = rec.photosBySection[section] ?? emptySectionPhotos();
        const key = side === 'ingoing' ? 'ingoingPhotoUrls' : 'outgoingPhotoUrls';
        return {
          ...prev,
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
    const current = issues[area] ?? emptyAreaIssue(area);
    const sectionPhotos = current.photosBySection[section] ?? emptySectionPhotos();
    if (
      side === 'ingoing' &&
      ingoingFromReference &&
      sectionPhotos.ingoingPhotoUrls.length > 0
    ) {
      return;
    }
    setIssues((prev) => {
      const rec = prev[area] ?? emptyAreaIssue(area);
      const existing = rec.photosBySection[section] ?? emptySectionPhotos();
      const key = side === 'ingoing' ? 'ingoingPhotoUrls' : 'outgoingPhotoUrls';
      return {
        ...prev,
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
      };
    });
  };

  const addSection = (section: string) => {
    setIssues((prev) => {
      const current = prev[area] ?? emptyAreaIssue(area);
      if (current.activeSections.includes(section)) return prev;
      return {
        ...prev,
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
      };
    });
  };

  const removeSection = (section: string) => {
    if (areaDef.defaultSections.includes(section)) return;
    setIssues((prev) => {
      const current = prev[area] ?? emptyAreaIssue(area);
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
      setIssues(nextIssues);

      if (isLast) {
        await finalizeAndSubmit(nextIssues);
        return;
      }
      setAreaIndex((i) => i + 1);
    } catch {
      toast.error('Photo upload failed — please retry');
    } finally {
      setBusy(false);
    }
  };

  const finalizeAndSubmit = async (finalIssues: Record<string, AreaIssue>) => {
    await saveInspectionFindings(
      id,
      INSPECTION_AREA_CATALOG.filter((def) => {
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
            Confirm each area, then photograph sections. Ingoing photos come from the
            latest completed ingoing report when available.
          </p>

          {loadingReference ? (
            <p className="text-muted-foreground text-xs">
              Loading ingoing reference photos…
            </p>
          ) : null}

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

          {issue.available == null ? (
            <AreaAvailablePrompt
              areaName={area}
              areaIndex={areaIndex}
              totalAreas={INSPECTION_AREA_CATALOG.length}
              onYes={() => markAvailable(true)}
              onNo={() => markAvailable(false)}
            />
          ) : issue.available === false ? (
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
                  {INSPECTION_AREA_CATALOG.length})
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
    </>
  );
}
