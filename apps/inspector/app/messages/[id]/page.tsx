'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';

import { InspectorShell } from '@/components/layout/inspector-shell';
import { useInspectorData } from '@/components/providers/inspector-data-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ROUTES } from '@/constants/routes';
import { formatDateTime } from '@/lib/utils';

export default function MessageThreadPage() {
  const { id } = useParams<{ id: string }>();
  const { messages, getThreadMessages, sendMessage } = useInspectorData();
  const thread = messages.find((m) => m.id === id);
  const threadMessages = getThreadMessages(id);
  const [draft, setDraft] = useState('');

  if (!thread) {
    return (
      <InspectorShell title="Not found" backHref={ROUTES.MESSAGES}>
        <p className="text-muted-foreground text-sm">Thread not found.</p>
      </InspectorShell>
    );
  }

  const handleSend = () => {
    if (!draft.trim()) return;
    sendMessage(id, draft.trim());
    setDraft('');
  };

  return (
    <InspectorShell title={thread.subject} backHref={ROUTES.MESSAGES}>
      <div className="flex flex-col gap-4">
        <div className="space-y-3">
          {threadMessages.map((msg) => (
            <div
              key={msg.id}
              className={`rounded-xl border p-3 text-sm ${
                msg.from === 'Alex Chen'
                  ? 'border-primary/30 bg-primary/5 ml-4'
                  : 'border-border bg-card mr-4'
              }`}
            >
              <p className="text-muted-foreground mb-1 text-[10px] font-medium">
                {msg.from} · {formatDateTime(msg.at)}
              </p>
              <p>{msg.body}</p>
              {msg.attachments?.map((a) => (
                <a
                  key={a.name}
                  href={a.url}
                  className="text-primary mt-2 block text-xs underline"
                >
                  {a.name}
                </a>
              ))}
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <Input
            placeholder="Type a message..."
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <Button onClick={handleSend}>Send</Button>
        </div>
      </div>
    </InspectorShell>
  );
}
