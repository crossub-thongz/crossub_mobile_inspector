'use client';

import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { QrCode } from 'lucide-react';
import { toast } from 'sonner';

import { InspectionAreaPhotoRow } from '@/components/inspector/inspection-area-photo';

import { InspectorShell } from '@/components/layout/inspector-shell';
import { useInspectorData } from '@/components/providers/inspector-data-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  OPEN_FINISH_CHECKS,
  OPEN_READINESS_PHOTOS,
} from '@/constants/inspection';
import { jobDetail, ROUTES } from '@/constants/routes';
import { useFinishInspection } from '@/hooks/use-finish-inspection';
import {
  useInspectionFinishedGate,
  useInspectionInProgress,
  useKeyCollectGate,
} from '@/hooks/use-key-collect-gate';
import { clampOpenWorkflowStep } from '@/lib/job-workflow-persist';

/** Keep only saved data-URL images (ignore legacy boolean toggles). */
function normalizePhotoRecord(raw: unknown): Record<string, string> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof value === 'string' && value.startsWith('data:image')) {
      out[key] = value;
    }
  }
  return out;
}

function hasAreaPhoto(record: Record<string, string>, key: string): boolean {
  const url = record[key];
  return typeof url === 'string' && url.startsWith('data:image');
}

const STEPS = [
  'Property Readiness',
  'Rental Readiness',
  'QR Code',
  'Visitor Registration',
  'Finish Inspection',
];

