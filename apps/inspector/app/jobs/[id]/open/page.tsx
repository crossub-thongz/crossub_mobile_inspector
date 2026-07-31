'use client';

import { useParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Clock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { JobWorkflowToolbar } from '@/components/inspector/job-workflow-toolbar';
import { OpenInspectionLinkQrBlock } from '@/components/open-inspection/open-inspection-link-qr-block';
import { OpenInspectionVisitorList } from '@/components/open-inspection/open-inspection-visitor-list';
import { JobLookupFallback } from '@/components/inspector/job-lookup-fallback';
import { InspectorShell } from '@/components/layout/inspector-shell';
import { useInspectorData } from '@/components/providers/inspector-data-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { jobDetail, ROUTES } from '@/constants/routes';
import { useFinishInspection } from '@/hooks/use-finish-inspection';
import {
  useInspectionFinishedGate,
  useInspectionInProgress,
  useKeyCollectGate,
} from '@/hooks/use-key-collect-gate';
import {
  fetchOpenViewing,
  startOpenViewing,
  type InspectorOpenViewing,
} from '@/lib/inspector-open-viewing';
import { cn, formatDateTime } from '@/lib/utils';
import { jobLookupMiss } from '@/lib/job-lookup';

type Tab = 'checkins' | 'qr';

function formatCountdown(endIso: string, nowMs: number): string {
  const end = new Date(endIso).getTime();
  const diff = end - nowMs;
  if (Number.isNaN(end)) return '—';
  if (diff <= 0) return 'Viewing window ended';
  const totalSec = Math.floor(diff / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${m}m ${s}s remaining`;
  if (m > 0) return `${m}m ${s}s remaining`;
  return `${s}s remaining`;
}

function viewingTimes(viewing: InspectorOpenViewing, endTime: string) {
  return {
    startTime: viewing.openedAt ?? viewing.startTime,
    endTime,
  };
}

export default function OpenInspectionPage() {
  const { id } = useParams<{ id: string }>();
  const {
    getJob,
    updateJobStatus,
    completeOpenInspectionJob,
    refresh,
    jobsHydrated,
  } = useInspectorData();
  const job = getJob(id);
  const { celebrate, Celebration } = useFinishInspection(id);
  useKeyCollectGate(job, id);
  useInspectionFinishedGate(job, id);
  useInspectionInProgress(job, id, updateJobStatus);

  const [tab, setTab] = useState<Tab>('qr');
  const [viewing, setViewing] = useState<InspectorOpenViewing | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const autoCompleteTriggered = useRef(false);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const session = await fetchOpenViewing(id);
        if (cancelled) return;
        setViewing(session);
        if (
          session &&
          !session.canCompleteEarly &&
          session.sessionStatus !== 'OPEN' &&
          job?.status !== 'completed'
        ) {
          void refresh();
        }
      } catch {
        if (!cancelled) setViewing(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    const poll = window.setInterval(() => void load(), 5000);
    return () => {
      cancelled = true;
      window.clearInterval(poll);
    };
  }, [id, job?.status, refresh]);

  const countdown = useMemo(
    () => (viewing ? formatCountdown(viewing.endTime, now) : null),
    [viewing, now],
  );

  const scheduledLabel = viewing
    ? `${formatDateTime(viewing.startTime)} – ${formatDateTime(viewing.endTime)}`
    : job?.scheduledDate
      ? formatDateTime(job.scheduledDate)
      : '—';

  const isBeforeScheduledStart = Boolean(
    viewing?.canStart && now < new Date(viewing.startTime).getTime(),
  );

  const windowEnded = Boolean(
    viewing && now >= new Date(viewing.endTime).getTime(),
  );

  const isCompleted = job?.status === 'completed';
  const canCompleteEarly = Boolean(viewing?.canCompleteEarly) && !isCompleted;

  const runComplete = useCallback(
    async (early: boolean) => {
      if (!viewing || completing || isCompleted) return false;

      setCompleting(true);
      try {
        const endTime = early ? new Date().toISOString() : viewing.endTime;
        const ok = await completeOpenInspectionJob(
          id,
          viewingTimes(viewing, endTime),
        );
        if (!ok) {
          toast.error('Could not complete job');
          return false;
        }

        celebrate(
          early
            ? 'Open inspection finished early.'
            : 'Viewing window ended — job completed automatically.',
        );
        return true;
      } finally {
        setCompleting(false);
      }
    },
    [
      viewing,
      completing,
      isCompleted,
      completeOpenInspectionJob,
      id,
      celebrate,
    ],
  );

  useEffect(() => {
    if (!canCompleteEarly || !windowEnded || autoCompleteTriggered.current) {
      return;
    }
    autoCompleteTriggered.current = true;
    void runComplete(false);
  }, [canCompleteEarly, windowEnded, runComplete]);

  const handleStart = async () => {
    setStarting(true);
    try {
      const session = await startOpenViewing(id);
      setViewing(session);
      toast.success(
        session.startedEarly
          ? 'Open inspection started early — end time unchanged'
          : 'Open inspection is now live',
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not start open inspection');
    } finally {
      setStarting(false);
    }
  };

  const handleCompleteEarly = () => {
    void runComplete(true);
  };

  if (!job) {
    return (
      <JobLookupFallback
        state={jobLookupMiss(jobsHydrated)}
        backHref={ROUTES.INSPECTIONS}
      />
    );
  }

  return (
    <>
      <InspectorShell title="Open inspection" backHref={jobDetail(id)}>
        <div className="space-y-4 pb-28">
          <JobWorkflowToolbar job={job} />

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Viewing window</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="font-medium">{scheduledLabel}</p>
              {viewing?.startedEarly && viewing.originalScheduledStart ? (
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  Started early — originally scheduled from{' '}
                  {formatDateTime(viewing.originalScheduledStart)}
                </p>
              ) : null}
              {countdown ? (
                <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
                  <Clock className="size-3.5" />
                  {countdown}
                </p>
              ) : null}
              {canCompleteEarly ? (
                <p className="text-muted-foreground text-xs">
                  Finish early anytime during the viewing, or this job completes
                  automatically when the window ends.
                </p>
              ) : null}
              {viewing?.canStart ? (
                <Button
                  type="button"
                  className="w-full"
                  disabled={starting}
                  onClick={() => void handleStart()}
                >
                  {starting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Starting…
                    </>
                  ) : isBeforeScheduledStart ? (
                    'Start early'
                  ) : (
                    'Start open inspection'
                  )}
                </Button>
              ) : null}
            </CardContent>
          </Card>

          <div className="bg-muted/40 flex rounded-lg p-1">
            {(
              [
                ['checkins', 'Check-ins'],
                ['qr', 'QR & links'],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={cn(
                  'flex-1 rounded-md px-3 py-2 text-xs font-medium transition-colors',
                  tab === value
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground',
                )}
                onClick={() => setTab(value)}
              >
                {label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="text-muted-foreground flex items-center justify-center gap-2 py-12 text-sm">
              <Loader2 className="size-4 animate-spin" />
              Loading viewing session…
            </div>
          ) : viewing?.canStart ? (
            <p className="text-muted-foreground rounded-xl border border-dashed px-4 py-8 text-center text-sm">
              Start the open inspection to open check-in and application links for
              prospects.
            </p>
          ) : !viewing ? (
            <p className="text-muted-foreground rounded-xl border border-dashed px-4 py-8 text-center text-sm">
              Viewing links are not available for this job yet. Accept the job and
              refresh — if this persists, contact CROSSUB support.
            </p>
          ) : tab === 'checkins' ? (
            <OpenInspectionVisitorList visitors={viewing.visitors} />
          ) : (
            <div className="space-y-3">
              <OpenInspectionLinkQrBlock
                title="Check-in QR"
                description="Prospects scan to register their arrival at the open."
                url={viewing.checkInUrl}
                qrFilename={`check-in-${viewing.id.slice(0, 8)}.png`}
              />
              <OpenInspectionLinkQrBlock
                title="Application QR"
                description="Prospects scan to apply for this property."
                url={viewing.applyUrl}
                qrFilename={`apply-${viewing.id.slice(0, 8)}.png`}
              />
            </div>
          )}
        </div>

        {!viewing?.canStart ? (
          <div className="border-border bg-background/95 fixed inset-x-0 bottom-0 z-40 border-t px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80">
            <div className="mx-auto flex max-w-lg items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {isCompleted ? 'Status' : 'Scheduled end'}
                </p>
                <p className="truncate text-xs font-medium">
                  {isCompleted
                    ? 'Job completed'
                    : (countdown ?? (viewing ? formatDateTime(viewing.endTime) : '—'))}
                </p>
              </div>
              {canCompleteEarly ? (
                <Button
                  className="shrink-0"
                  disabled={completing}
                  onClick={handleCompleteEarly}
                >
                  {completing ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Completing…
                    </>
                  ) : windowEnded ? (
                    'Completing…'
                  ) : (
                    'Complete early'
                  )}
                </Button>
              ) : isCompleted ? (
                <Button className="shrink-0" disabled variant="secondary">
                  Completed
                </Button>
              ) : windowEnded ? (
                <Button className="shrink-0" disabled>
                  <Loader2 className="size-4 animate-spin" />
                  Completing…
                </Button>
              ) : null}
            </div>
          </div>
        ) : null}
      </InspectorShell>
      {Celebration}
    </>
  );
}
