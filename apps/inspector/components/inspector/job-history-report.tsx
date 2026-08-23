'use client';

import { useEffect, useMemo, useState } from 'react';
import { ClipboardList, KeyRound } from 'lucide-react';

import { AgentStrip } from '@/components/inspector/agent-strip';
import {
  ApprovedInspectionReportCard,
  showsApprovedInspectionReport,
} from '@/components/inspector/approved-inspection-report';
import { FindingsRoomRow } from '@/components/inspector/findings-room-row';
import { JobDetailsSummaryCard } from '@/components/inspector/job-details-summary-card';
import { OpenInspectionReferenceTabs } from '@/components/open-inspection/open-inspection-reference-tabs';
import { ProofPhotoGallery } from '@/components/inspector/proof-photo-gallery';
import { useInspectorData } from '@/components/providers/inspector-data-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { KeyPhaseRecord } from '@/lib/key-access-workflow';
import { buildJobHistoryReport } from '@/lib/job-history';
import { isDemoJobId } from '@/lib/inspector-job-filters';
import type { InspectionJob, RoomInspectionEntry } from '@/lib/types';
import { formatOpenInspectionEarlyTimingNotice } from '@/lib/open-inspection-ui';
import { cn, formatDateTime } from '@/lib/utils';

type HistoryTab = 'job' | 'report' | 'checkins' | 'qr' | 'handover' | 'findings';

function KeyPhaseSection({
  title,
  record,
  location,
}: {
  title: string;
  record?: KeyPhaseRecord;
  location?: string;
}) {
  const photos =
    record?.photoUrls?.map((url, index) => ({
      label: `Photo ${index + 1}`,
      url,
    })) ?? [];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <KeyRound className="text-primary size-4" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {!record ? (
          <p className="text-muted-foreground text-xs">Not recorded for this job.</p>
        ) : (
          <>
            {location && (
              <p className="text-muted-foreground text-xs">{location}</p>
            )}
            <p className="text-muted-foreground text-xs">
              Completed {formatDateTime(record.completedAt)}
            </p>
            {record.handoverParty ? (
              <p className="text-xs">
                With {record.handoverParty}
                {record.contactName ? ` · ${record.contactName}` : ''}
              </p>
            ) : null}
            {record.notes && (
              <p className="rounded-lg border bg-secondary/30 px-3 py-2 text-xs whitespace-pre-wrap">
                {record.notes}
              </p>
            )}
            <ProofPhotoGallery photos={photos} emptyLabel="No key proof photos" />
          </>
        )}
      </CardContent>
    </Card>
  );
}

function FindingsSection({ rooms }: { rooms: RoomInspectionEntry[] }) {
  if (rooms.length === 0) {
    return (
      <p className="text-muted-foreground rounded-xl border border-dashed px-4 py-8 text-center text-sm">
        No inspection findings saved for this job.
      </p>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <ClipboardList className="text-primary size-4" />
          Inspection findings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {rooms.map((room) => (
          <FindingsRoomRow key={room.area} room={room} />
        ))}
      </CardContent>
    </Card>
  );
}

export function JobHistoryReport({ job }: { job: InspectionJob }) {
  const { loadInspectionFindings } = useInspectorData();
  const report = buildJobHistoryReport(job);
  const serverBacked = !isDemoJobId(job.id);
  const [findings, setFindings] = useState<RoomInspectionEntry[]>([]);
  const isOpen = job.type === 'open';
  const showReport = showsApprovedInspectionReport(job) && serverBacked;
  const showHandover = Boolean(job.keyAccess);
  const showFindings = !isOpen;
  const tabs = useMemo(() => {
    const items: { id: HistoryTab; label: string }[] = [{ id: 'job', label: 'Job' }];
    if (isOpen) {
      items.push({ id: 'checkins', label: 'Check-ins' }, { id: 'qr', label: 'QR' });
    } else if (showReport) {
      items.push({ id: 'report', label: 'Report' });
    }
    if (showHandover) items.push({ id: 'handover', label: 'Handover' });
    if (showFindings) items.push({ id: 'findings', label: 'Findings' });
    return items;
  }, [isOpen, showFindings, showHandover, showReport]);

  const [tab, setTab] = useState<HistoryTab>(() =>
    isOpen ? 'checkins' : showReport ? 'report' : 'job',
  );
  const earlyTimingNotice =
    isOpen
      ? formatOpenInspectionEarlyTimingNotice({
          startedEarly: report.startedEarly,
          startedEarlyAt: report.startedEarlyAt,
          originalScheduledStart: report.originalScheduledStart,
          finishedAt: report.completedAt,
        })
      : null;

  useEffect(() => {
    if (!tabs.some((item) => item.id === tab)) {
      setTab(tabs[0]?.id ?? 'job');
    }
  }, [tab, tabs]);

  useEffect(() => {
    if (!serverBacked || !showFindings) return;
    let active = true;
    void loadInspectionFindings(job.id).then((rooms) => {
      if (!active) return;
      setFindings(rooms);
    });
    return () => {
      active = false;
    };
  }, [job.id, loadInspectionFindings, serverBacked, showFindings]);

  return (
    <div className="space-y-4">
      <div
        className="bg-background sticky z-20 -mx-4 border-b border-border px-4"
        style={{ top: 'var(--inspector-header-height, 3.5rem)' }}
      >
        <div className="flex">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              className={cn(
                '-mb-px flex-1 px-2 py-2.5 text-xs font-semibold transition-colors sm:text-sm',
                tab === item.id
                  ? 'text-primary border-primary border-b-2'
                  : 'text-muted-foreground border-b-2 border-transparent',
              )}
              onClick={() => setTab(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'job' ? (
        <div className="space-y-4">
          {report.completedAt && (
            <p className="text-muted-foreground text-xs">
              Report submitted {formatDateTime(report.completedAt)}
            </p>
          )}
          {earlyTimingNotice ? (
            <p className="text-muted-foreground text-xs leading-relaxed">
              {earlyTimingNotice}.
            </p>
          ) : null}
          <JobDetailsSummaryCard job={job} />
          <AgentStrip job={job} />
        </div>
      ) : null}

      {tab === 'report' && showReport ? (
        <ApprovedInspectionReportCard job={job} />
      ) : null}

      {tab === 'checkins' || tab === 'qr' ? (
        <OpenInspectionReferenceTabs
          inspectionId={job.id}
          hideTabs
          panel={tab}
        />
      ) : null}

      {tab === 'handover' && showHandover && job.keyAccess ? (
        <div className="space-y-4">
          <KeyPhaseSection
            title="Handover (collecting keys)"
            record={report.keyCollect}
            location={job.keyAccess.location}
          />
          <KeyPhaseSection
            title="Handover (returning keys)"
            record={report.keyReturn}
            location={job.keyAccess.location}
          />
        </div>
      ) : null}

      {tab === 'findings' && showFindings ? (
        serverBacked ? (
          <FindingsSection rooms={findings} />
        ) : (
          <p className="text-muted-foreground rounded-xl border border-dashed px-4 py-8 text-center text-sm">
            This job was completed before detailed proof capture was enabled, or no
            photos were saved for this inspection type.
          </p>
        )
      ) : null}
    </div>
  );
}
