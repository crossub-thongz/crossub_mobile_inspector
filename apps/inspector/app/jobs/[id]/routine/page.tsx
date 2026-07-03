'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';

import { InspectorShell } from '@/components/layout/inspector-shell';
import { JobWorkflowToolbar } from '@/components/inspector/job-workflow-toolbar';
import { useInspectorData } from '@/components/providers/inspector-data-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ROUTINE_AREAS } from '@/constants/inspection';
import { jobDetail, ROUTES } from '@/constants/routes';
import { useFinishInspection } from '@/hooks/use-finish-inspection';
import {
  useInspectionFinishedGate,
  useInspectionInProgress,
  useKeyCollectGate,
} from '@/hooks/use-key-collect-gate';

export default function RoutineInspectionPage() {
  const { id } = useParams<{ id: string }>();
  const { getJob, saveInspectionFindings, updateJobStatus } = useInspectorData();
  const job = getJob(id);
  const { finish: submitInspection, Celebration } = useFinishInspection(id);
  useKeyCollectGate(job, id);
  useInspectionFinishedGate(job, id);
  useInspectionInProgress(job, id, updateJobStatus);
  const [method, setMethod] = useState<'physical' | 'self'>('physical');
  const [notes, setNotes] = useState<Record<string, string>>({});

  if (!job) {
    return (
      <InspectorShell title="Job not found" backHref={ROUTES.INSPECTIONS}>
        <p className="text-muted-foreground text-sm">Job not found.</p>
      </InspectorShell>
    );
  }

  const handleFinish = async () => {
    // Persist the per-area notes (+ the inspection method) BEFORE completing —
    // findings lock once the inspection lands COMPLETED server-side.
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
      ...ROUTINE_AREAS.filter((area) => (notes[area] ?? '').trim()).map(
        (area) => ({
          name: area,
          items: [{ name: 'Notes', comment: notes[area].trim() }],
        }),
      ),
    ]);
    submitInspection('Routine report sent to agent and landlord');
  };

  return (
    <>
    <InspectorShell title="Routine Inspection" backHref={jobDetail(id)}>
      <div className="space-y-4">
        <JobWorkflowToolbar job={job} />

        <div className="flex gap-2">
          <Button
            variant={method === 'physical' ? 'default' : 'outline'}
            className="flex-1"
            onClick={() => setMethod('physical')}
          >
            Physical Inspection
          </Button>
          <Button
            variant={method === 'self' ? 'default' : 'outline'}
            className="flex-1"
            onClick={() => setMethod('self')}
          >
            Self Inspection
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {method === 'physical' ? 'On-site checklist' : 'Tenant submission review'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {ROUTINE_AREAS.map((area) => (
              <div key={area} className="space-y-2">
                <Label>{area}</Label>
                <Input
                  placeholder={
                    method === 'physical'
                      ? 'Inspector notes and photos'
                      : 'Review tenant submission'
                  }
                  value={notes[area] ?? ''}
                  onChange={(e) =>
                    setNotes((n) => ({ ...n, [area]: e.target.value }))
                  }
                />
              </div>
            ))}
            <Button className="w-full" onClick={() => void handleFinish()}>
              Complete Routine Report
            </Button>
          </CardContent>
        </Card>
      </div>
    </InspectorShell>
    {Celebration}
    </>
  );
}
