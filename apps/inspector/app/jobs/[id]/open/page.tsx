'use client';

import { useParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, Square, Star, Users } from 'lucide-react';
import { toast } from 'sonner';

import { JobWorkflowToolbar } from '@/components/inspector/job-workflow-toolbar';
import { OpenInspectionCountdown } from '@/components/open-inspection/open-inspection-countdown';
import { OpenInspectionHelpCard } from '@/components/open-inspection/open-inspection-help-card';
import { OpenInspectionLinkQrBlock } from '@/components/open-inspection/open-inspection-link-qr-block';
import { OpenInspectionVisitorList } from '@/components/open-inspection/open-inspection-visitor-list';
import { JobLookupFallback } from '@/components/inspector/job-lookup-fallback';
import { KeyCollectionRequired } from '@/components/inspector/key-collection-required';
import { InspectorShell } from '@/components/layout/inspector-shell';
import { useInspectorData } from '@/components/providers/inspector-data-provider';
import { Button } from '@/components/ui/button';
import { jobDetail, ROUTES } from '@/constants/routes';
import { useFinishInspection } from '@/hooks/use-finish-inspection';
import {
  useAwaitingAgentPaymentGate,
  useInspectionFinishedGate,
  useInspectionInProgress,
  useKeyCollectGate,
} from '@/hooks/use-key-collect-gate';
import {
  fetchOpenViewing,
  splitOpenInspectionVisitors,
  startOpenViewing,
  type InspectorOpenViewing,
} from '@/lib/inspector-open-viewing';
import {
  formatOpenInspectionClock,
  openInspectionRemainingRatio,
} from '@/lib/open-inspection-ui';
import { cn, formatTime } from '@/lib/utils';
import { jobLookupMiss } from '@/lib/job-lookup';

type Tab = 'checkins' | 'qr';

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
  const paymentCleared = useAwaitingAgentPaymentGate(job, id);
  const keysCollected = useKeyCollectGate(job, id);
  useInspectionFinishedGate(job, id);
  useInspectionInProgress(job, id, updateJobStatus);

  const [tab, setTab] = useState<Tab>('checkins');
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
          session.sessionStatus !== 'open' &&
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

  const isBeforeScheduledStart = Boolean(
    viewing?.canStart && now < new Date(viewing.startTime).getTime(),
  );

  const windowEnded = Boolean(
    viewing && now >= new Date(viewing.endTime).getTime(),
  );

  const isCompleted = job?.status === 'completed';
  const canCompleteEarly = Boolean(viewing?.canCompleteEarly) && !isCompleted;
  const isLive =
    Boolean(viewing) &&
    !viewing?.canStart &&
    (canCompleteEarly || viewing?.sessionStatus === 'open' || isCompleted);

  const { checkIns, interested } = useMemo(
    () => splitOpenInspectionVisitors(viewing?.visitors ?? []),
    [viewing?.visitors],
  );

  const clock = viewing
    ? formatOpenInspectionClock(viewing.endTime, now)
    : '—';
  const remainingRatio = viewing
    ? openInspectionRemainingRatio(
        viewing.originalScheduledStart ?? viewing.startTime,
        viewing.endTime,
        now,
      )
    : 0;

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

  if (!paymentCleared) {
    return (
      <InspectorShell title="Open inspection" backHref={jobDetail(id)}>
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-3 text-sm text-amber-700 dark:text-amber-300">
          Waiting for the agency to pay the platform fee before you can start
          this job.
        </p>
      </InspectorShell>
    );
  }

  if (!keysCollected) {
    return <KeyCollectionRequired jobId={id} />;
  }

  return (
    <>
      <InspectorShell
        title="Open inspection"
        backHref={jobDetail(id)}
        hideAvailability={isLive}
      >
        <div className={cn('space-y-4', isLive ? 'pb-28' : 'pb-6')}>
          <JobWorkflowToolbar
            job={job}
            summaryLabel={`Property: ${job.propertyAddress}`}
          />

          {viewing?.awaitingAgentPayment ? (
            <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
              Waiting for the agency to pay the platform fee before you can start
              this open inspection.
            </p>
          ) : viewing?.canStart ? (
            <div className="border-border bg-card space-y-3 rounded-2xl border p-4">
              <p className="text-sm font-semibold">
                {formatTime(viewing.startTime)} – {formatTime(viewing.endTime)}
              </p>
              <p className="text-muted-foreground text-xs">
                Start the open inspection to open check-in and application links
                for prospects.
              </p>
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
            </div>
          ) : isLive && viewing ? (
            <>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-400">
                      <span className="size-1.5 rounded-full bg-emerald-400" />
                      Open now
                    </span>
                    <span className="text-muted-foreground text-xs">
                      Ends {formatTime(viewing.endTime)}
                    </span>
                  </div>
                  <p className="text-foreground text-lg font-semibold leading-tight">
                    {formatTime(viewing.startTime)} – {formatTime(viewing.endTime)}
                  </p>
                  {viewing.startedEarly && viewing.originalScheduledStart ? (
                    <p className="text-muted-foreground text-xs">
                      Started early — scheduled{' '}
                      {formatTime(viewing.originalScheduledStart)}
                    </p>
                  ) : null}
                </div>
                <OpenInspectionCountdown
                  clock={clock}
                  ratio={remainingRatio}
                  ended={windowEnded || isCompleted}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="border-border bg-card rounded-2xl border px-3 py-3">
                  <p className="text-muted-foreground flex items-center gap-1.5 text-[11px]">
                    <Users className="size-3.5" />
                    Checked in
                  </p>
                  <p className="mt-1 text-2xl font-semibold tabular-nums">
                    {checkIns.length}
                  </p>
                </div>
                <div className="border-border bg-card rounded-2xl border px-3 py-3">
                  <p className="text-muted-foreground flex items-center gap-1.5 text-[11px]">
                    <Star className="size-3.5" />
                    Interested
                  </p>
                  <p className="mt-1 text-2xl font-semibold tabular-nums">
                    {interested.length}
                  </p>
                </div>
              </div>

              <p className="text-muted-foreground text-xs leading-relaxed">
                Finish early anytime during the viewing, or this job completes
                automatically when the window ends.
              </p>
            </>
          ) : null}

          <div className="bg-muted/40 flex rounded-lg p-1">
            {(
              [
                ['checkins', `Check-ins (${checkIns.length})`],
                ['qr', 'QR & Links'],
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
            <OpenInspectionVisitorList
              checkIns={checkIns}
              interested={interested}
            />
          ) : (
            <div className="space-y-3">
              <p className="text-sm font-semibold">Share with Prospects</p>
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
              <OpenInspectionHelpCard />
            </div>
          )}
        </div>

        {isLive && viewing ? (
          <div className="border-border bg-background/95 fixed inset-x-0 z-40 border-t px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80"
            style={{ bottom: 'calc(4rem + env(safe-area-inset-bottom, 0px))' }}
          >
            <div className="mx-auto max-w-lg">
              {canCompleteEarly ? (
                <Button
                  className="h-12 w-full gap-2 bg-red-600 text-white hover:bg-red-600/90"
                  disabled={completing}
                  onClick={handleCompleteEarly}
                >
                  {completing ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Ending…
                    </>
                  ) : windowEnded ? (
                    'Ending…'
                  ) : (
                    <>
                      <Square className="size-3.5 fill-current" />
                      End open inspection
                    </>
                  )}
                </Button>
              ) : isCompleted ? (
                <Button className="h-12 w-full" disabled variant="secondary">
                  Completed
                </Button>
              ) : windowEnded ? (
                <Button className="h-12 w-full" disabled>
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
