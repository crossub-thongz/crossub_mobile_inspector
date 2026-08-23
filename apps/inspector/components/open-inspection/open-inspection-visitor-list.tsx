'use client';

import { useMemo, useState } from 'react';
import { Check, ChevronRight, Star } from 'lucide-react';

import { InitialsAvatar } from '@/components/inspector/initials-avatar';
import type { InspectorOpenViewingVisitor } from '@/lib/inspector-open-viewing';
import {
  sortOpenInspectionVisitors,
  visitorAvatarTone,
  type OpenInspectionCheckInSort,
} from '@/lib/open-inspection-ui';
import { cn, formatTime } from '@/lib/utils';

function VisitorRow({
  visitor,
  showCheck,
}: {
  visitor: InspectorOpenViewingVisitor;
  showCheck?: boolean;
}) {
  return (
    <li className="flex items-center gap-3 py-2.5">
      <InitialsAvatar
        name={visitor.name}
        className={cn('size-10 text-xs', visitorAvatarTone(visitor.name))}
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{visitor.name}</p>
        <p className="text-muted-foreground truncate text-xs">
          {visitor.phone || visitor.email || 'No contact'}
        </p>
      </div>
      {visitor.createdAt ? (
        <p className="text-muted-foreground shrink-0 text-xs tabular-nums">
          {formatTime(visitor.createdAt)}
        </p>
      ) : null}
      {showCheck ? (
        <span className="bg-primary/15 text-primary flex size-6 shrink-0 items-center justify-center rounded-full">
          <Check className="size-3.5" strokeWidth={3} />
        </span>
      ) : (
        <span className="bg-primary/15 text-primary flex size-6 shrink-0 items-center justify-center rounded-full">
          <Star className="size-3.5 fill-current" />
        </span>
      )}
    </li>
  );
}

export function OpenInspectionVisitorList({
  checkIns,
  interested,
}: {
  checkIns: InspectorOpenViewingVisitor[];
  interested: InspectorOpenViewingVisitor[];
}) {
  const [sort, setSort] = useState<OpenInspectionCheckInSort>('time');
  const [showInterested, setShowInterested] = useState(false);
  const sortedCheckIns = useMemo(
    () => sortOpenInspectionVisitors(checkIns, sort),
    [checkIns, sort],
  );
  const sortedInterested = useMemo(
    () => sortOpenInspectionVisitors(interested, 'time'),
    [interested],
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold">Checked in</p>
        <label className="text-muted-foreground flex items-center gap-1.5 text-[11px]">
          Sort by
          <select
            value={sort}
            onChange={(event) =>
              setSort(event.target.value as OpenInspectionCheckInSort)
            }
            className="border-border bg-card h-7 rounded-full border px-2 text-[11px] font-semibold text-foreground"
            aria-label="Sort check-ins"
          >
            <option value="time">Time</option>
            <option value="name">Name</option>
          </select>
        </label>
      </div>

      {sortedCheckIns.length === 0 ? (
        <p className="text-muted-foreground rounded-xl border border-dashed px-3 py-8 text-center text-xs">
          No check-ins yet. Prospects who scan the check-in QR will appear here.
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {sortedCheckIns.map((visitor) => (
            <VisitorRow key={visitor.id} visitor={visitor} showCheck />
          ))}
        </ul>
      )}

      <button
        type="button"
        className="flex w-full items-center gap-3 rounded-xl border border-border bg-card px-3 py-3 text-left"
        onClick={() => setShowInterested(true)}
      >
        <span className="bg-primary/15 text-primary flex size-9 shrink-0 items-center justify-center rounded-full">
          <Star className="size-4 fill-current" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">
            {interested.length} interested
          </p>
          <p className="text-muted-foreground text-[11px]">
            Already applied via application form
          </p>
        </div>
        <span className="text-primary inline-flex items-center gap-0.5 text-xs font-semibold">
          View
          <ChevronRight className="size-3.5" />
        </span>
      </button>

      {showInterested ? (
        <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-4">
          <button
            type="button"
            aria-label="Close interested applicants"
            className="absolute inset-0 bg-black/60"
            onClick={() => setShowInterested(false)}
          />
          <div className="bg-background relative flex max-h-[85vh] w-full max-w-lg flex-col rounded-t-2xl border border-border sm:rounded-2xl">
            <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
              <div>
                <p className="text-sm font-semibold">Interested applicants</p>
                <p className="text-muted-foreground mt-0.5 text-xs">
                  Already applied via the application form
                </p>
              </div>
              <button
                type="button"
                className="text-muted-foreground text-xs font-semibold"
                onClick={() => setShowInterested(false)}
              >
                Close
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-2">
              {sortedInterested.length === 0 ? (
                <p className="text-muted-foreground py-10 text-center text-xs">
                  No one has applied via the application form yet. Share the
                  Application QR for prospects who want to apply.
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {sortedInterested.map((visitor) => (
                    <VisitorRow key={visitor.id} visitor={visitor} />
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
