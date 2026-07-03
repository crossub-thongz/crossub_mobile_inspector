'use client';

import { Coffee, Radio } from 'lucide-react';

import { useInspectorData } from '@/components/providers/inspector-data-provider';
import { cn } from '@/lib/utils';

export function AvailabilityBubble() {
  const { receivingJobs, toggleReceivingJobs } = useInspectorData();

  return (
    <div
      className={cn(
        'pointer-events-none fixed left-1/2 z-[60] w-full max-w-lg -translate-x-1/2 px-4',
        'bottom-[calc(4.5rem+env(safe-area-inset-bottom))]',
      )}
    >
      <div className="pointer-events-auto ml-auto flex w-fit flex-col items-center gap-1">
        <button
          type="button"
          onClick={() => toggleReceivingJobs()}
          aria-label={
            receivingJobs
              ? 'Receiving jobs — tap for break'
              : 'On break — tap to receive jobs'
          }
          className={cn(
            'flex size-14 items-center justify-center rounded-full border-2 shadow-lg transition-transform active:scale-95',
            receivingJobs
              ? 'border-emerald-400/80 bg-emerald-500 text-white shadow-emerald-500/30'
              : 'border-red-400/80 bg-red-500 text-white shadow-red-500/30',
          )}
        >
          {receivingJobs ? (
            <Radio className="size-6" strokeWidth={2.5} />
          ) : (
            <Coffee className="size-6" strokeWidth={2.5} />
          )}
        </button>
        <span
          className={cn(
            'rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide shadow-sm',
            receivingJobs
              ? 'bg-emerald-500/15 text-emerald-400'
              : 'bg-red-500/15 text-red-400',
          )}
        >
          {receivingJobs ? 'Receiving' : 'On break'}
        </span>
      </div>
    </div>
  );
}
