'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronRight, Mail, Phone, Star } from 'lucide-react';

import { InitialsAvatar } from '@/components/inspector/initials-avatar';
import type { InspectorOpenViewingVisitor } from '@/lib/inspector-open-viewing';
import {
  sortOpenInspectionVisitors,
  visitorAvatarTone,
  type OpenInspectionCheckInSort,
} from '@/lib/open-inspection-ui';
import { cn, formatDateTime, formatTime } from '@/lib/utils';

function sourceLabel(source: string): string {
  const value = source.trim().toLowerCase();
  if (value === 'walk_in') return 'Walk-in';
  if (value === 'qr' || value === 'check_in' || value === 'checkin') return 'Check-in QR';
  if (value === 'application' || value === 'apply') return 'Application form';
  if (!value) return 'Application form';
  return source.replace(/_/g, ' ');
}

function VisitorRow({
  visitor,
  showCheck,
  onView,
}: {
  visitor: InspectorOpenViewingVisitor;
  showCheck?: boolean;
  onView?: () => void;
}) {
  const row = (
    <>
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
      ) : !onView ? (
        <span className="bg-primary/15 text-primary flex size-6 shrink-0 items-center justify-center rounded-full">
          <Star className="size-3.5 fill-current" />
        </span>
      ) : null}
      {onView ? (
        <span className="text-primary inline-flex shrink-0 items-center gap-0.5 text-xs font-semibold">
          View
          <ChevronRight className="size-3.5" />
        </span>
      ) : null}
    </>
  );

  if (onView) {
    return (
      <li>
        <button
          type="button"
          className="flex w-full items-center gap-3 py-2.5 text-left"
          onClick={onView}
        >
          {row}
        </button>
      </li>
    );
  }

  return <li className="flex items-center gap-3 py-2.5">{row}</li>;
}

function Overlay({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="open-inspection-dialog-title"
    >
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black/70"
        onClick={onClose}
      />
      <div className="bg-card relative z-[1] flex max-h-[min(85vh,36rem)] w-full max-w-sm flex-col overflow-hidden rounded-2xl border border-border shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
          <div className="min-w-0">
            <p
              id="open-inspection-dialog-title"
              className="truncate text-sm font-semibold"
            >
              {title}
            </p>
            {subtitle ? (
              <p className="text-muted-foreground mt-0.5 text-xs">{subtitle}</p>
            ) : null}
          </div>
          <button
            type="button"
            className="text-muted-foreground shrink-0 pt-0.5 text-xs font-semibold"
            onClick={onClose}
          >
            Close
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">{children}</div>
      </div>
    </div>
  );
}

function VisitorDetail({
  visitor,
  kind,
}: {
  visitor: InspectorOpenViewingVisitor;
  kind: 'checkin' | 'interested';
}) {
  const phone = visitor.phone.trim();
  const email = visitor.email.trim();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <InitialsAvatar
          name={visitor.name}
          className={cn('size-12 text-sm', visitorAvatarTone(visitor.name))}
        />
        <div className="min-w-0">
          <p className="truncate text-base font-semibold">{visitor.name}</p>
          <p className="text-muted-foreground text-xs">
            {sourceLabel(visitor.registrationSource)}
          </p>
        </div>
      </div>

      <dl className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <dt className="text-muted-foreground text-xs">Phone</dt>
          {phone ? (
            <dd>
              <a
                href={`tel:${phone}`}
                className="text-primary inline-flex items-center gap-1 text-sm font-medium"
              >
                <Phone className="size-3.5" />
                {phone}
              </a>
            </dd>
          ) : (
            <dd className="text-sm">—</dd>
          )}
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-muted-foreground text-xs">Email</dt>
          {email ? (
            <dd className="min-w-0">
              <a
                href={`mailto:${email}`}
                className="text-primary inline-flex max-w-[14rem] items-center gap-1 truncate text-sm font-medium"
              >
                <Mail className="size-3.5 shrink-0" />
                <span className="truncate">{email}</span>
              </a>
            </dd>
          ) : (
            <dd className="text-sm">—</dd>
          )}
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-muted-foreground text-xs">
            {kind === 'checkin' ? 'Checked in' : 'Applied'}
          </dt>
          <dd className="text-sm">
            {visitor.createdAt ? formatDateTime(visitor.createdAt) : '—'}
          </dd>
        </div>
      </dl>
    </div>
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
  const [selected, setSelected] = useState<{
    visitor: InspectorOpenViewingVisitor;
    kind: 'checkin' | 'interested';
  } | null>(null);
  const sortedCheckIns = useMemo(
    () => sortOpenInspectionVisitors(checkIns, sort),
    [checkIns, sort],
  );
  const sortedInterested = useMemo(
    () => sortOpenInspectionVisitors(interested, 'time'),
    [interested],
  );

  const closeInterested = () => {
    setSelected(null);
    setShowInterested(false);
  };

  useEffect(() => {
    if (!showInterested && !selected) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (selected?.kind === 'interested') setSelected(null);
      else closeInterested();
    };
    document.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [selected, showInterested]);

  const dialog =
    typeof document === 'undefined'
      ? null
      : selected
        ? createPortal(
            <Overlay
              title={selected.visitor.name}
              subtitle={
                selected.kind === 'checkin'
                  ? 'Check-in details'
                  : 'Applicant details'
              }
              onClose={closeInterested}
            >
              <VisitorDetail
                visitor={selected.visitor}
                kind={selected.kind}
              />
              {selected.kind === 'interested' ? (
                <button
                  type="button"
                  className="text-muted-foreground mt-4 text-xs font-semibold"
                  onClick={() => setSelected(null)}
                >
                  Back to applicants
                </button>
              ) : null}
            </Overlay>,
            document.body,
          )
        : showInterested
          ? createPortal(
              <Overlay
                title="Interested applicants"
                subtitle="Already applied via the application form"
                onClose={closeInterested}
              >
                {sortedInterested.length === 0 ? (
                  <p className="text-muted-foreground py-8 text-center text-xs">
                    No one has applied via the application form yet. Share the
                    Application QR for prospects who want to apply.
                  </p>
                ) : (
                  <ul className="divide-y divide-border">
                    {sortedInterested.map((visitor) => (
                      <VisitorRow
                        key={visitor.id}
                        visitor={visitor}
                        onView={() =>
                          setSelected({ visitor, kind: 'interested' })
                        }
                      />
                    ))}
                  </ul>
                )}
              </Overlay>,
              document.body,
            )
          : null;

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
            <VisitorRow
              key={visitor.id}
              visitor={visitor}
              showCheck
              onView={() => setSelected({ visitor, kind: 'checkin' })}
            />
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
      {dialog}
    </div>
  );
}
