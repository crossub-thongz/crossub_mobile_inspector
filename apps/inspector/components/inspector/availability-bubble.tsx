'use client';

import { Coffee, Radio } from 'lucide-react';

import { useInspectorData } from '@/components/providers/inspector-data-provider';
import { cn } from '@/lib/utils';

/** Compact receiving/break control for the inspector header. */
export function HeaderReceivingToggle() {
  const { receivingJobs, toggleReceivingJobs } = useInspectorData();

  return (
    <button
      type="button"
      onClick={() => toggleReceivingJobs()}
      aria-label={
        receivingJobs
          ? 'Receiving jobs — tap for break'
          : 'On break — tap to receive jobs'
      }
      className={cn(
        'inline-flex h-8 max-w-[6.25rem] items-center gap-1 rounded-full border px-2 text-[10px] font-semibold uppercase tracking-wide transition-colors active:scale-[0.98]',
        receivingJobs
          ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
          : 'border-red-500/50 bg-red-500/15 text-red-700 dark:text-red-300',
      )}
    >
      {receivingJobs ? (
        <Radio className="size-3.5 shrink-0" strokeWidth={2.5} />
      ) : (
        <Coffee className="size-3.5 shrink-0" strokeWidth={2.5} />
      )}
      <span className="truncate">{receivingJobs ? 'Receiving' : 'Break'}</span>
    </button>
  );
}
