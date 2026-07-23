'use client';

import { useState } from 'react';
import { Check, Copy, ExternalLink } from 'lucide-react';
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
  const [copied, setCopied] = useState(false);
  const qrSrc = openInspectionQrImageUrl(url, 220);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Link copied');
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy link');
    }
  };

  return (
    <div className="space-y-3 rounded-xl border bg-background p-3">
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-muted-foreground mt-0.5 text-xs leading-relaxed">{description}</p>
      </div>
      <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start">
        <img
          src={qrSrc}
          alt=""
          className="size-36 rounded-lg border bg-white p-1"
          loading="lazy"
        />
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-muted-foreground break-all text-[11px]">{url}</p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="outline" className="h-8 gap-1.5 text-xs" onClick={() => void copyLink()}>
              {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
              {copied ? 'Copied' : 'Copy link'}
            </Button>
            <Button asChild size="sm" variant="outline" className="h-8 gap-1.5 text-xs">
              <a href={url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="size-3.5" />
                Open
              </a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
