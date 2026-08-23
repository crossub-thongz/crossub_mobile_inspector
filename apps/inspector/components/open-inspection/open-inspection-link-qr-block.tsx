'use client';

import { useState } from 'react';
import { Maximize2, Share2, X } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { openInspectionQrImageUrl } from '@/lib/open-inspection-qr';

export function OpenInspectionLinkQrBlock({
  title,
  description,
  url,
  qrFilename,
}: {
  title: string;
  description: string;
  url: string;
  qrFilename: string;
}) {
  const [enlarged, setEnlarged] = useState(false);
  const qrSrc = openInspectionQrImageUrl(url, 220);
  const largeQrSrc = openInspectionQrImageUrl(url, 420);

  const shareLink = async () => {
    try {
      if (typeof navigator.share === 'function') {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast.success('Link copied');
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      try {
        await navigator.clipboard.writeText(url);
        toast.success('Link copied');
      } catch {
        toast.error('Could not share link');
      }
    }
  };

  return (
    <>
      <div className="border-border bg-card flex items-center gap-3 rounded-2xl border p-3">
        <img
          src={qrSrc}
          alt=""
          className="size-[4.5rem] shrink-0 rounded-md border bg-white p-1"
          loading="lazy"
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">{title}</p>
          <p className="text-muted-foreground mt-0.5 text-[11px] leading-snug">
            {description}
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-1.5">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-8 gap-1.5 text-[11px]"
            onClick={() => void shareLink()}
          >
            <Share2 className="size-3.5" />
            Share link
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-8 gap-1.5 text-[11px]"
            onClick={() => setEnlarged(true)}
          >
            <Maximize2 className="size-3.5" />
            Enlarge
          </Button>
        </div>
      </div>

      {enlarged ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-6">
          <button
            type="button"
            aria-label="Close QR"
            className="absolute inset-0 bg-black/70"
            onClick={() => setEnlarged(false)}
          />
          <div className="bg-background relative w-full max-w-sm rounded-2xl border border-border p-4 shadow-2xl">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">{title}</p>
                <p className="text-muted-foreground mt-0.5 text-xs">{description}</p>
              </div>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="size-8"
                onClick={() => setEnlarged(false)}
              >
                <X className="size-4" />
              </Button>
            </div>
            <img
              src={largeQrSrc}
              alt={title}
              className="mx-auto size-64 rounded-xl border bg-white p-2"
            />
            <p className="text-muted-foreground mt-3 break-all text-center text-[10px]">
              {qrFilename}
            </p>
            <Button
              type="button"
              className="mt-3 w-full gap-1.5"
              onClick={() => void shareLink()}
            >
              <Share2 className="size-3.5" />
              Share link
            </Button>
          </div>
        </div>
      ) : null}
    </>
  );
}
