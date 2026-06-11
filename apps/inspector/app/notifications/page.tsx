'use client';

import Link from 'next/link';
import { Bell } from 'lucide-react';

import { EmptyState } from '@/components/inspector/empty-state';
import { PageIntro } from '@/components/inspector/page-intro';
import { InspectorShell } from '@/components/layout/inspector-shell';
import { useInspectorData } from '@/components/providers/inspector-data-provider';
import { formatRelative } from '@/lib/utils';

export default function NotificationsPage() {
  const { notifications, markNotificationRead } = useInspectorData();

  return (
    <InspectorShell title="Notifications">
      <div className="space-y-4">
        <PageIntro description="Real-time alerts for job assignments, tribunal hearings, and sync status." />

        {notifications.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="No notifications"
            description="You're all caught up."
          />
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => (
              <Link
                key={n.id}
                href={n.href}
                onClick={() => markNotificationRead(n.id)}
                className={`block rounded-xl border p-4 transition ${
                  n.read
                    ? 'border-border/60 bg-secondary/10 opacity-70'
                    : 'border-primary/30 bg-primary/5'
                }`}
              >
                <p className="text-sm font-semibold">{n.title}</p>
                <p className="text-muted-foreground mt-1 text-xs">{n.body}</p>
                <p className="text-muted-foreground mt-2 text-[10px]">
                  {formatRelative(n.createdAt)}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </InspectorShell>
  );
}
