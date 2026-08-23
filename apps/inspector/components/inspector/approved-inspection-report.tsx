'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Download, Eye, FileText, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { downloadInspectorReportPdf } from '@/lib/crossub-api/inspector-client';
import type { InspectionJob } from '@/lib/types';
import { formatDateTime } from '@/lib/utils';

const FIELD_REPORT_TYPES = new Set(['ingoing', 'outgoing', 'routine']);

function reportFilename(job: InspectionJob): string {
  const kind =
    job.type === 'ingoing'
      ? 'Entry'
      : job.type === 'outgoing'
        ? 'Exit'
        : 'Routine';
  return `${kind} report — ${job.propertyAddress}.pdf`;
}

function Overlay({
  title,
  filename,
  canDownload,
  onClose,
  onDownload,
  children,
}: {
  title: string;
  filename: string;
  canDownload: boolean;
  onClose: () => void;
  onDownload: () => void;
  children: ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-[120] flex flex-col bg-background"
      role="dialog"
      aria-modal="true"
      aria-labelledby="approved-report-title"
    >
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="min-w-0">
          <p id="approved-report-title" className="truncate text-sm font-semibold">
            {title}
          </p>
          <p className="text-muted-foreground truncate text-xs">{filename}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-8 gap-1.5"
            disabled={!canDownload}
            onClick={onDownload}
          >
            <Download className="size-3.5" />
            Download
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="size-8"
            onClick={onClose}
          >
            <X className="size-4" />
            <span className="sr-only">Close</span>
          </Button>
        </div>
      </header>
      <div className="relative min-h-0 flex-1 bg-muted/30">{children}</div>
    </div>
  );
}

export function ApprovedInspectionReportCard({ job }: { job: InspectionJob }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const filename = reportFilename(job);

  useEffect(() => {
    if (!open) {
      setPreviewUrl((current) => {
        if (current) URL.revokeObjectURL(current);
        return null;
      });
      return;
    }

    let cancelled = false;
    setLoading(true);
    void downloadInspectorReportPdf(job.id)
      .then((blob) => {
        if (cancelled) return;
        setPreviewUrl((current) => {
          if (current) URL.revokeObjectURL(current);
          return URL.createObjectURL(blob);
        });
      })
      .catch((err) => {
        if (cancelled) return;
        toast.error(
          err instanceof Error ? err.message : 'Inspection report is not available yet.',
        );
        setOpen(false);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [job.id, open]);

  const handleDownload = () => {
    if (!previewUrl) return;
    const anchor = document.createElement('a');
    anchor.href = previewUrl;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  };

  const overlay =
    typeof document === 'undefined' || !open
      ? null
      : createPortal(
          <Overlay
            title="Inspection report"
            filename={filename}
            canDownload={Boolean(previewUrl)}
            onClose={() => setOpen(false)}
            onDownload={handleDownload}
          >
            {loading ? (
              <div className="text-muted-foreground flex h-full items-center justify-center gap-2 text-sm">
                <Loader2 className="size-4 animate-spin" />
                Loading report…
              </div>
            ) : previewUrl ? (
              <iframe
                title="Inspection report"
                src={previewUrl}
                className="absolute inset-0 size-full border-0 bg-background"
              />
            ) : (
              <p className="text-muted-foreground flex h-full items-center justify-center px-6 text-center text-sm">
                Report PDF is not available yet.
              </p>
            )}
          </Overlay>,
          document.body,
        );

  return (
    <>
      <Card>
        <CardContent className="space-y-3 p-4">
          <div className="flex items-start gap-3">
            <span className="bg-primary/15 text-primary flex size-10 shrink-0 items-center justify-center rounded-full">
              <FileText className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">Inspection report</p>
              <p className="text-muted-foreground mt-0.5 text-xs leading-relaxed">
                {job.approvedAt
                  ? `Approved ${formatDateTime(job.approvedAt)} — same PDF as the admin site.`
                  : 'The submitted report as filed for CROSSUB review.'}
              </p>
            </div>
          </div>
          <Button
            type="button"
            className="w-full gap-2"
            onClick={() => setOpen(true)}
          >
            <Eye className="size-4" />
            View report
          </Button>
        </CardContent>
      </Card>
      {overlay}
    </>
  );
}

export function showsApprovedInspectionReport(job: InspectionJob): boolean {
  return FIELD_REPORT_TYPES.has(job.type);
}
