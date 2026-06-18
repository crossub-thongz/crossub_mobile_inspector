'use client';

import {
  INSPECTION_TYPE_DESCRIPTION,
  INSPECTION_TYPE_LABEL,
  type CoreInspectionType,
  CORE_INSPECTION_TYPES,
} from '@/constants/inspection';
import { cn } from '@/lib/utils';

export function InspectionTypeTabs({
  active,
  onChange,
  counts,
}: {
  active: CoreInspectionType;
  onChange: (type: CoreInspectionType) => void;
  counts?: Partial<Record<CoreInspectionType, number>>;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {CORE_INSPECTION_TYPES.map((type) => {
        const count = counts?.[type] ?? 0;
        const selected = active === type;
        return (
          <button
            key={type}
            type="button"
            onClick={() => onChange(type)}
            className={cn(
              'flex flex-col items-start rounded-xl border px-3 py-2.5 text-left transition',
              selected
                ? 'border-primary bg-primary/10'
                : 'border-border/80 bg-secondary/20 hover:border-primary/30',
            )}
          >
            <span
              className={cn(
                'text-[11px] font-bold tracking-wide',
                selected ? 'text-primary' : 'text-foreground',
              )}
            >
              {INSPECTION_TYPE_LABEL[type]}
            </span>
            {count > 0 && (
              <span className="text-muted-foreground mt-0.5 text-[10px] tabular-nums">
                {count} job{count === 1 ? '' : 's'}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function InspectionTypeIntro({ type }: { type: CoreInspectionType }) {
  return (
    <p className="text-muted-foreground text-xs leading-relaxed">
      {INSPECTION_TYPE_DESCRIPTION[type]}
    </p>
  );
}

export type JobPoolFilter = 'all' | CoreInspectionType;

/** Horizontal filter tags for the job pool — ALL + OPEN / INGOING / OUTGOING / ROUTINE */
export function JobPoolTypeTags({
  active,
  onChange,
  counts,
}: {
  active: JobPoolFilter;
  onChange: (filter: JobPoolFilter) => void;
  counts: Record<CoreInspectionType, number>;
}) {
  const allCount = CORE_INSPECTION_TYPES.reduce(
    (sum, type) => sum + (counts[type] ?? 0),
    0,
  );

  const tags: { id: JobPoolFilter; label: string; count: number }[] = [
    { id: 'all', label: 'ALL', count: allCount },
    ...CORE_INSPECTION_TYPES.map((type) => ({
      id: type,
      label: INSPECTION_TYPE_LABEL[type],
      count: counts[type] ?? 0,
    })),
  ];

  return (
    <div className="flex gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {tags.map(({ id, label, count }) => {
        const selected = active === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={cn(
              'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-bold tracking-wide transition',
              selected
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border/80 bg-secondary/40 text-foreground hover:border-primary/40',
            )}
          >
            {label}
            <span
              className={cn(
                'rounded-full px-1.5 py-0.5 text-[9px] font-semibold tabular-nums',
                selected
                  ? 'bg-primary-foreground/20 text-primary-foreground'
                  : 'bg-background/60 text-muted-foreground',
              )}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
