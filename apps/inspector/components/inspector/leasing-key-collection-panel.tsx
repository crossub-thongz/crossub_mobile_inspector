'use client';

import { Camera, Check, ChevronDown, ClipboardList, X } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  hasKeyCollectionPhotos,
  hasTenantKeyReport,
  KEY_CUSTODY_LABEL,
} from '@/lib/leasing-key-collection';
import type {
  InspectorLeasingKeyContext,
  LeasingKeyCollectionTenantReport,
} from '@/lib/types';
import { cn, formatDateTime } from '@/lib/utils';

const REPORT_ROWS: {
  key: keyof Omit<LeasingKeyCollectionTenantReport, 'submittedAt' | 'tagNumber'>;
  label: string;
}[] = [
  { key: 'keysCount', label: 'Keys' },
  { key: 'entryDoorCount', label: 'Entry door' },
  { key: 'windowSlidingCount', label: 'Window / sliding' },
  { key: 'fobsCount', label: 'Fobs' },
  { key: 'remoteControlCount', label: 'Remote controls' },
  { key: 'mailboxCount', label: 'Mailbox' },
  { key: 'othersCount', label: 'Other' },
];

function AvailabilityMark({ available }: { available: boolean }) {
  return (
    <span
      className={cn(
        'flex size-5 shrink-0 items-center justify-center rounded-full border',
        available
          ? 'border-emerald-400/60 bg-emerald-500/15 text-emerald-400'
          : 'border-rose-400/40 bg-rose-500/10 text-rose-400',
      )}
      aria-hidden
    >
      {available ? <Check className="size-3" /> : <X className="size-3" />}
    </span>
  );
}

function reportValue(
  report: LeasingKeyCollectionTenantReport,
  key: (typeof REPORT_ROWS)[number]['key'],
): string {
  const value = report[key];
  return value == null ? '—' : String(value);
}

/** Leasing key-collection arrangement + tenant evidence (matches crossub_web leasing UI). */
export function LeasingKeyCollectionPanel({
  context,
}: {
  context: InspectorLeasingKeyContext;
}) {
  const { keyCollection, keyCustody, propertyAddress } = context;
  const photos = keyCollection.photos ?? [];
  const report = keyCollection.tenantReport;
  const photoReady = hasKeyCollectionPhotos(keyCollection);
  const checklistReady = hasTenantKeyReport(keyCollection);
  const reportReady = checklistReady || (photoReady && keyCollection.status === 'done');
  const [photosExpanded, setPhotosExpanded] = useState(false);
  const [reportExpanded, setReportExpanded] = useState(false);

  const hasTenantEvidence = photoReady || checklistReady || reportReady;

  return (
    <div className="space-y-3 rounded-lg border border-border/80 bg-secondary/10 p-3">
      <div className="space-y-0.5">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Pickup arrangement
        </p>
        <p className="text-[10px] text-muted-foreground">
          From this job&apos;s leasing case only — not your collect/return proof photos.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Time
          </p>
          <p className="mt-0.5 font-medium">
            {keyCollection.time ? formatDateTime(keyCollection.time) : 'TBD'}
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Location
          </p>
          <p className="mt-0.5 font-medium">
            {keyCollection.location?.trim() || propertyAddress || 'TBD'}
          </p>
        </div>
      </div>
      <p className="inline-flex rounded-full border border-border/60 bg-card px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
        {KEY_CUSTODY_LABEL[keyCustody]}
      </p>

      <div className="space-y-2 border-t border-border/50 pt-3">
        {!hasTenantEvidence ? (
          <p className="text-[11px] text-muted-foreground">
            No tenant key handover evidence on this case yet.
          </p>
        ) : null}
        <div className="rounded-lg border border-border/60 bg-card/50 px-3 py-2.5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-2.5">
              <AvailabilityMark available={photoReady} />
              <div className="min-w-0">
                <p className="text-xs font-medium">Tenant photo proof</p>
                <p className="text-[11px] text-muted-foreground">
                  {photoReady
                    ? photos.length === 1
                      ? '1 photo from tenant (this leasing case)'
                      : `${photos.length} photos from tenant (this leasing case)`
                    : 'No tenant photo on this case'}
                </p>
              </div>
            </div>
            {photoReady && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-7 shrink-0 gap-1 px-2 text-[11px]"
                onClick={() => setPhotosExpanded((v) => !v)}
              >
                <Camera className="size-3" />
                {photosExpanded ? 'Hide' : 'View'}
                <ChevronDown
                  className={cn('size-3 transition', photosExpanded && 'rotate-180')}
                />
              </Button>
            )}
          </div>
          {photosExpanded && photoReady && (
            <div className="mt-3 grid gap-2">
              {photos.map((url, index) => (
                <figure
                  key={`${url}-${index}`}
                  className="overflow-hidden rounded-lg border border-border"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={`Key collection photo ${index + 1}`}
                    className="aspect-[4/3] w-full object-cover"
                  />
                </figure>
              ))}
              <p className="text-[10px] text-muted-foreground">{propertyAddress}</p>
            </div>
          )}
        </div>

        <div className="rounded-lg border border-border/60 bg-card/50 px-3 py-2.5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-2.5">
              <AvailabilityMark available={reportReady} />
              <div className="min-w-0">
                <p className="text-xs font-medium">Tenant key collection report</p>
                <p className="text-[11px] text-muted-foreground">
                  {reportReady
                    ? checklistReady && report?.submittedAt
                      ? `Checklist ${formatDateTime(report.submittedAt)}`
                      : 'Tenant report on this leasing case'
                    : 'No tenant report on this case'}
                </p>
              </div>
            </div>
            {reportReady && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-7 shrink-0 gap-1 px-2 text-[11px]"
                onClick={() => setReportExpanded((v) => !v)}
              >
                <ClipboardList className="size-3" />
                {reportExpanded ? 'Hide' : 'View'}
                <ChevronDown
                  className={cn('size-3 transition', reportExpanded && 'rotate-180')}
                />
              </Button>
            )}
          </div>
          {reportExpanded && reportReady && (
            <div className="mt-3 space-y-3 text-sm">
              {checklistReady && report ? (
                <>
                  {report.submittedAt && (
                    <p className="text-xs text-muted-foreground">
                      Submitted {formatDateTime(report.submittedAt)}
                    </p>
                  )}
                  {report.tagNumber && (
                    <div className="rounded-lg border border-border/60 bg-secondary/20 px-3 py-2.5">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Tag number
                      </p>
                      <p className="mt-0.5 font-mono text-sm font-medium">
                        {report.tagNumber}
                      </p>
                    </div>
                  )}
                  <div className="overflow-hidden rounded-lg border border-border">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-border bg-secondary/30 text-[10px] uppercase tracking-wider text-muted-foreground">
                          <th className="px-3 py-2 font-semibold">Item</th>
                          <th className="px-3 py-2 text-right font-semibold">Qty</th>
                        </tr>
                      </thead>
                      <tbody>
                        {REPORT_ROWS.map(({ key, label }) => (
                          <tr
                            key={key}
                            className="border-b border-border/60 last:border-0"
                          >
                            <td className="px-3 py-2">{label}</td>
                            <td className="px-3 py-2 text-right tabular-nums">
                              {reportValue(report, key)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Photo proof submitted; detailed handover checklist not recorded yet.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
