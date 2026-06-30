'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';
import { Camera, Mic } from 'lucide-react';
import { toast } from 'sonner';

import { InspectorShell } from '@/components/layout/inspector-shell';
import { useInspectorData } from '@/components/providers/inspector-data-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { INGOING_AREAS } from '@/constants/inspection';
import { jobDetail, ROUTES } from '@/constants/routes';
import { useKeyCollectGate, useInspectionWorkflowStart } from '@/hooks/use-key-collect-gate';

const CONDITIONS = ['Excellent', 'Good', 'Fair', 'Poor', 'Damaged'];

export default function IngoingInspectionPage() {
  const { id } = useParams<{ id: string }>();
  const { getJob, completeJob, uploadInspectionPhotos, updateJobWorkflow } =
    useInspectorData();
  const job = getJob(id);
  useKeyCollectGate(job, id);
  useInspectionWorkflowStart(job, id, updateJobWorkflow);
  const [areaIndex, setAreaIndex] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [entries, setEntries] = useState<
    Record<string, { condition: string; comments: string; photos: number }>
  >({});

  if (!job) {
    return (
      <InspectorShell title="Job not found" backHref={ROUTES.INSPECTIONS}>
        <p className="text-muted-foreground text-sm">Job not found.</p>
      </InspectorShell>
    );
  }

  const area = INGOING_AREAS[areaIndex];
  const entry = entries[area] ?? { condition: '', comments: '', photos: 0 };
  const isLast = areaIndex === INGOING_AREAS.length - 1;

  const addPhotos = async (files: File[]) => {
    if (files.length === 0) return;
    setUploading(true);
    try {
      // For an API-backed inspection this puts the bytes to R2 (base64 → facade); demo
      // jobs no-op and just bump the local counter. A failure blocks the count so the
      // inspector knows the evidence didn't save.
      await uploadInspectionPhotos(id, files);
    } catch {
      toast.error('Photo upload failed — please retry');
      setUploading(false);
      return;
    }
    setEntries((e) => ({
      ...e,
      [area]: { ...entry, photos: (entry.photos || 0) + files.length },
    }));
    setUploading(false);
  };

  const saveArea = () => {
    if (!entry.condition) {
      toast.error('Select a condition rating');
      return;
    }
    setEntries((e) => ({ ...e, [area]: { ...entry, photos: entry.photos || 1 } }));
    if (isLast) {
      completeJob(id);
      toast.success('Ingoing report sent to tenant, agent, and landlord');
      return;
    }
    setAreaIndex((i) => i + 1);
  };

  return (
    <InspectorShell title="Ingoing Inspection" backHref={jobDetail(id)}>
      <div className="space-y-4">
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
                        [area]: { ...entry, condition: c },
                      }))
                    }
                  >
                    {c}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                Photos
                <Camera className="size-3.5" />
              </Label>
              <Button
                asChild
                variant="outline"
                className={`w-full ${uploading ? 'pointer-events-none opacity-60' : ''}`}
              >
                <label className="cursor-pointer">
                  {uploading ? 'Uploading…' : `Add Photo (${entry.photos || 0})`}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    disabled={uploading}
                    onChange={(ev) => {
                      void addPhotos(Array.from(ev.target.files ?? []));
                      ev.target.value = '';
                    }}
                  />
                </label>
              </Button>
            </div>

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
                    [area]: { ...entry, comments: ev.target.value },
                  }))
                }
              />
            </div>

            <Button className="w-full" onClick={saveArea}>
              {isLast ? 'Complete & Send Report' : 'Next Area'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </InspectorShell>
  );
}
