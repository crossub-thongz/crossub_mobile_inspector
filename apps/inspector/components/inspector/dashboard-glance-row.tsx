'use client';

import Link from 'next/link';
import { AlertCircle, Calendar } from 'lucide-react';

import { ROUTES } from '@/constants/routes';
import { cn } from '@/lib/utils';

export function DashboardGlanceRow({
  today,
  upcoming,
  overdue,
}: {
  today: number;
  upcoming: number;
  overdue: number;
}) {
  const cards = [
    {
      href: ROUTES.INSPECTIONS,
      value: today,
      label: 'Today Inspections',
      icon: Calendar,
      valueClass: 'text-primary',
      iconClass: 'text-primary',
    },
    {
      href: `${ROUTES.INSPECTIONS}?tab=upcoming`,
      value: upcoming,
      label: 'Upcoming Inspections',
      icon: Calendar,
      valueClass: 'text-blue-400',
      iconClass: 'text-blue-400',
    },
    {
      href: `${ROUTES.INSPECTIONS}?tab=overdue`,
      value: overdue,
      label: 'Overdue Inspections',
      icon: AlertCircle,
      valueClass: 'text-red-400',
      iconClass: 'text-red-400',
    },
  ] as const;

  return (
    <div className="grid grid-cols-3 gap-2">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Link
            key={card.label}
            href={card.href}
            className="relative rounded-2xl border border-border bg-card px-3 py-3 transition active:scale-[0.98]"
          >
            <Icon className={cn('absolute top-2.5 right-2.5 size-4', card.iconClass)} />
            <p
              className={cn(
                'text-[1.75rem] font-bold leading-none tabular-nums',
                card.valueClass,
              )}
            >
              {card.value}
            </p>
            <p className="text-muted-foreground mt-2 text-[11px] leading-snug">
              {card.label}
            </p>
          </Link>
        );
      })}
    </div>
  );
}
