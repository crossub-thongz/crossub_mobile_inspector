'use client';

import { Calculator, Wallet } from 'lucide-react';

import { EmptyState } from '@/components/inspector/empty-state';
import { JobTypeBadge } from '@/components/inspector/status-badge';
import { PageIntro } from '@/components/inspector/page-intro';
import { InspectorShell } from '@/components/layout/inspector-shell';
import { useInspectorData } from '@/components/providers/inspector-data-provider';
import {
  CORE_INSPECTION_TYPES,
  INSPECTOR_HOURLY_RATE_AUD,
  INSPECTION_TYPE_LABEL,
} from '@/constants/inspection';
import type { InspectionType } from '@/lib/types';
import { formatCurrency, formatDateTime } from '@/lib/utils';

export default function EarningsPage() {
  const { earnings, summary } = useInspectorData();

  const totalHours = earnings.reduce((s, e) => s + e.hoursWorked, 0);

  const byType = earnings.reduce(
    (acc, e) => {
      acc[e.type] = (acc[e.type] ?? 0) + e.amount;
      return acc;
    },
    {} as Record<InspectionType, number>,
  );

  const hoursByType = earnings.reduce(
    (acc, e) => {
      acc[e.type] = (acc[e.type] ?? 0) + e.hoursWorked;
      return acc;
    },
    {} as Record<InspectionType, number>,
  );

  const pendingAccounting = earnings.filter((e) => !e.accountingSynced).length;

  return (
    <InspectorShell title="Earnings">
      <div className="space-y-4">
        <PageIntro description="Inspection fees at $45/hour — calculated from logged on-site hours. No fuel or mileage allowance. Synced with Accounting for payroll." />

        <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 to-transparent p-5">
          <p className="text-muted-foreground text-xs font-medium uppercase">
            This Week
          </p>
          <p className="text-primary mt-1 text-3xl font-bold tabular-nums">
            {formatCurrency(summary.weeklyEarnings)}
          </p>
          <p className="text-muted-foreground mt-1 text-xs">
            {totalHours.toFixed(1)}h × ${INSPECTOR_HOURLY_RATE_AUD}/hr
          </p>
        </div>

        <div className="flex items-start gap-3 rounded-xl border border-border/80 bg-card p-4">
          <Calculator className="text-primary mt-0.5 size-5 shrink-0" />
          <div className="text-xs leading-relaxed">
            <p className="font-semibold">Fee calculation</p>
            <p className="text-muted-foreground mt-1">
              Each completed inspection is billed as{' '}
              <strong className="text-foreground">hours worked × $45</strong>.
              The Inspection Department confirms hours per property; Accounting
              processes payment. Mileage reimbursement has been removed.
            </p>
            {pendingAccounting > 0 && (
              <p className="mt-2 text-amber-400">
                {pendingAccounting} payment(s) pending Accounting sync
              </p>
            )}
          </div>
        </div>

        <section className="rounded-xl border bg-card p-4">
          <h2 className="mb-3 text-sm font-semibold">By inspection type</h2>
          <div className="grid grid-cols-2 gap-2">
            {CORE_INSPECTION_TYPES.map((type) => (
              <div
                key={type}
                className="rounded-lg border border-border/60 bg-secondary/20 p-3"
              >
                <JobTypeBadge type={type} />
                <p className="mt-2 text-lg font-bold tabular-nums">
                  {formatCurrency(byType[type] ?? 0)}
                </p>
                <p className="text-muted-foreground text-[10px]">
                  {(hoursByType[type] ?? 0).toFixed(1)}h · {INSPECTION_TYPE_LABEL[type]}
                </p>
              </div>
            ))}
            {(byType.tribunal ?? 0) > 0 && (
              <div className="rounded-lg border border-border/60 bg-secondary/20 p-3">
                <JobTypeBadge type="tribunal" />
                <p className="mt-2 text-lg font-bold tabular-nums">
                  {formatCurrency(byType.tribunal ?? 0)}
                </p>
                <p className="text-muted-foreground text-[10px]">
                  {(hoursByType.tribunal ?? 0).toFixed(1)}h
                </p>
              </div>
            )}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold">Payment history</h2>
          {earnings.length === 0 ? (
            <EmptyState
              icon={Wallet}
              title="No earnings yet"
              description="Complete inspections to see hourly fees here."
            />
          ) : (
            earnings.map((e) => (
              <div
                key={e.id}
                className="rounded-xl border border-border/80 bg-card p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <JobTypeBadge type={e.type} />
                  <span className="text-primary font-semibold tabular-nums">
                    {formatCurrency(e.amount)}
                  </span>
                </div>
                <p className="mt-2 text-sm">{e.propertyAddress}</p>
                <p className="text-muted-foreground mt-1 text-xs">
                  {e.hoursWorked}h × ${e.hourlyRate}/hr ·{' '}
                  {formatDateTime(e.completedAt)}
                </p>
                <p className="text-muted-foreground mt-1 text-[10px]">
                  Accounting: {e.accountingSynced ? 'Synced' : 'Pending sync'}
                </p>
              </div>
            ))
          )}
        </section>
      </div>
    </InspectorShell>
  );
}
