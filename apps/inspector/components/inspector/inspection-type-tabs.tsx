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
