'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';
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
  } = useInspectorData();
  const job = getJob(id);
  const { finish: submitInspection, Celebration } = useFinishInspection(id);
  useKeyCollectGate(job, id);
  useInspectionFinishedGate(job, id);
  useInspectionInProgress(job, id, updateJobStatus);
  const [areaIndex, setAreaIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const [issues, setIssues] = useState<Record<string, AreaIssue>>({});

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

  const addLocalPhotos = async (
    side: 'ingoing' | 'outgoing',
    sources: Array<File | string>,
  ) => {
    if (sources.length === 0) return;
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
    if (!issue.ingoingPhotoUrls.length) {
      toast.error('Add at least one ingoing photo for this area');
      return;
    }
    if (!issue.outgoingPhotoUrls.length) {
      toast.error('Add at least one outgoing photo for this area');
      return;
    }

    setBusy(true);
    try {
      const ingoingAreaName = `${area} (Ingoing)`;
      const outgoingAreaName = `${area} (Outgoing)`;
      const [ingoingUrls, outgoingUrls] = await Promise.all([
        commitInspectionAreaPhotos(id, ingoingAreaName, issue.ingoingPhotoUrls),
        commitInspectionAreaPhotos(id, outgoingAreaName, issue.outgoingPhotoUrls),
      ]);

      const committedIssue = {
        ...issue,
        ingoingPhotoUrls: ingoingUrls,
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
            Compare ingoing vs outgoing. Focus: cleaning, damage, missing items.
          </p>

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
                  disabled={busy}
                  onAddFiles={(files) => addLocalPhotos('ingoing', files)}
                  onAddDataUrl={(dataUrl) => addLocalPhotos('ingoing', [dataUrl])}
                  onRemove={(index) => removePhoto('ingoing', index)}
                />
                <BeforeAfterPhotoColumn
                  title="Outgoing photo"
                  photoUrls={issue.outgoingPhotoUrls}
                  uploading={busy}
                  disabled={busy}
                  onAddFiles={(files) => addLocalPhotos('outgoing', files)}
                  onAddDataUrl={(dataUrl) => addLocalPhotos('outgoing', [dataUrl])}
                  onRemove={(index) => removePhoto('outgoing', index)}
                />
              </div>

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

              <Button className="w-full" disabled={busy} onClick={() => void next()}>
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
