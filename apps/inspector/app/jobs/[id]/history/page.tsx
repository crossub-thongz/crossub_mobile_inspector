'use client';

import { useParams } from 'next/navigation';

import { AgentStrip } from '@/components/inspector/agent-strip';
import { JobHistoryReport } from '@/components/inspector/job-history-report';
import {
  JobStatusBadge,
  JobTypeBadge,
} from '@/components/inspector/status-badge';
import { JobLookupFallback } from '@/components/inspector/job-lookup-fallback';
import { InspectorShell } from '@/components/layout/inspector-shell';
import { useInspectorData } from '@/components/providers/inspector-data-provider';
import { ROUTES } from '@/constants/routes';
import { mergeJobWithHistory } from '@/lib/job-history';
import { isDemoJobId } from '@/lib/inspector-job-filters';
import { jobLookupMiss } from '@/lib/job-lookup';

export default function JobHistoryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { getJob, jobsHydrated } = useInspectorData();
  const raw = getJob(id);
  const job = raw
    ? mergeJobWithHistory(raw, { serverBacked: !isDemoJobId(raw.id) })
    : undefined;

  if (!job) {
    return (
      <JobLookupFallback
        state={jobLookupMiss(jobsHydrated)}
        backHref={ROUTES.HISTORY}
        missingTitle="Report not found"
      />
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
