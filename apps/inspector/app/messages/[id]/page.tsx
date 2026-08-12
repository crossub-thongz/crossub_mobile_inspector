'use client';

import { useParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Paperclip, X } from 'lucide-react';
import { toast } from 'sonner';

import { InspectorShell } from '@/components/layout/inspector-shell';
import { useInspectorData } from '@/components/providers/inspector-data-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ROUTES } from '@/constants/routes';
import { fileToBase64, formatDateTime } from '@/lib/utils';

const MAX_ATTACHMENTS = 5;
const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;

type PendingAttachment = {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  contentBase64: string;
};

function cleanDisplayName(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    const mid = Math.floor(parts.length / 2);
    const left = parts.slice(0, mid).join(' ');
    const right = parts.slice(mid).join(' ');
    if (left.toLowerCase() === right.toLowerCase()) return left;
  }
  return name.trim();
}

export default function MessageThreadPage() {
  const { id } = useParams<{ id: string }>();
  const { messages, getThreadMessages, sendMessage } = useInspectorData();
  const thread = messages.find((m) => m.id === id);
  const threadMessages = getThreadMessages(id);
  const [draft, setDraft] = useState('');
  const [pendingFiles, setPendingFiles] = useState<PendingAttachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [threadMessages.length, pendingFiles.length]);

  if (!thread) {
    return (
      <InspectorShell title="Not found" backHref={ROUTES.MESSAGES}>
        <p className="text-muted-foreground text-sm">Thread not found.</p>
      </InspectorShell>
    );
  }

  async function handlePickFiles(fileList: FileList | null) {
    if (!fileList?.length) return;
    try {
      const next = [...pendingFiles];
      for (const file of Array.from(fileList)) {
        if (next.length >= MAX_ATTACHMENTS) {
          toast.error(`At most ${MAX_ATTACHMENTS} files per message`);
          break;
        }
        if (file.size > MAX_ATTACHMENT_BYTES) {
          toast.error(`${file.name} exceeds 10 MB`);
          continue;
        }
        next.push({
          fileName: file.name,
          mimeType: file.type || 'application/octet-stream',
          sizeBytes: file.size,
          contentBase64: await fileToBase64(file),
        });
      }
      setPendingFiles(next);
    } catch {
      toast.error("Couldn't attach file");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  const handleSend = () => {
    if (!draft.trim() && pendingFiles.length === 0) return;
    sendMessage(
      id,
      draft.trim(),
      pendingFiles.length > 0 ? pendingFiles : undefined,
    );
    setDraft('');
    setPendingFiles([]);
  };

  return (
    <InspectorShell title={thread.subject} backHref={ROUTES.MESSAGES}>
      <div className="flex min-h-0 flex-1 flex-col">
        {(thread.propertyAddress || thread.inspectionTrackingNumber) && (
          <p className="text-muted-foreground shrink-0 pb-2 text-xs">
            {[thread.propertyAddress, thread.inspectionTrackingNumber]
              .filter(Boolean)
              .join(' · ')}
          </p>
        )}

        <div
          ref={scrollerRef}
          className="min-h-0 flex-1 space-y-3 overflow-y-auto pb-3"
        >
          {threadMessages.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center text-sm">
              No messages yet — say hello below.
            </p>
          ) : (
            threadMessages.map((msg) => {
              const isSelf = msg.fromSelf ?? msg.from === 'Alex Chen';
              return (
                <div
                  key={msg.id}
                  className={`rounded-xl border p-3 text-sm ${
                    isSelf
                      ? 'border-primary/30 bg-primary/5 ml-4'
                      : 'border-border bg-card mr-4'
                  }`}
                >
                  <p className="text-muted-foreground mb-1 text-[10px] font-medium">
                    {cleanDisplayName(msg.from)} · {formatDateTime(msg.at)}
                  </p>
                  <p>{msg.body}</p>
                  {msg.attachments?.map((a) => (
                    <a
                      key={`${a.url}-${a.name}`}
                      href={a.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary mt-2 block text-xs underline"
                    >
                      {a.name}
                    </a>
                  ))}
                </div>
              );
            })
          )}
        </div>

        <div className="shrink-0 border-t border-border bg-background pt-3 pb-[env(safe-area-inset-bottom,0px)]">
          {pendingFiles.length > 0 ? (
            <ul className="mb-2 flex flex-wrap gap-2">
              {pendingFiles.map((file, index) => (
                <li
                  key={`${file.fileName}-${index}`}
                  className="bg-muted/50 inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px]"
                >
                  <Paperclip className="size-3" />
                  <span className="max-w-[140px] truncate">{file.fileName}</span>
                  <button
                    type="button"
                    onClick={() =>
                      setPendingFiles((prev) => prev.filter((_, i) => i !== index))
                    }
                    aria-label={`Remove ${file.fileName}`}
                  >
                    <X className="size-3" />
                  </button>
                </li>
              ))}
            </ul>
          ) : null}

          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              multiple
              accept="image/*,video/*,.pdf,.doc,.docx,.txt,.csv"
              onChange={(e) => void handlePickFiles(e.target.files)}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={pendingFiles.length >= MAX_ATTACHMENTS}
              aria-label="Attach file"
            >
              <Paperclip className="size-4" />
            </Button>
            <Input
              placeholder="Type a message..."
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <Button onClick={handleSend}>Send</Button>
          </div>
        </div>
      </div>
    </InspectorShell>
  );
}
