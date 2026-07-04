'use client';

import { useEffect, useState } from 'react';
import { ClipboardList } from 'lucide-react';

import { ProofPhotoGallery } from '@/components/inspector/proof-photo-gallery';
import { useInspectorData } from '@/components/providers/inspector-data-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { RoomInspectionEntry } from '@/lib/types';

/**
 * Read-only findings tree for an assigned inspection — the seeded areas → items → photos
 * served by `GET /inspector/inspections/:id/detail`, flattened per room. Renders nothing
 * until findings exist (demo jobs and unreachable facade both return []), so it's purely
 * additive on the job-detail page. Inspection-level evidence photos (Phase D uploads)
 * surface here too via the synthetic "Inspection photos" row.
 */
export function FindingsCard({ jobId }: { jobId: string }) {
  const { loadInspectionFindings } = useInspectorData();
  const [rooms, setRooms] = useState<RoomInspectionEntry[]>([]);

  useEffect(() => {
    let active = true;
    void loadInspectionFindings(jobId).then((result) => {
      if (active) setRooms(result);
    });
    return () => {
      active = false;
    };
  }, [jobId, loadInspectionFindings]);

  if (rooms.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <ClipboardList className="text-primary size-4" />
          Findings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {rooms.map((room) => (
          <div
            key={room.area}
            className="space-y-1 border-b border-border/60 pb-3 last:border-0 last:pb-0"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium">{room.area}</p>
              {room.condition && (
                <span className="rounded-full border border-border px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                  {room.condition}
                </span>
              )}
            </div>
            {room.comments && (
              <p className="text-muted-foreground text-xs">{room.comments}</p>
            )}
            {room.photoUrls.length > 0 ? (
              <ProofPhotoGallery
                photos={room.photoUrls.map((url, index) => ({
                  label: `${room.area} · ${index + 1}`,
                  url,
                }))}
                emptyLabel="No photos for this area"
              />
            ) : null}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
