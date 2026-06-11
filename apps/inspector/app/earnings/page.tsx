'use client';

import { Wallet } from 'lucide-react';

import { EmptyState } from '@/components/inspector/empty-state';
import { JobTypeBadge } from '@/components/inspector/status-badge';
import { PageIntro } from '@/components/inspector/page-intro';
import { InspectorShell } from '@/components/layout/inspector-shell';
import { useInspectorData } from '@/components/providers/inspector-data-provider';
import { INSPECTION_PAY_LABEL } from '@/constants/inspection';
import type { InspectionType } from '@/lib/types';
import { formatCurrency, formatDateTime } from '@/lib/utils';

export default function EarningsPage() {
  const { earnings, summary } = useInspectorData();

  const byType = earnings.reduce(
    (acc, e) => {
      acc[e.type] = (acc[e.type] ?? 0) + e.amount;
      return acc;
    },
    {} as Record<InspectionType, number>,
  );

  return (
    <InspectorShell title="Earnings">
      <div className="space-y-4">
        <PageIntro description="Completed jobs by inspection type. Future integration with payroll system." />

        <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 to-transparent p-5">
          <p className="text-muted-foreground text-xs font-medium uppercase">
            This Week
          </p>
          <p className="text-primary mt-1 text-3xl font-bold tabular-nums">
            {formatCurrency(summary.weeklyEarnings)}
          </p>
        </div>

        <section className="rounded-xl border bg-card p-4">
          <h2 className="mb-3 text-sm font-semibold">By Type</h2>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(INSPECTION_PAY_LABEL) as InspectionType[]).map(
              (type) => (
                <div
                  key={type}
                  className="rounded-lg border border-border/60 bg-secondary/20 p-3"
                >
                  <JobTypeBadge type={type} />
                  <p className="mt-2 text-lg font-bold tabular-nums">
                    {formatCurrency(byType[type] ?? 0)}
                  </p>
                </div>
              ),
            )}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold">Payment History</h2>
          {earnings.length === 0 ? (
            <EmptyState
              icon={Wallet}
              title="No earnings yet"
              description="Complete inspections to see earnings here."
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
                  {formatDateTime(e.completedAt)}
                </p>
              </div>
            ))
          )}
        </section>
      </div>
    </InspectorShell>
  );
}
