'use client';

import { useState } from 'react';
import { ChevronRight, HelpCircle } from 'lucide-react';

export function OpenInspectionHelpCard() {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-border bg-card overflow-hidden rounded-2xl border">
      <button
        type="button"
        className="flex w-full items-center gap-3 px-3 py-3 text-left"
        onClick={() => setOpen((value) => !value)}
      >
        <span className="bg-secondary text-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-full">
          <HelpCircle className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">Need help?</p>
          <p className="text-muted-foreground text-[11px] leading-snug">
            Learn how open inspections work and best practices
          </p>
        </div>
        <span className="text-primary inline-flex items-center gap-0.5 text-xs font-semibold">
          View guide
          <ChevronRight className="size-3.5" />
        </span>
      </button>
      {open ? (
        <div className="text-muted-foreground space-y-2 border-t border-border px-3 py-3 text-xs leading-relaxed">
          <p>
            <span className="text-foreground font-medium">Check-in QR</span> —
            prospects scan this at the door so they appear under Check-ins.
          </p>
          <p>
            <span className="text-foreground font-medium">Application QR</span> —
            prospects who already want the property scan this to apply. They show
            as Interested (already applied via the application form).
          </p>
          <p>
            Finish early anytime, or the job completes automatically when the
            viewing window ends.
          </p>
        </div>
      ) : null}
    </div>
  );
}
