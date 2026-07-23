'use client';

import { InspectorWeeklyTimetableCard } from '@/components/inspector/weekly-timetable-card';
import { InspectorShell } from '@/components/layout/inspector-shell';

export default function WeeklyAvailabilityPage() {
  return (
    <InspectorShell title="Availability calendar" backHref="/job-pool">
      <InspectorWeeklyTimetableCard />
    </InspectorShell>
  );
}
