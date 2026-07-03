'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { FileText, Search } from 'lucide-react';

import { EmptyState } from '@/components/inspector/empty-state';
import {
  JobStatusBadge,
  JobTypeBadge,
} from '@/components/inspector/status-badge';
import { InspectorShell } from '@/components/layout/inspector-shell';
import { useInspectorData } from '@/components/providers/inspector-data-provider';
import { Input } from '@/components/ui/input';
import { jobHistory, ROUTES } from '@/constants/routes';
import {
  buildJobHistoryReport,
  mergeJobWithHistory,
  sortJobsByHistoryDate,
} from '@/lib/job-history';
import { isDemoJobId } from '@/lib/inspector-job-filters';
import { formatDateTime } from '@/lib/utils';

export default function HistoryPage() {
  const { completedJobs } = useInspectorData();
  const [query, setQuery] = useState('');

  const jobs = useMemo(() => {
    const withHistory = completedJobs.map((job) =>
      mergeJobWithHistory(job, { serverBacked: !isDemoJobId(job.id) }),
    );
    return sortJobsByHistoryDate(withHistory);
  }, [completedJobs]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return jobs;
    return jobs.filter(
      (j) =>
        j.propertyAddress.toLowerCase().includes(q) ||
        j.suburb.toLowerCase().includes(q),
    );
  }, [jobs, query]);

  return (
    <InspectorShell title="Job history" backHref={ROUTES.DASHBOARD}>
      <div className="space-y-4">
        <p className="text-muted-foreground text-xs">
          Completed inspections with key collection proof and uploaded section
          photos.
        </p>

        <div className="relative">
          <Input
            placeholder="Search address or suburb"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-9 pr-9"
          />
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2" />
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No completed jobs yet"
            description="Finished inspections will appear here with proof photos and key records."
          />
        ) : (
          <div className="space-y-3">
            {filtered.map((job) => {
              const report = buildJobHistoryReport(job);
              const proofCount =
                report.readinessPhotos.length +
                report.finishPhotos.length +
                (report.keyCollect?.photoUrls?.length ?? 0) +
                (report.keyReturn?.photoUrls?.length ?? 0);

              return (
                <Link
                  key={job.id}
                  href={jobHistory(job.id)}
                  className="block rounded-xl border border-border/80 bg-card p-4 transition hover:border-primary/30"
                >
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <JobTypeBadge type={job.type} />
                    <JobStatusBadge status={job.status} />
                  </div>
                  <p className="text-sm font-semibold leading-snug">
                    {job.propertyAddress}
                  </p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    {formatDateTime(job.scheduledTime)}
                    {report.completedAt && (
                      <>
                        {' · '}
                        Report {formatDateTime(report.completedAt)}
                      </>
                    )}
                  </p>
                  <p className="text-primary mt-2 text-xs font-medium">
                    View report
                    {proofCount > 0 && (
                      <span className="text-muted-foreground font-normal">
                        {' '}
                        · {proofCount} proof photo{proofCount === 1 ? '' : 's'}
                      </span>
                    )}
                  </p>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </InspectorShell>
  );
}
