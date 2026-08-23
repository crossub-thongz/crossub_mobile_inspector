'use client';

import { useEffect, useMemo, useState } from 'react';
import { FileText, Loader2, Users } from 'lucide-react';

import { OpenInspectionHelpCard } from '@/components/open-inspection/open-inspection-help-card';
import { OpenInspectionLinkQrBlock } from '@/components/open-inspection/open-inspection-link-qr-block';
import { OpenInspectionVisitorList } from '@/components/open-inspection/open-inspection-visitor-list';
import {
  fetchOpenViewing,
  splitOpenInspectionVisitors,
  type InspectorOpenViewing,
} from '@/lib/inspector-open-viewing';
import { cn } from '@/lib/utils';

type Tab = 'checkins' | 'qr';

export function OpenInspectionReferenceTabs({
  inspectionId,
  viewing: viewingProp,
  loading: loadingProp,
  startPending = false,
  missingLabel = 'Check-in and QR records are not available for this job.',
  hideTabs = false,
  panel,
}: {
  inspectionId: string;
  viewing?: InspectorOpenViewing | null;
  loading?: boolean;
  /** Session exists but has not been started yet. */
  startPending?: boolean;
  missingLabel?: string;
  hideTabs?: boolean;
  panel?: Tab;
}) {
  const [innerTab, setInnerTab] = useState<Tab>('checkins');
  const [fetched, setFetched] = useState<InspectorOpenViewing | null>(null);
  const [fetching, setFetching] = useState(viewingProp === undefined);

  useEffect(() => {
    if (viewingProp !== undefined) return;
    let cancelled = false;
    setFetching(true);
    void fetchOpenViewing(inspectionId)
      .then((session) => {
        if (!cancelled) setFetched(session);
      })
      .catch(() => {
        if (!cancelled) setFetched(null);
      })
      .finally(() => {
        if (!cancelled) setFetching(false);
      });
    return () => {
      cancelled = true;
    };
  }, [inspectionId, viewingProp]);

  const viewing = viewingProp !== undefined ? viewingProp : fetched;
  const loading = viewingProp !== undefined ? Boolean(loadingProp) : fetching;
  const { checkIns, interested } = useMemo(
    () => splitOpenInspectionVisitors(viewing?.visitors ?? []),
    [viewing?.visitors],
  );
  const tab = panel ?? innerTab;

  return (
    <div className="space-y-3">
      {hideTabs ? null : (
      <div className="border-border flex border-b">
        {(
          [
            ['checkins', `Check-ins (${checkIns.length})`],
            ['qr', 'QR & Links'],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            className={cn(
              '-mb-px flex-1 px-3 py-2.5 text-sm font-semibold transition-colors',
              tab === value
                ? 'text-primary border-primary border-b-2'
                : 'text-muted-foreground border-b-2 border-transparent',
            )}
            onClick={() => setInnerTab(value)}
          >
            {label}
          </button>
        ))}
      </div>
      )}

      {loading ? (
        <div className="text-muted-foreground flex items-center justify-center gap-2 py-12 text-sm">
          <Loader2 className="size-4 animate-spin" />
          Loading viewing session…
        </div>
      ) : startPending ? (
        <p className="text-muted-foreground rounded-xl border border-dashed px-4 py-8 text-center text-sm">
          Start the open inspection to open check-in and application links for
          prospects.
        </p>
      ) : !viewing ? (
        <p className="text-muted-foreground rounded-xl border border-dashed px-4 py-8 text-center text-sm">
          {missingLabel}
        </p>
      ) : tab === 'checkins' ? (
        <OpenInspectionVisitorList
          checkIns={checkIns}
          interested={interested}
        />
      ) : (
        <div className="space-y-3">
          <div>
            <p className="text-sm font-semibold">Share with prospects</p>
            <p className="text-muted-foreground mt-0.5 text-xs">
              Prospects can scan or use the link below.
            </p>
          </div>
          <div className="border-border bg-card divide-y divide-border rounded-2xl border px-3 py-1">
            <OpenInspectionLinkQrBlock
              title="Check-in QR"
              description="Prospects scan to register their arrival at the open."
              url={viewing.checkInUrl}
              qrFilename={`check-in-${viewing.id.slice(0, 8)}.png`}
              icon={Users}
            />
            <OpenInspectionLinkQrBlock
              title="Application QR"
              description="Prospects scan to apply for this property."
              url={viewing.applyUrl}
              qrFilename={`apply-${viewing.id.slice(0, 8)}.png`}
              icon={FileText}
            />
          </div>
          <OpenInspectionHelpCard />
        </div>
      )}
    </div>
  );
}
