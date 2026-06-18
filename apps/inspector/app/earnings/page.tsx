'use client';

import { Wallet } from 'lucide-react';

import { EmptyState } from '@/components/inspector/empty-state';
import { PayBreakdown, RatesGuidelinesCard } from '@/components/inspector/pay-breakdown';
import { JobTypeBadge } from '@/components/inspector/status-badge';
import { PageIntro } from '@/components/inspector/page-intro';
import { InspectorShell } from '@/components/layout/inspector-shell';
import { useInspectorData } from '@/components/providers/inspector-data-provider';
import {
  CORE_INSPECTION_TYPES,
  FUEL_RATE_PER_KM_AUD,
  INSPECTOR_HOURLY_RATE_AUD,
  INSPECTION_TYPE_LABEL,
} from '@/constants/inspection';
import type { InspectionType } from '@/lib/types';
import { formatCurrency, formatDateTime } from '@/lib/utils';

export default function EarningsPage() {
  const { earnings, summary } = useInspectorData();

  const totalHours = earnings.reduce((s, e) => s + e.hoursWorked, 0);
  const totalLabor = earnings.reduce((s, e) => s + e.laborAmount, 0);
  const totalFuel = earnings.reduce((s, e) => s + e.fuelAllowance, 0);

  const byType = earnings.reduce(
    (acc, e) => {
      acc[e.type] = (acc[e.type] ?? 0) + e.amount;
      return acc;
    },
    {} as Record<InspectionType, number>,
  );

  const pendingAccounting = earnings.filter((e) => !e.accountingSynced).length;

  return (
    <InspectorShell title="Earnings">
      <div className="space-y-4">
        <PageIntro description="Fees per Inspector Rates & Property Inspection Time Guidelines — $35/hr labour plus $0.80/km fuel (one-way from regional midpoint). Synced with Accounting." />

        <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 to-transparent p-5">
          <p className="text-muted-foreground text-xs font-medium uppercase">
            This Week
          </p>
          <p className="text-primary mt-1 text-3xl font-bold tabular-nums">
            {formatCurrency(summary.weeklyEarnings)}
          </p>
          <p className="text-muted-foreground mt-1 text-xs">
            Labour {formatCurrency(totalLabor)} + Fuel {formatCurrency(totalFuel)}{' '}
            · {totalHours.toFixed(1)}h on-site
          </p>
        </div>

        <RatesGuidelinesCard />

        {pendingAccounting > 0 && (
          <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-400">
            {pendingAccounting} payment(s) pending Accounting sync
          </p>
        )}

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
                  {INSPECTION_TYPE_LABEL[type]}
                </p>
              </div>
            ))}
            {(byType.tribunal ?? 0) > 0 && (
              <div className="rounded-lg border border-border/60 bg-secondary/20 p-3">
                <JobTypeBadge type="tribunal" />
                <p className="mt-2 text-lg font-bold tabular-nums">
                  {formatCurrency(byType.tribunal ?? 0)}
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
              description="Complete inspections to see labour + fuel fees here."
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
                <PayBreakdown
                  compact
                  hours={e.hoursWorked}
                  laborAmount={e.laborAmount}
                  travelKmOneWay={e.travelKmOneWay}
                  fuelAllowance={e.fuelAllowance}
                  total={e.amount}
                />
                <p className="text-muted-foreground mt-2 text-xs">
                  {formatDateTime(e.completedAt)} · Accounting:{' '}
                  {e.accountingSynced ? 'Synced' : 'Pending'}
                </p>
              </div>
            ))
          )}
        </section>

        <p className="text-muted-foreground text-center text-[10px]">
          Rate: ${INSPECTOR_HOURLY_RATE_AUD}/hr · Fuel: ${FUEL_RATE_PER_KM_AUD}/km
          one-way
        </p>
      </div>
    </InspectorShell>
  );
}
