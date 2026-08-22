'use client';

import { InspectorShell } from '@/components/layout/inspector-shell';
import { JobWorkspaceNav } from '@/components/inspector/job-workspace-nav';
import { INSPECTION_PAY_LABEL } from '@/constants/inspection';
import { jobDetail } from '@/constants/routes';
import type { InspectionJob } from '@/lib/types';

export function JobWorkspaceShell({
  job,
  active,
  children,
}: {
  job: InspectionJob;
  active: 'details' | 'handover' | 'areas' | 'start';
  children: React.ReactNode;
}) {
  return (
    <InspectorShell
      title={`${INSPECTION_PAY_LABEL[job.type] ?? job.type} Inspection`}
      backHref={jobDetail(job.id)}
      variant="workspace"
      hideAvailability={active === 'start'}
    >
      <div
        className="sticky z-30 bg-background"
        style={{ top: 'var(--inspector-header-height, 3.5rem)' }}
      >
        <JobWorkspaceNav job={job} active={active} />
      </div>
      <div className="pt-4">{children}</div>
    </InspectorShell>
  );
}
