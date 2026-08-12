'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Coffee, MessageSquare, Radio } from 'lucide-react';

import { useInspectorData } from '@/components/providers/inspector-data-provider';
import { ROUTES } from '@/constants/routes';
import { cn } from '@/lib/utils';

export function AvailabilityBubble() {
  const pathname = usePathname();
  const { receivingJobs, toggleReceivingJobs, messages } = useInspectorData();
  const unreadMessages = messages.reduce((sum, m) => sum + m.unread, 0);
  const onMessages = pathname === ROUTES.MESSAGES || pathname.startsWith(`${ROUTES.MESSAGES}/`);

  return (
    <div
      className={cn(
        // Sit under the bottom nav (z-60) so tab taps always win. Full-width
        // wrapper stays pointer-events-none; only the FABs capture taps.
        'pointer-events-none fixed left-1/2 z-40 w-full max-w-lg -translate-x-1/2 px-4',
        'bottom-[calc(4.5rem+env(safe-area-inset-bottom))]',
      )}
    >
      <div className="pointer-events-auto ml-auto flex w-fit flex-col items-center gap-2">
        {!onMessages ? (
          <div className="flex flex-col items-center gap-1">
            <Link
              href={`${ROUTES.MESSAGES}?compose=1`}
              aria-label={
                unreadMessages > 0
                  ? `Messages — ${unreadMessages} unread`
                  : 'Open messages'
              }
              className="relative flex size-12 items-center justify-center rounded-full border-2 border-primary/40 bg-primary text-primary-foreground shadow-lg shadow-primary/25 transition-transform active:scale-95"
            >
              <MessageSquare className="size-5" strokeWidth={2.5} />
              {unreadMessages > 0 ? (
                <span className="bg-destructive absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white">
                  {unreadMessages > 9 ? '9+' : unreadMessages}
                </span>
              ) : null}
            </Link>
            <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary shadow-sm">
              Messages
            </span>
          </div>
        ) : null}

        <div className="flex flex-col items-center gap-1">
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
    </div>
  );
}
