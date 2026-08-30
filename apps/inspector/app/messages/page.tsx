'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { MessageSquare, Paperclip, Plus, X } from 'lucide-react';
import { toast } from 'sonner';

import { EmptyState } from '@/components/inspector/empty-state';
import { InspectorShell } from '@/components/layout/inspector-shell';
import { useInspectorData } from '@/components/providers/inspector-data-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { messageDetail, ROUTES } from '@/constants/routes';
import { fileToBase64, formatRelative } from '@/lib/utils';
import { stripEmojis } from '@/lib/strip-emojis';

const MAX_ATTACHMENTS = 5;
const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;

type PendingAttachment = {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  contentBase64: string;
};

function MessagesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { messages, assignedJobs, createMessageThread } = useInspectorData();
  const [composing, setComposing] = useState(
    () => searchParams.get('compose') === '1',
  );
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [inspectionId, setInspectionId] = useState('');
  const [pendingFiles, setPendingFiles] = useState<PendingAttachment[]>([]);
  const [sending, setSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchParams.get('compose') === '1') {
      setComposing(true);
    }
  }, [searchParams]);

  const caseOptions = useMemo(
    () =>
      assignedJobs.map((job) => ({
        id: job.id,
        label: `${job.type} · ${job.propertyAddress}`,
      })),
    [assignedJobs],
  );

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

  async function handleCreate() {
    if (sending) return;
    const trimmedSubject = subject.trim();
    const trimmedBody = body.trim();
    if (!trimmedSubject) {
      toast.error('Add a subject');
      return;
    }
    if (!trimmedBody && pendingFiles.length === 0) {
      toast.error('Add a message or attachment');
      return;
    }
    setSending(true);
    try {
      const id = await createMessageThread({
        subject: trimmedSubject,
        body: trimmedBody || pendingFiles[0]?.fileName || 'Attachment',
        inspectionId: inspectionId || undefined,
        attachments: pendingFiles.length > 0 ? pendingFiles : undefined,
      });
      if (!id) return;
      setComposing(false);
      setSubject('');
      setBody('');
      setInspectionId('');
      setPendingFiles([]);
      router.replace(ROUTES.MESSAGES);
      router.push(messageDetail(id));
    } finally {
      setSending(false);
    }
  }

  return (
    <InspectorShell title="Messages">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-muted-foreground text-xs">
            Message the office — pick a case when it relates to a job.
          </p>
          <Button
            type="button"
            size="sm"
            variant={composing ? 'outline' : 'default'}
            onClick={() => setComposing((v) => !v)}
          >
            <Plus className="mr-1 size-3.5" />
            {composing ? 'Cancel' : 'New message'}
          </Button>
        </div>

        {composing ? (
          <div className="space-y-3 rounded-xl border border-border bg-card p-4">
            <div className="space-y-1">
              <label className="text-muted-foreground text-[11px] font-medium uppercase">
                Case
              </label>
              <select
                className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
                value={inspectionId}
                onChange={(e) => setInspectionId(e.target.value)}
              >
                <option value="">General (no case)</option>
                {caseOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <Input
              placeholder="Subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
            <textarea
              className="border-input bg-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[96px] w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1"
              placeholder="Write your message…"
              value={body}
              onChange={(e) => setBody(stripEmojis(e.target.value))}
              rows={4}
            />
            {pendingFiles.length > 0 ? (
              <ul className="flex flex-wrap gap-2">
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
            <div className="flex items-center gap-2">
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
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={pendingFiles.length >= MAX_ATTACHMENTS}
              >
                <Paperclip className="mr-1 size-3.5" />
                Attach
              </Button>
              <Button
                type="button"
                size="sm"
                className="ml-auto"
                disabled={sending}
                onClick={() => void handleCreate()}
              >
                Send
              </Button>
            </div>
          </div>
        ) : null}

        {messages.length === 0 && !composing ? (
          <EmptyState
            icon={MessageSquare}
            title="No messages"
            description="Tap New message to contact the office."
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
                  {m.inspectionTrackingNumber
                    ? ` · #${m.inspectionTrackingNumber}`
                    : ''}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </InspectorShell>
  );
}

export default function MessagesPage() {
  return (
    <Suspense
      fallback={
        <InspectorShell title="Messages">
          <p className="text-muted-foreground text-sm">Loading messages…</p>
        </InspectorShell>
      }
    >
      <MessagesPageContent />
    </Suspense>
  );
}
