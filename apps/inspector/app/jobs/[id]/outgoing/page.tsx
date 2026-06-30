'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';

import { InspectorShell } from '@/components/layout/inspector-shell';
import { useInspectorData } from '@/components/providers/inspector-data-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { INGOING_AREAS } from '@/constants/inspection';
import { jobDetail, ROUTES } from '@/constants/routes';
import { useFinishInspection } from '@/hooks/use-finish-inspection';
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

export default function OutgoingInspectionPage() {
  const { id } = useParams<{ id: string }>();
  const { getJob, updateJobStatus } = useInspectorData();
  const job = getJob(id);
  const { finish: submitInspection, Celebration } = useFinishInspection(id);
  useKeyCollectGate(job, id);
  useInspectionFinishedGate(job, id);
  useInspectionInProgress(job, id, updateJobStatus);
  const [areaIndex, setAreaIndex] = useState(0);
  const [issues, setIssues] = useState<
    Record<string, { note: string; responsibility: string }>
  >({});

  if (!job) {
    return (
      <InspectorShell title="Job not found" backHref={ROUTES.INSPECTIONS}>
        <p className="text-muted-foreground text-sm">Job not found.</p>
      </InspectorShell>
    );
  }

  const area = INGOING_AREAS[areaIndex];
  const issue = issues[area] ?? { note: '', responsibility: '' };
  const isLast = areaIndex === INGOING_AREAS.length - 1;

  const next = () => {
    if (isLast) {
      submitInspection('Outgoing report synced with bond claims and accounting');
      return;
    }
    setAreaIndex((i) => i + 1);
  };

  return (
    <>
    <InspectorShell title="Outgoing Inspection" backHref={jobDetail(id)}>
      <div className="space-y-4">
        <p className="text-muted-foreground text-xs">
          Compare ingoing vs outgoing. Focus: cleaning, damage, missing items.
        </p>

        <Card>
          <CardHeader>
            <CardTitle>
              {area} — Before / After
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
                Ingoing photo
              </div>
              <div className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
                Outgoing photo
              </div>
            </div>

            <div className="space-y-2">
              <Label>Issue notes</Label>
              <Input
                value={issue.note}
                onChange={(e) =>
                  setIssues((prev) => ({
                    ...prev,
                    [area]: { ...issue, note: e.target.value },
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
                        [area]: { ...issue, responsibility: r },
                      }))
                    }
                  >
                    {r}
                  </Button>
                ))}
              </div>
            </div>

            <Button className="w-full" onClick={next}>
              {isLast ? 'Complete Outgoing Report' : 'Next Area'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </InspectorShell>
    {Celebration}
    </>
  );
}
