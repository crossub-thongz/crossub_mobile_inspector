'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';
import { Camera, QrCode } from 'lucide-react';
import { toast } from 'sonner';

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

const STEPS = [
  'Property Readiness',
  'Rental Readiness',
  'QR Code',
  'Visitor Registration',
  'Finish Inspection',
];

export default function OpenInspectionPage() {
  const { id } = useParams<{ id: string }>();
  const { getJob, updateJobWorkflow, completeJob } = useInspectorData();
  const job = getJob(id);
  const [step, setStep] = useState(job?.workflowStep ?? 1);
  const [comments, setComments] = useState('');
  const [readyToLease, setReadyToLease] = useState<boolean | null>(null);
  const [photos, setPhotos] = useState<Record<string, boolean>>({});
  const [finishChecks, setFinishChecks] = useState<Record<string, boolean>>({});

  if (!job) {
    return (
      <InspectorShell title="Job not found" backHref={ROUTES.INSPECTIONS}>
        <p className="text-muted-foreground text-sm">Job not found.</p>
      </InspectorShell>
    );
  }

  const togglePhoto = (name: string) => {
    setPhotos((p) => ({ ...p, [name]: !p[name] }));
  };

  const toggleCheck = (name: string) => {
    setFinishChecks((c) => ({ ...c, [name]: !c[name] }));
  };

  const allPhotos = OPEN_READINESS_PHOTOS.every((p) => photos[p]);
  const allChecks = OPEN_FINISH_CHECKS.every((c) => finishChecks[c]);

  const next = () => {
    updateJobWorkflow(id, step + 1, { comments, readyToLease, photos });
    setStep((s) => s + 1);
  };

  const finish = () => {
    if (!allChecks) {
      toast.error('Complete all finish confirmations');
      return;
    }
    completeJob(id);
    toast.success('Open inspection report sent to agent and landlord');
  };

  return (
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
                <button
                  key={area}
                  type="button"
                  onClick={() => togglePhoto(area)}
                  className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm ${
                    photos[area] ? 'border-primary bg-primary/10' : 'border-border'
                  }`}
                >
                  <span>{area}</span>
                  <Camera className="size-4" />
                </button>
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
              {OPEN_FINISH_CHECKS.map((check) => (
                <button
                  key={check}
                  type="button"
                  onClick={() => toggleCheck(check)}
                  className={`flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                    finishChecks[check] ? 'border-primary bg-primary/10' : ''
                  }`}
                >
                  <span
                    className={`size-4 rounded border ${finishChecks[check] ? 'bg-primary' : ''}`}
                  />
                  {check}
                </button>
              ))}
              <Button className="w-full" disabled={!allChecks} onClick={finish}>
                Finish Inspection & Generate Report
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </InspectorShell>
  );
}
