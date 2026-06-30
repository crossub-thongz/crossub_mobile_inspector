'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
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
import { jobKeys, jobWorkflow, ROUTES } from '@/constants/routes';
import {
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
  const { getJob, updateJobStatus } = useInspectorData();
  const job = getJob(id);

  if (!job) {
    return (
      <InspectorShell title="Job not found" backHref={ROUTES.INSPECTIONS}>
        <p className="text-muted-foreground text-sm">This job could not be found.</p>
      </InspectorShell>
    );
  }

  const workflowHref = jobWorkflow(job.id, job.type);
  const canStartInspection =
    job.status === 'arrived' || job.status === 'in_progress';
  const keyCollectDone = isKeyCollectComplete(job);
  const keyReturnDone = isKeyReturnComplete(job);
  const startBlocked = job.keyAccess && !keyCollectDone;

  return (
    <InspectorShell title="Job Details" backHref={ROUTES.INSPECTIONS}>
      <div className="space-y-4">
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

        {job.keyAccess && (
          <Link href={jobKeys(job.id)}>
            <Button variant="outline" className="w-full justify-between">
              <span className="flex items-center gap-2">
                <KeyRound className="size-4" />
                Key details
              </span>
              <span className="text-muted-foreground text-[10px]">
                Collect {keyCollectDone ? '✓' : 'pending'}
                {' · '}
                Return {keyReturnDone ? '✓' : 'pending'}
              </span>
            </Button>
          </Link>
        )}

        <FindingsCard jobId={job.id} />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-start gap-2">
              <MapPin className="text-primary mt-0.5 size-4 shrink-0" />
              {job.propertyAddress}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
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

        {job.status !== 'completed' && (
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

        {job.status === 'completed' ? (
          <Button className="w-full" variant="secondary" disabled>
            Report completed
          </Button>
        ) : (
          <Link href={startBlocked ? jobKeys(job.id, 'collect') : workflowHref}>
            <Button
              className="w-full"
              disabled={startBlocked || (!canStartInspection && job.status !== 'accepted')}
            >
              Start {job.type} inspection
            </Button>
          </Link>
        )}

        {job.notes && (
          <p className="text-muted-foreground text-xs">{job.notes}</p>
        )}
      </div>
    </InspectorShell>
  );
}
