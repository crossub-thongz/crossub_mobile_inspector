'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';
import { Mic } from 'lucide-react';
import { toast } from 'sonner';

import { InspectionAreaPhotosField } from '@/components/inspector/inspection-area-photos-field';
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
import type { InspectorFindingAreaPayload } from '@/lib/crossub-api/inspector-client';
import { compressPhotoSources } from '@/lib/inspection-area-photos';
import {
  useInspectionFinishedGate,
  useInspectionInProgress,
  useKeyCollectGate,
} from '@/hooks/use-key-collect-gate';

const CONDITIONS = ['Excellent', 'Good', 'Fair', 'Poor', 'Damaged'];

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
  const [entries, setEntries] = useState<
    Record<string, { condition: string; comments: string; photoUrls: string[] }>
  >({});

  if (!job) {
    return (
      <InspectorShell title="Job not found" backHref={ROUTES.INSPECTIONS}>
        <p className="text-muted-foreground text-sm">Job not found.</p>
      </InspectorShell>
    );
  }

  const area = INGOING_AREAS[areaIndex];
  const entry = entries[area] ?? { condition: '', comments: '', photoUrls: [] };
  const isLast = areaIndex === INGOING_AREAS.length - 1;

  const addLocalPhotos = async (sources: Array<File | string>) => {
    if (sources.length === 0) return;
    setBusy(true);
    try {
      const previewUrls = await compressPhotoSources(sources);
      setEntries((e) => {
        const current = e[area] ?? { condition: '', comments: '', photoUrls: [] };
        return {
          ...e,
          [area]: {
            ...current,
            photoUrls: [...(current.photoUrls ?? []), ...previewUrls],
          },
        };
      });
    } catch {
      toast.error('Could not read the photo');
    } finally {
      setBusy(false);
    }
  };

  const removePhoto = (index: number) => {
    setEntries((e) => {
      const current = e[area] ?? { condition: '', comments: '', photoUrls: [] };
      return {
        ...e,
        [area]: {
          ...current,
          photoUrls: current.photoUrls.filter((_, i) => i !== index),
        },
      };
    });
  };

  const saveArea = async () => {
    if (!entry.condition) {
      toast.error('Select a condition rating');
      return;
    }
    if (!entry.photoUrls?.length) {
      toast.error('Add at least one photo');
      return;
    }

    setBusy(true);
    try {
      const uploadedUrls = await commitInspectionAreaPhotos(id, area, entry.photoUrls);
      const committedEntry = { ...entry, photoUrls: uploadedUrls };
      const finalEntries = {
        ...entries,
        [area]: committedEntry,
      };
      setEntries(finalEntries);

      if (isLast) {
        await saveInspectionFindings(
          id,
          INGOING_AREAS.filter((a) => finalEntries[a]).map((a) => ({
            name: a,
            rating: finalEntries[a]
              .condition as InspectorFindingAreaPayload['rating'],
            items: finalEntries[a].comments
              ? [{ name: 'Notes', comment: finalEntries[a].comments }]
              : [],
          })),
        );
        submitInspection('Ingoing report sent to tenant, agent, and landlord');
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
      <InspectorShell title="Ingoing Inspection" backHref={jobDetail(id)}>
        <div className="space-y-4">
          <JobWorkflowToolbar job={job} />

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
                {area} ({areaIndex + 1}/{INGOING_AREAS.length})
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
                      onClick={() =>
                        setEntries((e) => ({
                          ...e,
                          [area]: { ...(e[area] ?? entry), condition: c },
                        }))
                      }
                    >
                      {c}
                    </Button>
                  ))}
                </div>
              </div>

              <InspectionAreaPhotosField
                photoUrls={entry.photoUrls}
                uploading={busy}
                onAddFiles={(files) => addLocalPhotos(files)}
                onAddDataUrl={(dataUrl) => addLocalPhotos([dataUrl])}
                onRemove={removePhoto}
              />

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  Comments
                  <Mic className="size-3.5 text-muted-foreground" />
                </Label>
                <Input
                  placeholder="Room condition notes (voice-to-text supported)"
                  value={entry.comments}
                  onChange={(ev) =>
                    setEntries((e) => ({
                      ...e,
                      [area]: { ...(e[area] ?? entry), comments: ev.target.value },
                    }))
                  }
                />
              </div>

              <Button className="w-full" disabled={busy} onClick={() => void saveArea()}>
                {busy
                  ? 'Uploading photos…'
                  : isLast
                    ? 'Complete & Send Report'
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
