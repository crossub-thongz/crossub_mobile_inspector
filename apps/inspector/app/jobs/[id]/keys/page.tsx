'use client';

import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CheckCircle2, KeyRound } from 'lucide-react';
import { toast } from 'sonner';

import { HandoverCollectForm } from '@/components/inspector/handover-collect-form';
import { JobWorkspaceNav } from '@/components/inspector/job-workspace-nav';
import { JobPropertyHeader } from '@/components/inspector/job-property-header';
import { KeyPhasePhotoField } from '@/components/inspector/key-phase-photo-field';
import { LeasingKeyCollectionPanel } from '@/components/inspector/leasing-key-collection-panel';
import { NoImageDialog } from '@/components/inspector/no-image-dialog';
import { JobLookupFallback } from '@/components/inspector/job-lookup-fallback';
import { InspectorShell } from '@/components/layout/inspector-shell';
import { useInspectorData } from '@/components/providers/inspector-data-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { INSPECTION_PAY_LABEL } from '@/constants/inspection';
import { jobAreas, jobDetail } from '@/constants/routes';
import {
  useAwaitingAgentPaymentGate,
  useKeyReturnGate,
} from '@/hooks/use-key-collect-gate';
import {
  canAccessKeyReturnTab,
  getKeyWorkflow,
  isKeyCollectComplete,
  isKeyReturnComplete,
  type KeyPhaseRecord,
} from '@/lib/key-access-workflow';
import { cn, formatDateTime } from '@/lib/utils';
import { jobLookupMiss } from '@/lib/job-lookup';

type Tab = 'collect' | 'return';

