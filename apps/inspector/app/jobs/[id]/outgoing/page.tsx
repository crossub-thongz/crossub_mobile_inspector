'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { BeforeAfterPhotoColumn } from '@/components/inspector/before-after-photo-column';
import { InspectorShell } from '@/components/layout/inspector-shell';
import { JobWorkflowToolbar } from '@/components/inspector/job-workflow-toolbar';
import { useInspectorData } from '@/components/providers/inspector-data-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { INGOING_AREAS } from '@/constants/inspection';
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
  matchReferenceIngoingPhotos,
  outgoingSavedIngoingPhotos,
} from '@/lib/outgoing-reference-photos';

const RESPONSIBILITY = [
  'Tenant Responsible',
  'Landlord Responsible',
  'Fair Wear & Tear',
] as const;

type AreaIssue = {
  note: string;
  responsibility: string;
  ingoingPhotoUrls: string[];
  outgoingPhotoUrls: string[];
};

const emptyAreaIssue = (): AreaIssue => ({
  note: '',
  responsibility: '',
  ingoingPhotoUrls: [],
  outgoingPhotoUrls: [],
});

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

        // Server already resolves + property-id cross-checks the latest INGOING.
        const reference = detail.referenceIngoing;

        const nextIssues: Record<string, AreaIssue> = {};
        let seededFromReference = false;

        for (const area of INGOING_AREAS) {
          const savedIngoing = outgoingSavedIngoingPhotos(detail, area);
          const referenceUrls = reference
            ? matchReferenceIngoingPhotos(area, reference.areas)
            : [];
          const ingoingPhotoUrls =
            savedIngoing.length > 0 ? savedIngoing : referenceUrls;
          if (savedIngoing.length === 0 && referenceUrls.length > 0) {
            seededFromReference = true;
          }
          nextIssues[area] = {
            ...emptyAreaIssue(),
            ingoingPhotoUrls,
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

  const area = INGOING_AREAS[areaIndex];
  const issue = issues[area] ?? emptyAreaIssue();
  const isLast = areaIndex === INGOING_AREAS.length - 1;
  const ingoingReadOnly = ingoingFromReference && issue.ingoingPhotoUrls.length > 0;

  const addLocalPhotos = async (
    side: 'ingoing' | 'outgoing',
    sources: Array<File | string>,
  ) => {
    if (sources.length === 0) return;
    if (side === 'ingoing' && ingoingReadOnly) return;
    setBusy(true);
    try {
      const previewUrls = await compressPhotoSources(sources);
      setIssues((prev) => {
        const current = prev[area] ?? emptyAreaIssue();
        const key = side === 'ingoing' ? 'ingoingPhotoUrls' : 'outgoingPhotoUrls';
        return {
          ...prev,
          [area]: {
            ...current,
            [key]: [...current[key], ...previewUrls],
          },
        };
      });
    } catch {
      toast.error('Could not read the photo');
    } finally {
      setBusy(false);
    }
  };

  const removePhoto = (side: 'ingoing' | 'outgoing', index: number) => {
    if (side === 'ingoing' && ingoingReadOnly) return;
    setIssues((prev) => {
      const current = prev[area] ?? emptyAreaIssue();
      const key = side === 'ingoing' ? 'ingoingPhotoUrls' : 'outgoingPhotoUrls';
      return {
        ...prev,
        [area]: {
          ...current,
          [key]: current[key].filter((_, i) => i !== index),
        },
      };
    });
  };

  const next = async () => {
    if (!issue.outgoingPhotoUrls.length) {
      toast.error('Add at least one outgoing photo for this area');
      return;
    }
    if (!issue.ingoingPhotoUrls.length && !ingoingFromReference) {
      toast.error('Add at least one ingoing photo for this area');
      return;
    }

    setBusy(true);
    try {
      const ingoingAreaName = `${area} (Ingoing)`;
      const outgoingAreaName = `${area} (Outgoing)`;
      const [ingoingUrls, outgoingUrls] = await Promise.all([
        issue.ingoingPhotoUrls.length > 0
          ? commitInspectionAreaPhotos(id, ingoingAreaName, issue.ingoingPhotoUrls)
          : Promise.resolve([] as string[]),
        commitInspectionAreaPhotos(id, outgoingAreaName, issue.outgoingPhotoUrls),
      ]);

      const committedIssue = {
        ...issue,
        ingoingPhotoUrls: ingoingUrls.length > 0 ? ingoingUrls : issue.ingoingPhotoUrls,
        outgoingPhotoUrls: outgoingUrls,
      };
      const nextIssues = { ...issues, [area]: committedIssue };
      setIssues(nextIssues);

      if (isLast) {
        await saveInspectionFindings(
          id,
          INGOING_AREAS.filter((a) => {
            const rec = nextIssues[a];
            return (
              rec &&
              (rec.note.trim() ||
                rec.responsibility ||
                rec.ingoingPhotoUrls.length ||
                rec.outgoingPhotoUrls.length)
            );
          }).map((a) => ({
            name: a,
            items: [
              {
                name: 'Issue',
                comment: nextIssues[a].note.trim() || undefined,
                flagged: true,
                conditionTags: nextIssues[a].responsibility
                  ? [nextIssues[a].responsibility]
                  : [],
              },
            ],
          })),
        );
        submitInspection('Outgoing report synced with bond claims and accounting');
        return;
      }
      setAreaIndex((i) => i + 1);
    } catch {
      toast.error('Photo upload failed — please retry');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <InspectorShell title="Outgoing Inspection" backHref={jobDetail(id)}>
        <div className="space-y-4">
          <JobWorkflowToolbar job={job} />

          <p className="text-muted-foreground text-xs">
            Compare ingoing vs outgoing. Ingoing photos come from the latest completed
            ingoing report for this property.
          </p>

          {loadingReference ? (
            <p className="text-muted-foreground text-xs">Loading ingoing reference photos…</p>
          ) : null}

          <div className="flex gap-1">
            {INGOING_AREAS.map((a, i) => (
              <div
                key={a}
                className={`h-1 flex-1 rounded-full ${i <= areaIndex ? 'bg-primary' : 'bg-secondary'}`}
              />
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>
                {area} — Before / After ({areaIndex + 1}/{INGOING_AREAS.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <BeforeAfterPhotoColumn
                  title="Ingoing photo"
                  photoUrls={issue.ingoingPhotoUrls}
                  uploading={busy}
                  disabled={busy || loadingReference || ingoingReadOnly}
                  onAddFiles={(files) => addLocalPhotos('ingoing', files)}
                  onAddDataUrl={(dataUrl) => addLocalPhotos('ingoing', [dataUrl])}
                  onRemove={
                    ingoingReadOnly ? undefined : (index) => removePhoto('ingoing', index)
                  }
                />
                <BeforeAfterPhotoColumn
                  title="Outgoing photo"
                  photoUrls={issue.outgoingPhotoUrls}
                  uploading={busy}
                  disabled={busy || loadingReference}
                  onAddFiles={(files) => addLocalPhotos('outgoing', files)}
                  onAddDataUrl={(dataUrl) => addLocalPhotos('outgoing', [dataUrl])}
                  onRemove={(index) => removePhoto('outgoing', index)}
                />
              </div>

              {ingoingReadOnly ? (
                <p className="text-muted-foreground text-[11px]">
                  Ingoing photos are from the property&apos;s latest ingoing report and
                  can&apos;t be replaced here.
                </p>
              ) : null}

              <div className="space-y-2">
                <Label>Issue notes</Label>
                <Input
                  value={issue.note}
                  onChange={(e) =>
                    setIssues((prev) => ({
                      ...prev,
                      [area]: { ...(prev[area] ?? emptyAreaIssue()), note: e.target.value },
                    }))
                  }
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
                      onClick={() =>
                        setIssues((prev) => ({
                          ...prev,
                          [area]: {
                            ...(prev[area] ?? emptyAreaIssue()),
                            responsibility: r,
                          },
                        }))
                      }
                    >
                      {r}
                    </Button>
                  ))}
                </div>
              </div>

              <Button
                className="w-full"
                disabled={busy || loadingReference}
                onClick={() => void next()}
              >
                {busy
                  ? 'Uploading photos…'
                  : isLast
                    ? 'Complete Outgoing Report'
                    : 'Next Area'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </InspectorShell>
      {Celebration}
    </>
  );
}
