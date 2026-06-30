'use client';

import { KeyRound } from 'lucide-react';

import { ProofPhotoGallery } from '@/components/inspector/proof-photo-gallery';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  OPEN_FINISH_CHECKS,
} from '@/constants/inspection';
import type { KeyPhaseRecord } from '@/lib/key-access-workflow';
import { buildJobHistoryReport } from '@/lib/job-history';
import type { InspectionJob } from '@/lib/types';
import { formatDateTime } from '@/lib/utils';

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
            {record.notes && (
              <p className="rounded-lg border bg-secondary/30 px-3 py-2 text-xs">
                Notes: {record.notes}
              </p>
            )}
            <ProofPhotoGallery photos={photos} emptyLabel="No key proof photos" />
          </>
        )}
      </CardContent>
    </Card>
  );
}

export function JobHistoryReport({ job }: { job: InspectionJob }) {
  const report = buildJobHistoryReport(job);

  return (
    <div className="space-y-4">
      {report.completedAt && (
        <p className="text-muted-foreground text-xs">
          Report submitted {formatDateTime(report.completedAt)}
        </p>
      )}

      {job.keyAccess && (
        <>
          <KeyPhaseSection
            title="Key collection"
            record={report.keyCollect}
            location={job.keyAccess.location}
          />
          <KeyPhaseSection
            title="Key return"
            record={report.keyReturn}
            location={job.keyAccess.location}
          />
        </>
      )}

      {job.type === 'open' && (
        <>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Property readiness photos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <ProofPhotoGallery
                photos={report.readinessPhotos}
                emptyLabel="No property readiness photos saved"
              />
              {report.comments && (
                <p className="rounded-lg border bg-secondary/30 px-3 py-2 text-xs">
                  Comments: {report.comments}
                </p>
              )}
              {report.readyToLease != null && (
                <p className="text-xs font-medium">
                  Rental readiness:{' '}
                  {report.readyToLease ? 'Ready to lease' : 'Not ready to lease'}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Finish inspection proof</CardTitle>
            </CardHeader>
            <CardContent>
              <ProofPhotoGallery
                photos={report.finishPhotos}
                emptyLabel={`No finish photos saved (${OPEN_FINISH_CHECKS.join(', ')})`}
              />
            </CardContent>
          </Card>
        </>
      )}

      {job.type !== 'open' && !job.keyAccess && !report.hasReport && (
        <p className="text-muted-foreground rounded-lg border border-dashed px-3 py-6 text-center text-sm">
          This job was completed before detailed proof capture was enabled, or no
          photos were saved for this inspection type.
        </p>
      )}

      {job.type !== 'open' && report.hasReport && job.keyAccess && (
        <p className="text-muted-foreground text-xs">
          Section photos for {job.type} inspections are stored when captured during
          the workflow.
        </p>
      )}
    </div>
  );
}
