'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { MapPin, Phone, User } from 'lucide-react';

import { MapLinks } from '@/components/inspector/map-links';
import {
  JobStatusBadge,
  JobTypeBadge,
  PriorityBadge,
} from '@/components/inspector/status-badge';
import { InspectorShell } from '@/components/layout/inspector-shell';
import { useInspectorData } from '@/components/providers/inspector-data-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { jobWorkflow, ROUTES } from '@/constants/routes';
import { formatCurrency, formatDateTime } from '@/lib/utils';

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

  return (
    <InspectorShell title="Job Details" backHref={ROUTES.INSPECTIONS}>
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <JobTypeBadge type={job.type} />
          <PriorityBadge priority={job.priority} />
          <JobStatusBadge status={job.status} />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-start gap-2">
              <MapPin className="text-primary mt-0.5 size-4 shrink-0" />
              {job.propertyAddress}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-muted-foreground text-sm">
              {formatDateTime(job.scheduledTime)} · {job.distanceKm} km away
            </p>
            <p className="text-primary text-lg font-bold">
              {formatCurrency(job.payAmount)}
            </p>
            <p className="text-muted-foreground text-xs">
              Est. {job.estimatedHours}h × $45/hr — no mileage allowance
            </p>
            <MapLinks
              address={job.propertyAddress}
              lat={job.latitude}
              lng={job.longitude}
            />
          </CardContent>
        </Card>

        {(job.tenantName || job.agentName) && (
          <Card>
            <CardHeader>
              <CardTitle>Contacts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {job.tenantName && (
                <p className="flex items-center gap-2">
                  <User className="size-4 text-muted-foreground" />
                  Tenant: {job.tenantName}
                  {job.tenantPhone && (
                    <a href={`tel:${job.tenantPhone}`} className="text-primary ml-auto">
                      <Phone className="size-4" />
                    </a>
                  )}
                </p>
              )}
              {job.agentName && (
                <p className="flex items-center gap-2">
                  <User className="size-4 text-muted-foreground" />
                  Agent: {job.agentName}
                  {job.agentCompany && (
                    <span className="text-muted-foreground">({job.agentCompany})</span>
                  )}
                </p>
              )}
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

        {job.status === 'completed' ? (
          <Button className="w-full" variant="secondary" disabled>
            Report completed
          </Button>
        ) : (
          <Link href={workflowHref}>
            <Button
              className="w-full"
              disabled={!canStartInspection && job.status !== 'accepted'}
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
