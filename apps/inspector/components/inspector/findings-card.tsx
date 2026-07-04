'use client';

import { useEffect, useState } from 'react';
import { ClipboardList } from 'lucide-react';

import { FindingsRoomRow } from '@/components/inspector/findings-room-row';
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
          <FindingsRoomRow key={room.area} room={room} />
        ))}
      </CardContent>
    </Card>
  );
}
