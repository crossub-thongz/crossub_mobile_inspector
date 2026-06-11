'use client';

import Link from 'next/link';
import { MessageSquare } from 'lucide-react';

import { EmptyState } from '@/components/inspector/empty-state';
import { PageIntro } from '@/components/inspector/page-intro';
import { InspectorShell } from '@/components/layout/inspector-shell';
import { useInspectorData } from '@/components/providers/inspector-data-provider';
import { messageDetail } from '@/constants/routes';
import { formatRelative } from '@/lib/utils';

export default function MessagesPage() {
  const { messages } = useInspectorData();

  return (
    <InspectorShell title="Messages">
      <div className="space-y-4">
        <PageIntro description="Communicate with agents, leasing, inspection, and maintenance teams. All records archived automatically." />

        {messages.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title="No messages"
            description="Conversations with your teams appear here."
          />
        ) : (
          <div className="space-y-2">
            {messages.map((m) => (
              <Link
                key={m.id}
                href={messageDetail(m.id)}
                className="block rounded-xl border border-border/80 bg-card p-4 transition hover:border-primary/30"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold">{m.subject}</p>
                  {m.unread > 0 && (
                    <span className="bg-destructive flex size-5 items-center justify-center rounded-full text-[10px] text-white">
                      {m.unread}
                    </span>
                  )}
                </div>
                <p className="text-muted-foreground mt-1 line-clamp-2 text-xs">
                  {m.lastMessage}
                </p>
                <p className="text-muted-foreground mt-2 text-[10px]">
                  {formatRelative(m.lastAt)} · {m.category}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </InspectorShell>
  );
}
