'use client';

import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Camera, CheckCircle2, KeyRound } from 'lucide-react';
import { toast } from 'sonner';

import { InspectorShell } from '@/components/layout/inspector-shell';
import { useInspectorData } from '@/components/providers/inspector-data-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { jobDetail } from '@/constants/routes';
import {
  canAccessKeyReturnTab,
  getKeyWorkflow,
  isKeyCollectComplete,
  isKeyReturnComplete,
} from '@/lib/key-access-workflow';
import { cn } from '@/lib/utils';

type Tab = 'collect' | 'return';

export default function JobKeysPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') === 'return' ? 'return' : 'collect';
  const { getJob, saveKeyWorkflow } = useInspectorData();
  const job = getJob(id);

  const [tab, setTab] = useState<Tab>(initialTab);
  const [stepsConfirmed, setStepsConfirmed] = useState(false);
  const [photoConfirmed, setPhotoConfirmed] = useState(false);
  const [notes, setNotes] = useState('');

  if (!job) {
    return (
      <InspectorShell title="Key details" backHref={jobDetail(id)}>
        <p className="text-muted-foreground text-sm">Job not found.</p>
      </InspectorShell>
    );
  }

  if (!job.keyAccess) {
    return (
      <InspectorShell title="Key details" backHref={jobDetail(id)}>
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
  const workflow = getKeyWorkflow(job);
  const collectDone = isKeyCollectComplete(job);
  const returnDone = isKeyReturnComplete(job);
  const returnUnlocked = canAccessKeyReturnTab(job);

  const switchTab = (next: Tab) => {
    if (next === 'return' && !returnUnlocked) {
      toast.error('Complete key collection and start the inspection first.');
      return;
    }
    setTab(next);
  };

  useEffect(() => {
    const record = tab === 'collect' ? workflow?.collect : workflow?.return;
    setStepsConfirmed(record?.stepsConfirmed ?? false);
    setPhotoConfirmed(record?.photoConfirmed ?? false);
    setNotes(record?.notes ?? '');
  }, [tab, workflow?.collect, workflow?.return]);

  const submit = (phase: Tab) => {
    if (!stepsConfirmed) {
      toast.error('Confirm you completed all steps.');
      return;
    }
    if (access.photoRequired && !photoConfirmed) {
      toast.error('Confirm the photo was taken.');
      return;
    }
    saveKeyWorkflow(id, phase, {
      completedAt: new Date().toISOString(),
      stepsConfirmed: true,
      photoConfirmed: access.photoRequired ? photoConfirmed : undefined,
      notes: notes.trim() || undefined,
    });
    toast.success(
      phase === 'collect' ? 'Key collection recorded' : 'Key return recorded',
    );
    if (phase === 'collect') {
      setTab('return');
    }
  };

  const steps = tab === 'collect' ? access.collectSteps : access.returnSteps;
  const phaseDone = tab === 'collect' ? collectDone : returnDone;

  return (
    <InspectorShell title="Key details" backHref={jobDetail(id)}>
      <div className="space-y-4">
        <div className="flex gap-1 rounded-lg border bg-secondary/30 p-1">
          <button
            type="button"
            onClick={() => switchTab('collect')}
            className={cn(
              'flex-1 rounded-md px-3 py-2 text-xs font-medium transition',
              tab === 'collect'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground',
            )}
          >
            Collect
            {collectDone && <CheckCircle2 className="ml-1 inline size-3" />}
          </button>
          <button
            type="button"
            onClick={() => switchTab('return')}
            disabled={!returnUnlocked}
            className={cn(
              'flex-1 rounded-md px-3 py-2 text-xs font-medium transition',
              tab === 'return'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground',
              !returnUnlocked && 'cursor-not-allowed opacity-40',
            )}
          >
            Return
            {returnDone && <CheckCircle2 className="ml-1 inline size-3" />}
          </button>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <KeyRound className="text-primary size-4" />
              {tab === 'collect' ? 'Key collection' : 'Key return'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="font-medium">{access.location}</p>
            {access.code && tab === 'collect' && (
              <p className="rounded-lg border border-dashed border-primary/40 bg-primary/5 px-3 py-2 text-center font-mono text-lg font-bold tracking-widest text-primary">
                {access.code}
              </p>
            )}
            <ol className="list-decimal space-y-1 pl-4 text-xs">
              {steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </CardContent>
        </Card>

        {phaseDone ? (
          <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-400">
            <CheckCircle2 className="size-4 shrink-0" />
            {tab === 'collect' ? 'Collection' : 'Return'} completed — you can update
            below if needed.
          </div>
        ) : (
          <p className="text-muted-foreground text-xs">
            {tab === 'collect'
              ? 'Required before you can start the inspection.'
              : 'Required before you can complete this task.'}
          </p>
        )}

        <div className="space-y-3 rounded-lg border border-border/80 bg-card p-4">
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
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={photoConfirmed}
                onChange={(e) => setPhotoConfirmed(e.target.checked)}
                className="mt-0.5"
              />
              <span className="flex items-center gap-1.5">
                <Camera className="size-3.5" />
                Photo taken and saved
              </span>
            </label>
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

          <Button type="button" className="w-full" onClick={() => submit(tab)}>
            {phaseDone ? 'Update' : 'Confirm'}{' '}
            {tab === 'collect' ? 'collection' : 'return'}
          </Button>
        </div>
      </div>
    </InspectorShell>
  );
}
