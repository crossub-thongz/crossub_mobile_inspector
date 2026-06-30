'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { KeyRound, MapPin, Phone, User } from 'lucide-react';

import { AgentStrip } from '@/components/inspector/agent-strip';
import { FindingsCard } from '@/components/inspector/findings-card';
import { MapLinks } from '@/components/inspector/map-links';
import { PayBreakdown } from '@/components/inspector/pay-breakdown';
import {
  JobStatusBadge,
  JobTypeBadge,
  PriorityBadge,
} from '@/components/inspector/status-badge';
import { InspectorShell } from '@/components/layout/inspector-shell';
import { useInspectorData } from '@/components/providers/inspector-data-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { jobHistory, jobKeys, jobWorkflow, ROUTES } from '@/constants/routes';
import { isPoolJob } from '@/lib/inspector-job-filters';
import {
  isInspectionWorkflowFinished,
  isKeyCollectComplete,
  isKeyReturnComplete,
} from '@/lib/key-access-workflow';
import { formatDateTime } from '@/lib/utils';

const STATUS_FLOW = [
  { status: 'accepted' as const, label: 'Accepted' },
  { status: 'on_the_way' as const, label: 'On the way' },
  { status: 'arrived' as const, label: 'Arrived' },
  { status: 'in_progress' as const, label: 'In progress' },
];

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { getJob, updateJobStatus, acceptJob, declineJob } = useInspectorData();
  const job = getJob(id);

  if (!job) {
    return (
      <InspectorShell title="Job not found" backHref={ROUTES.JOB_POOL}>
        <p className="text-muted-foreground text-sm">This job could not be found.</p>
      </InspectorShell>
    );
  }

  const poolPreview = isPoolJob(job);
  const backHref = poolPreview ? ROUTES.JOB_POOL : ROUTES.INSPECTIONS;

  const workflowHref = jobWorkflow(job.id, job.type);
  const workflowStarted = (job.workflowStep ?? 0) > 0;
  const canStartInspection =
    job.status === 'arrived' || job.status === 'in_progress';
  const keyCollectDone = isKeyCollectComplete(job);
  const keyReturnDone = isKeyReturnComplete(job);
  const inspectionFinished = isInspectionWorkflowFinished(job);
  const startBlocked = job.keyAccess && !keyCollectDone;
  const returnPending =
    job.keyAccess && inspectionFinished && !keyReturnDone && job.status !== 'completed';

  return (
    <InspectorShell title={poolPreview ? 'Job preview' : 'Job Details'} backHref={backHref}>
      <div className="space-y-4">
        {poolPreview && (
          <p className="text-muted-foreground text-xs">
            Review the job details below. Accept to add it to your inspections, or go
            back to the pool.
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          <JobTypeBadge type={job.type} />
          <PriorityBadge priority={job.priority} />
          <JobStatusBadge status={job.status} />
        </div>

        {(job.agentName || job.agentCompany) && (
          <section className="space-y-1">
            <p className="text-muted-foreground text-[10px] font-medium uppercase tracking-wide">
              Agent information
            </p>
            <AgentStrip job={job} />
          </section>
        )}

        {job.keyAccess && !poolPreview && (
          <Link
            href={jobKeys(job.id)}
            className="group flex w-full flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-sm transition-colors hover:border-primary/40 hover:bg-primary/10"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <KeyRound className="text-primary size-4 shrink-0" />
                Key details
              </span>
              <span className="text-right text-[10px] text-muted-foreground group-hover:text-foreground">
                Collect {keyCollectDone ? '✓' : 'pending'}
                <span className="text-muted-foreground/60 group-hover:text-foreground/70">
                  {' · '}
                </span>
                Return {keyReturnDone ? '✓' : 'pending'}
              </span>
            </div>
          </Link>
        )}

        {!poolPreview && <FindingsCard jobId={job.id} />}

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-start gap-2">
              <MapPin className="text-primary mt-0.5 size-4 shrink-0" />
              {job.propertyAddress}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-muted-foreground text-sm">{job.durationLabel}</p>
            <p className="text-muted-foreground text-sm">
              {formatDateTime(job.scheduledTime)} · {job.distanceKm} km to property
            </p>
            <PayBreakdown
              hours={job.estimatedHours}
              laborAmount={job.laborAmount}
              durationLabel={job.durationLabel}
            />
            <MapLinks
              address={job.propertyAddress}
              lat={job.latitude}
              lng={job.longitude}
            />
          </CardContent>
        </Card>

        {job.tenantName && (
          <Card>
            <CardHeader>
              <CardTitle>Tenant</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <p className="flex items-center gap-2">
                <User className="size-4 text-muted-foreground" />
                {job.tenantName}
                {job.tenantPhone && (
                  <a href={`tel:${job.tenantPhone}`} className="text-primary ml-auto">
                    <Phone className="size-4" />
                  </a>
                )}
              </p>
            </CardContent>
          </Card>
        )}

        {job.status !== 'completed' && !poolPreview && (
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {STATUS_FLOW.map(({ status, label }) => (
                <Button
                  key={status}
                  size="sm"
                  variant={job.status === status ? 'default' : 'outline'}
                  onClick={() => updateJobStatus(job.id, status)}
                >
                  {label}
                </Button>
              ))}
            </CardContent>
          </Card>
        )}

        {startBlocked && (
          <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-400">
            Complete key collection before starting the inspection.
          </p>
        )}

        {returnPending && (
          <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-400">
            Inspection finished — return the keys to complete this task.
          </p>
        )}

        {poolPreview ? (
          <div className="space-y-2">
            <Button className="w-full" onClick={() => acceptJob(id)}>
              Accept job
            </Button>
            <Button
              className="w-full"
              variant="outline"
              onClick={() => {
                declineJob(id);
                router.push(ROUTES.JOB_POOL);
              }}
            >
              Decline
            </Button>
            <Button
              className="w-full"
              variant="ghost"
              onClick={() => router.push(ROUTES.JOB_POOL)}
            >
              Back to pool
            </Button>
          </div>
        ) : job.status === 'completed' ? (
          <Link href={jobHistory(job.id)}>
            <Button className="w-full">View inspection report</Button>
          </Link>
        ) : returnPending ? (
          <Link href={jobKeys(job.id, 'return')}>
            <Button className="w-full">Return keys</Button>
          </Link>
        ) : (
          <Link href={startBlocked ? jobKeys(job.id, 'collect') : workflowHref}>
            <Button
              className="w-full"
              disabled={startBlocked || (!canStartInspection && job.status !== 'accepted')}
            >
              {workflowStarted ? 'Continue' : 'Start'} {job.type} inspection
            </Button>
          </Link>
        )}

        {!poolPreview && workflowStarted && job.status !== 'completed' && (
          <p className="text-muted-foreground text-center text-[10px]">
            Progress saved — you can continue where you left off.
          </p>
        )}

        {job.notes && (
          <p className="text-muted-foreground text-xs">{job.notes}</p>
        )}
      </div>
    </InspectorShell>
  );
}