export default function JobKeysPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') === 'return' ? 'return' : 'collect';
  const { getJob, saveKeyWorkflow, completeJob, refresh, jobsHydrated, profile, deviceLocation } =
    useInspectorData();
  const job = getJob(id);

  const [tab, setTab] = useState<Tab>(initialTab);
  const [stepsConfirmed, setStepsConfirmed] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [noImageOpen, setNoImageOpen] = useState(false);

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'return' || tabParam === 'collect') {
      setTab(tabParam);
    }
  }, [searchParams]);

  const paymentCleared = useAwaitingAgentPaymentGate(job, id);
  const workflow = job ? getKeyWorkflow(job) : undefined;
  const collectDone = job ? isKeyCollectComplete(job) : false;
  const returnDone = job ? isKeyReturnComplete(job) : false;
  const returnUnlocked = job ? canAccessKeyReturnTab(job) : false;

  useKeyReturnGate(job, id, tab);

  const phaseDone = tab === 'collect' ? collectDone : returnDone;
  const phaseRecord = tab === 'collect' ? workflow?.collect : workflow?.return;
  const jobAvailable = job != null;

  useEffect(() => {
    void refresh();
  }, [id, refresh]);

  useEffect(() => {
    if (!job) return;
    const record =
      tab === 'collect' ? getKeyWorkflow(job)?.collect : getKeyWorkflow(job)?.return;
    setStepsConfirmed(record?.stepsConfirmed ?? false);
    setPhotos(record?.photoUrls ?? []);
    setNotes(record?.notes ?? '');
  }, [id, tab, jobAvailable]);

  if (!job) {
    return (
      <JobLookupFallback
        state={jobLookupMiss(jobsHydrated)}
        backHref={jobDetail(id)}
        missingTitle="Handover"
      />
    );
  }

  if (!paymentCleared) {
    return null;
  }

  if (!job.keyAccess) {
    return (
      <InspectorShell
        title={`${INSPECTION_PAY_LABEL[job.type] ?? job.type} Inspection`}
        backHref={jobDetail(id)}
        variant="workspace"
      >
        <JobWorkspaceNav job={job} active="handover" />
        <p className="text-muted-foreground text-sm">
          No key collection required for this job.
        </p>
        <Link href={jobDetail(id)}>
          <Button className="mt-4 w-full">Back to job</Button>
        </Link>
      </InspectorShell>
    );
  }

  const access = job.keyAccess;

  const switchTab = (next: Tab) => {
    if (next === 'return' && !returnUnlocked) {
      toast.error('Finish the inspection before returning keys.');
      return;
    }
    setTab(next);
  };

  const submitCollect = async (record: KeyPhaseRecord) => {
    if (collectDone) return;
    try {
      setSubmitting(true);
      await saveKeyWorkflow(id, 'collect', record);
    } catch {
      return;
    } finally {
      setSubmitting(false);
    }
    toast.success('Handover recorded');
    router.replace(jobAreas(id, job.type));
  };

  const submitReturn = async () => {
    if (returnDone) return;

    if (!stepsConfirmed) {
      toast.error('Confirm you completed all steps.');
      return;
    }
    if (access.photoRequired && photos.length === 0) {
      setNoImageOpen(true);
      return;
    }

    try {
      setSubmitting(true);
      await saveKeyWorkflow(id, 'return', {
        completedAt: new Date().toISOString(),
        stepsConfirmed: true,
        photoConfirmed: access.photoRequired ? true : undefined,
        photoUrls: access.photoRequired ? photos : undefined,
        notes: notes.trim() || undefined,
      });
    } catch {
      return;
    } finally {
      setSubmitting(false);
    }

    toast.success('Handover recorded · keys returned');
    setTimeout(() => {
      completeJob(id);
      router.replace(jobDetail(id));
    }, 0);
  };

  const steps = access.returnSteps;

  return (
    <InspectorShell
      title={`${INSPECTION_PAY_LABEL[job.type] ?? job.type} Inspection`}
      backHref={jobDetail(id)}
      variant="workspace"
    >
      <JobWorkspaceNav job={job} active="handover" />
      <div className="space-y-5">
        <div className="mt-4 mb-1 flex gap-1.5 rounded-xl border bg-secondary/30 p-1.5">
          <button
            type="button"
            onClick={() => switchTab('collect')}
            className={cn(
              'flex flex-1 flex-col items-center gap-0.5 rounded-lg px-2 py-2.5 text-center transition',
              tab === 'collect'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground',
            )}
          >
            <span className="flex items-center gap-1 text-xs font-semibold">
              Handover
              {collectDone ? <CheckCircle2 className="size-3.5" /> : null}
            </span>
            <span className="text-[10px] leading-tight font-medium">
              Collecting keys
            </span>
          </button>
          <button
            type="button"
            onClick={() => switchTab('return')}
            disabled={!returnUnlocked}
            className={cn(
              'flex flex-1 flex-col items-center gap-0.5 rounded-lg px-2 py-2.5 text-center transition',
              tab === 'return'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground',
              !returnUnlocked && 'cursor-not-allowed opacity-40',
            )}
          >
            <span className="flex items-center gap-1 text-xs font-semibold">
              Handover
              {returnDone ? <CheckCircle2 className="size-3.5" /> : null}
            </span>
            <span className="text-[10px] leading-tight font-medium">
              Returning keys
            </span>
          </button>
        </div>

        {job.leasingKeyCollection && (
          <LeasingKeyCollectionPanel context={job.leasingKeyCollection} />
        )}

        {tab === 'collect' ? (
          collectDone ? (
            <div className="space-y-4">
              <JobPropertyHeader job={job} inspectorName={profile.name} />
              <div className="space-y-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4">
                <div className="flex items-center gap-2 text-xs text-emerald-400">
                  <CheckCircle2 className="size-4 shrink-0" />
                  <span>
                    Handover completed · Collecting keys
                    {phaseRecord?.completedAt
                      ? ` · ${formatDateTime(phaseRecord.completedAt)}`
                      : ''}
                  </span>
                </div>
                {phaseRecord?.handoverParty ? (
                  <p className="text-xs">
                    With {phaseRecord.handoverParty}
                    {phaseRecord.contactName ? ` · ${phaseRecord.contactName}` : ''}
                  </p>
                ) : null}
                {(phaseRecord?.photoUrls?.length ?? 0) > 0 ? (
                  <KeyPhasePhotoField
                    label="Submitted photos"
                    photos={phaseRecord?.photoUrls ?? []}
                    onChange={() => undefined}
                    disabled
                  />
                ) : (
                  <KeyPhasePhotoField
                    label="Submitted photos"
                    photos={[]}
                    onChange={() => undefined}
                    disabled
                    onEmptyPress={() => setNoImageOpen(true)}
                  />
                )}
                {phaseRecord?.notes && (
                  <p className="text-muted-foreground whitespace-pre-wrap text-xs">
                    {phaseRecord.notes}
                  </p>
                )}
                <p className="text-muted-foreground text-[10px]">
                  This step cannot be edited after submission.
                </p>
                <Link href={jobDetail(id)}>
                  <Button className="w-full">Back to job details</Button>
                </Link>
              </div>
            </div>
          ) : (
            <HandoverCollectForm
              job={job}
              inspectorName={profile.name}
              deviceLocation={deviceLocation}
              submitting={submitting}
              initial={phaseRecord}
              onSubmit={submitCollect}
            />
          )
        ) : phaseDone ? (
          <div className="space-y-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4">
            <div className="flex items-center gap-2 text-xs text-emerald-400">
              <CheckCircle2 className="size-4 shrink-0" />
              <span>
                Handover completed · Returning keys
                {phaseRecord?.completedAt
                  ? ` · ${formatDateTime(phaseRecord.completedAt)}`
                  : ''}
              </span>
            </div>
            {access.photoRequired && (phaseRecord?.photoUrls?.length ?? 0) > 0 && (
              <KeyPhasePhotoField
                label="Submitted photos"
                photos={phaseRecord?.photoUrls ?? []}
                onChange={() => undefined}
                disabled
              />
            )}
            {phaseRecord?.notes && (
              <p className="text-muted-foreground text-xs">Notes: {phaseRecord.notes}</p>
            )}
            <p className="text-muted-foreground text-[10px]">
              This step cannot be edited after submission.
            </p>
            <Link href={jobDetail(id)}>
              <Button className="w-full">Back to job details</Button>
            </Link>
          </div>
        ) : (
          <>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <KeyRound className="text-primary size-4" />
                  Handover (returning keys)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <p className="font-medium">{access.location}</p>
                <ol className="list-decimal space-y-2 pl-4 text-xs leading-relaxed">
                  {steps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
              </CardContent>
            </Card>

            <p className="text-muted-foreground text-xs">
              Required after the inspection is finished — completes the task.
            </p>

            <div className="space-y-4 rounded-lg border border-border/80 bg-card p-4">
              <label className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={stepsConfirmed}
                  onChange={(e) => setStepsConfirmed(e.target.checked)}
                  className="mt-0.5"
                />
                <span>I confirm all steps above are done</span>
              </label>

              {access.photoRequired && (
                <KeyPhasePhotoField
                  photos={photos}
                  onChange={setPhotos}
                  onEmptyPress={() => setNoImageOpen(true)}
                />
              )}

              <div className="space-y-2">
                <Label htmlFor="key-notes">Notes (optional)</Label>
                <Input
                  id="key-notes"
                  placeholder="e.g. lockbox stiff, left keys with agent"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <Button
                type="button"
                className="w-full"
                disabled={submitting}
                onClick={() => void submitReturn()}
              >
                {submitting ? 'Uploading proof…' : 'Handover completed'}
              </Button>
            </div>
          </>
        )}
      </div>
      <NoImageDialog
        open={noImageOpen}
        onClose={() => setNoImageOpen(false)}
        message="Add at least one photo before completing this step."
      />
    </InspectorShell>
  );
}
