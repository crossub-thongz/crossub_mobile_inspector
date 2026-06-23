'use client';

import { useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

import { useInspectorData } from '@/components/providers/inspector-data-provider';
import { jobDetail } from '@/constants/routes';
import { formatTime } from '@/lib/utils';

const REMINDER_WINDOW_MS = 2 * 60 * 60 * 1000;

export function JobReminders() {
  const { todaysJobs } = useInspectorData();
  const shownRef = useRef<Set<string>>(new Set());

  const upcoming = todaysJobs.filter((j) => {
    if (j.status === 'completed' || j.status === 'declined') return false;
    const diff = new Date(j.scheduledTime).getTime() - Date.now();
    return diff > 0 && diff <= REMINDER_WINDOW_MS;
  });

  useEffect(() => {
    for (const job of upcoming) {
      if (shownRef.current.has(job.id)) continue;
      shownRef.current.add(job.id);
      toast.info(`Upcoming: ${job.type} inspection`, {
        description: `${formatTime(job.scheduledTime)} — ${job.propertyAddress}`,
        action: {
          label: 'Open',
          onClick: () => {
            window.location.href = jobDetail(job.id);
          },
        },
      });
    }
  }, [upcoming]);

  if (upcoming.length === 0) return null;

  return (
    <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2">
      <div className="mb-1.5 flex items-center gap-2 text-xs font-semibold text-amber-400">
        <Bell className="size-3.5" />
        {upcoming.length} reminder{upcoming.length === 1 ? '' : 's'} today
      </div>
      <ul className="space-y-1">
        {upcoming.map((job) => (
          <li key={job.id}>
            <Link
              href={jobDetail(job.id)}
              className="text-muted-foreground hover:text-foreground block truncate text-[11px]"
            >
              {formatTime(job.scheduledTime)} · {job.propertyAddress}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
