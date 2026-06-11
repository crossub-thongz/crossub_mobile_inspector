'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

import { cn, formatCurrency } from '@/lib/utils';

export function KpiTile({
  label,
  value,
  href,
  highlight,
  isCurrency,
}: {
  label: string;
  value: number | string;
  href: string;
  highlight?: boolean;
  isCurrency?: boolean;
}) {
  const display =
    typeof value === 'number' && isCurrency
      ? formatCurrency(value)
      : value;

  return (
    <Link
      href={href}
      className={cn(
        'group flex min-h-[76px] flex-col justify-between rounded-xl border p-3 transition-all active:scale-[0.98]',
        highlight
          ? 'border-primary/40 bg-primary/5 hover:border-primary/60'
          : 'border-border/80 bg-secondary/30 hover:border-primary/25 hover:bg-card',
      )}
    >
      <p className="text-muted-foreground text-[10px] leading-tight font-medium">
        {label}
      </p>
      <div className="mt-1 flex items-end justify-between gap-1">
        <p
          className={cn(
            'text-xl font-bold tabular-nums tracking-tight',
            highlight && 'text-primary',
          )}
        >
          {display}
        </p>
        <ChevronRight className="text-muted-foreground size-3.5 shrink-0 opacity-0 transition group-hover:opacity-100 group-hover:text-primary" />
      </div>
    </Link>
  );
}
