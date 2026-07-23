'use client';

import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Clock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { JobWorkflowToolbar } from '@/components/inspector/job-workflow-toolbar';
import { OpenInspectionLinkQrBlock } from '@/components/open-inspection/open-inspection-link-qr-block';
import { OpenInspectionVisitorList } from '@/components/open-inspection/open-inspection-visitor-list';
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
  type InspectorOpenViewing,
} from '@/lib/inspector-open-viewing';
import { cn, formatDateTime } from '@/lib/utils';

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

export default function OpenInspectionPage() {
  const { id } = useParams<{ id: string }>();
  const { getJob, updateJobStatus } = useInspectorData();
  const job = getJob(id);
  const { finish: completeJob, Celebration } = useFinishInspection(id);
  useKeyCollectGate(job, id);
  useInspectionFinishedGate(job, id);
  useInspectionInProgress(job, id, updateJobStatus);

  const [tab, setTab] = useState<Tab>('qr');
  const [viewing, setViewing] = useState<InspectorOpenViewing | null>(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const session = await fetchOpenViewing(id);
        if (!cancelled) setViewing(session);
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
  }, [id]);

  const countdown = useMemo(
    () => (viewing ? formatCountdown(viewing.endTime, now) : null),
    [viewing, now],
  );

  const scheduledLabel = viewing
    ? `${formatDateTime(viewing.startTime)} – ${formatDateTime(viewing.endTime)}`
    : job?.scheduledDate
      ? formatDateTime(job.scheduledDate)
      : '—';

  const handleComplete = () => {
    setCompleting(true);
    try {
      completeJob('Open inspection complete');
    } catch {
      toast.error('Could not complete job');
    } finally {
      setCompleting(false);
    }
  };

  if (!job) {
    return (
      <InspectorShell title="Job not found" backHref={ROUTES.INSPECTIONS}>
        <p className="text-muted-foreground text-sm">Job not found.</p>
      </InspectorShell>
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
            <CardContent className="space-y-1 text-sm">
              <p className="font-medium">{scheduledLabel}</p>
              {countdown ? (
                <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
                  <Clock className="size-3.5" />
                  {countdown}
                </p>
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

        <div className="border-border bg-background/95 fixed inset-x-0 bottom-0 z-40 border-t px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <div className="mx-auto flex max-w-lg items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Scheduled end
              </p>
              <p className="truncate text-xs font-medium">
                {countdown ?? (viewing ? formatDateTime(viewing.endTime) : '—')}
              </p>
            </div>
            <Button
              className="shrink-0"
              disabled={completing || job.status === 'completed'}
              onClick={handleComplete}
            >
              {completing ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Completing…
                </>
              ) : (
                'Complete job'
              )}
            </Button>
          </div>
        </div>
      </InspectorShell>
      {Celebration}
    </>
  );
}
