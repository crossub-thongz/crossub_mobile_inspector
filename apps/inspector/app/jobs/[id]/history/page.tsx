'use client';

import { useParams } from 'next/navigation';

import { AgentStrip } from '@/components/inspector/agent-strip';
import { JobHistoryReport } from '@/components/inspector/job-history-report';
import {
  JobStatusBadge,
  JobTypeBadge,
} from '@/components/inspector/status-badge';
import { InspectorShell } from '@/components/layout/inspector-shell';
import { useInspectorData } from '@/components/providers/inspector-data-provider';
import { ROUTES } from '@/constants/routes';
import { mergeJobWithHistory } from '@/lib/job-history';
import { isDemoJobId } from '@/lib/inspector-job-filters';

export default function JobHistoryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { getJob } = useInspectorData();
  const raw = getJob(id);
  const job = raw
    ? mergeJobWithHistory(raw, { serverBacked: !isDemoJobId(raw.id) })
    : undefined;

  if (!job) {
    return (
      <InspectorShell title="Report not found" backHref={ROUTES.HISTORY}>
        <p className="text-muted-foreground text-sm">This job could not be found.</p>
      </InspectorShell>
    );
  }

  return (
    <InspectorShell title="Inspection report" backHref={ROUTES.HISTORY}>
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <JobTypeBadge type={job.type} />
          <JobStatusBadge status={job.status} />
        </div>

        <div>
          <p className="text-sm font-semibold">{job.propertyAddress}</p>
          <p className="text-muted-foreground text-xs">{job.suburb}</p>
        </div>

        {(job.agentName || job.agentCompany) && <AgentStrip job={job} compact />}

        <JobHistoryReport job={job} />
      </div>
    </InspectorShell>
  );
}