export default function OpenInspectionPage() {
  const { id } = useParams<{ id: string }>();
  const { getJob, updateJobWorkflow, updateJobStatus } = useInspectorData();
  const job = getJob(id);
  const { finish: submitInspection, Celebration } = useFinishInspection(id);
  useKeyCollectGate(job, id);
  useInspectionFinishedGate(job, id);
  useInspectionInProgress(job, id, updateJobStatus);
  const [step, setStep] = useState(() => clampOpenWorkflowStep(job?.workflowStep));
  const [comments, setComments] = useState('');
  const [readyToLease, setReadyToLease] = useState<boolean | null>(null);
  const [photos, setPhotos] = useState<Record<string, string>>({});
  const [finishPhotos, setFinishPhotos] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!job) return;
    setStep(clampOpenWorkflowStep(job.workflowStep));
    if (!job.workflowData) return;
    const saved = job.workflowData.readinessPhotos;
    if (saved) {
      setPhotos(normalizePhotoRecord(saved));
    }
    const savedFinish = job.workflowData.finishPhotos;
    if (savedFinish) {
      setFinishPhotos(normalizePhotoRecord(savedFinish));
    }
    if (typeof job.workflowData.comments === 'string') {
      setComments(job.workflowData.comments);
    }
    if (typeof job.workflowData.readyToLease === 'boolean') {
      setReadyToLease(job.workflowData.readyToLease);
    } else if (job.workflowData.readyToLease === null) {
      setReadyToLease(null);
    }
  }, [job]);

  const saveDraft = useCallback(() => {
    updateJobWorkflow(id, step, {
      comments,
      readyToLease,
      readinessPhotos: photos,
      finishPhotos,
    });
  }, [
    id,
    step,
    comments,
    readyToLease,
    photos,
    finishPhotos,
    updateJobWorkflow,
  ]);

  useEffect(() => {
    if (!job) return;
    const hasDraft =
      step > 1 ||
      comments.length > 0 ||
      readyToLease !== null ||
      Object.keys(photos).length > 0 ||
      Object.keys(finishPhotos).length > 0;
    if (!hasDraft) return;
    const timer = window.setTimeout(() => saveDraft(), 400);
    return () => window.clearTimeout(timer);
  }, [job, saveDraft, step, comments, readyToLease, photos, finishPhotos]);

  if (!job) {
    return (
      <InspectorShell title="Job not found" backHref={ROUTES.INSPECTIONS}>
        <p className="text-muted-foreground text-sm">Job not found.</p>
      </InspectorShell>
    );
  }

  const allPhotos = OPEN_READINESS_PHOTOS.every((p) => hasAreaPhoto(photos, p));
  const allFinishPhotos = OPEN_FINISH_CHECKS.every((c) => hasAreaPhoto(finishPhotos, c));

  const setAreaPhoto = (area: string, dataUrl: string | undefined) => {
    setPhotos((prev) => {
      if (!dataUrl) {
        const next = { ...prev };
        delete next[area];
        return next;
      }
      return { ...prev, [area]: dataUrl };
    });
  };

  const setFinishPhoto = (check: string, dataUrl: string | undefined) => {
    setFinishPhotos((prev) => {
      if (!dataUrl) {
        const next = { ...prev };
        delete next[check];
        return next;
      }
      return { ...prev, [check]: dataUrl };
    });
  };

  const next = () => {
    const nextStep = step + 1;
    updateJobWorkflow(id, nextStep, {
      comments,
      readyToLease,
      readinessPhotos: photos,
      finishPhotos,
    });
    setStep(nextStep);
  };

  const finish = () => {
    if (!allFinishPhotos) {
      toast.error('Add a photo for each finish confirmation');
      return;
    }
    updateJobWorkflow(id, 5, {
      comments,
      readyToLease,
      readinessPhotos: photos,
      finishPhotos,
    });
    submitInspection('Open inspection report sent to agent and landlord');
  };

  return (
    <>
      <InspectorShell title="Open Inspection" backHref={jobDetail(id)}>
      <div className="space-y-4">
        <div className="flex gap-1">
          {STEPS.map((label, i) => (
            <div
              key={label}
              className={`h-1 flex-1 rounded-full ${i + 1 <= step ? 'bg-primary' : 'bg-secondary'}`}
              title={label}
            />
          ))}
        </div>

        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Step 1 — Property Readiness</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-muted-foreground text-xs">
                Required photos for each area
              </p>
              {OPEN_READINESS_PHOTOS.map((area) => (
                <InspectionAreaPhotoRow
                  key={area}
                  area={area}
                  photoUrl={photos[area]}
                  onChange={(dataUrl) => setAreaPhoto(area, dataUrl)}
                />
              ))}
              <div className="space-y-2">
                <Label>Comments</Label>
                <Input
                  placeholder="e.g. Clean, minor maintenance required"
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                />
              </div>
              <Button className="w-full" disabled={!allPhotos} onClick={next}>
                Continue
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Step 2 — Rental Readiness</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant={readyToLease === true ? 'default' : 'outline'}
                className="w-full"
                onClick={() => setReadyToLease(true)}
              >
                Ready to Lease
              </Button>
              <Button
                variant={readyToLease === false ? 'destructive' : 'outline'}
                className="w-full"
                onClick={() => {
                  setReadyToLease(false);
                  toast.info('Maintenance request will be generated');
                }}
              >
                Not Ready — Create Maintenance Request
              </Button>
              <Button
                className="w-full"
                disabled={readyToLease === null}
                onClick={next}
              >
                Continue
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Step 3 — Open Inspection QR Code</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4 py-6">
              <div className="flex size-40 items-center justify-center rounded-xl border-2 border-dashed border-primary bg-primary/5">
                <QrCode className="size-24 text-primary" />
              </div>
              <p className="text-muted-foreground text-center text-xs">
                Prospective tenants scan to register. Data syncs with Leasing.
              </p>
              <Button className="w-full" onClick={next}>
                Continue
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 4 && (
          <Card>
            <CardHeader>
              <CardTitle>Step 4 — Visitor Registration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="text-muted-foreground text-xs">
                Visitors complete registration via QR: name, mobile, email,
                occupants, move-in date, lease length, and application interest.
              </p>
              <p className="rounded-lg border bg-secondary/30 p-3 text-xs">
                3 visitors registered today (demo)
              </p>
              <Button className="w-full" onClick={next}>
                Continue
              </Button>
            </CardContent>
          </Card>
        )}

        {step >= 5 && (
          <Card>
            <CardHeader>
              <CardTitle>Step 5 — Finish Inspection</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-muted-foreground text-xs">
                Snap or upload proof photos for each item before finishing
              </p>
              {OPEN_FINISH_CHECKS.map((check) => (
                <InspectionAreaPhotoRow
                  key={check}
                  area={check}
                  photoUrl={finishPhotos[check]}
                  onChange={(dataUrl) => setFinishPhoto(check, dataUrl)}
                />
              ))}
              <Button className="w-full" disabled={!allFinishPhotos} onClick={finish}>
                Finish Inspection & Generate Report
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
