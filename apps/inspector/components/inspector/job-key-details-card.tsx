'use client';

import { useState } from 'react';
import { ChevronDown, KeyRound } from 'lucide-react';

import { jobAccessMethodLabel, jobKeysCountLabel } from '@/lib/job-key-details';
import { formatDate } from '@/lib/utils';
import type { InspectionJob } from '@/lib/types';

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className="text-foreground min-w-0 truncate text-right text-xs font-medium">
        {value}
      </span>
    </div>
  );
}

export function JobKeyDetailsCard({ job }: { job: InspectionJob }) {
  const [open, setOpen] = useState(true);
  const leaseStart = job.leaseStart ? formatDate(job.leaseStart) : '—';
  const leaseEnd = job.leaseEnd ? formatDate(job.leaseEnd) : '—';
  const manager = job.agentName || job.agentCompany || '—';
  const instructions = job.notes?.trim() || '—';

  return (
    <div className="border-border bg-card overflow-hidden rounded-2xl border">
      <button
        type="button"
        className="flex w-full items-center gap-2 px-4 py-3 text-left"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
      >
        <KeyRound className="text-primary size-4 shrink-0" />
        <span className="text-foreground flex-1 text-sm font-semibold">Key Details</span>
        <ChevronDown
          className={`text-muted-foreground size-4 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open ? (
        <div className="border-border divide-y divide-border/70 border-t px-4">
          <DetailRow label="Tenant" value={job.tenantName?.trim() || '—'} />
          <DetailRow label="Lease Start" value={leaseStart} />
          <DetailRow label="Lease End" value={leaseEnd} />
          <DetailRow label="Property Manager" value={manager} />
          <DetailRow label="Access Method" value={jobAccessMethodLabel(job)} />
          <DetailRow label="Keys" value={jobKeysCountLabel(job)} />
          <DetailRow label="Special Instructions" value={instructions} />
        </div>
      ) : null}
    </div>
  );
}
