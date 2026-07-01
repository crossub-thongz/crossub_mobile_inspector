'use client';

import Link from 'next/link';

import { cn } from '@/lib/utils';

export function DashboardHubCard({
  href,
  title,
  tall,
  children,
}: {
  href: string;
  title: React.ReactNode;
  tall?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'flex flex-col rounded-2xl border border-border bg-card p-3.5 transition active:scale-[0.98] hover:border-primary/30',
        tall ? 'min-h-[11.5rem] flex-1' : 'min-h-[5.25rem]',
      )}
    >
      <p className="text-sm font-medium text-foreground">{title}</p>

      {children ? (
        <div className="mt-2 flex flex-1 flex-col">{children}</div>
      ) : null}
    </Link>
  );
}

export function DashboardOverviewChart({
  today,
  pool,
  completedWeek,
}: {
  today: number;
  pool: number;
  completedWeek: number;
}) {
  const bars = [
    { label: 'Today', value: today },
    { label: 'Pool', value: pool },
    { label: 'Week', value: completedWeek },
  ];
  const max = Math.max(...bars.map((b) => b.value), 1);

  return (
    <div className="flex flex-1 items-end justify-center gap-5 pb-1 pt-4">
      {bars.map((bar) => {
        const height = Math.max(12, Math.round((bar.value / max) * 72));
        return (
          <div key={bar.label} className="flex flex-col items-center gap-1.5">
            <span className="text-foreground text-[10px] font-semibold tabular-nums">
              {bar.value}
            </span>
            <div
              className="bg-primary/40 w-7 rounded-t-md"
              style={{ height }}
            />
            <span className="text-muted-foreground text-[9px]">{bar.label}</span>
          </div>
        );
      })}
    </div>
  );
}
