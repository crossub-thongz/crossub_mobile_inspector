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

const CONDITIONS = ['Excellent', 'Good', 'Fair', 'Poor', 'Damaged'];

export default function IngoingInspectionPage() {
  const { id } = useParams<{ id: string }>();
  const { getJob, completeJob } = useInspectorData();
  const job = getJob(id);
  const [areaIndex, setAreaIndex] = useState(0);
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
                variant="outline"
                className="w-full"
                onClick={() =>
                  setEntries((e) => ({
                    ...e,
                    [area]: { ...entry, photos: (entry.photos || 0) + 1 },
                  }))
                }
              >
                Add Photo ({entry.photos || 0})
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
