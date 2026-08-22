'use client';

import { InspectorWeeklyTimetableCard } from '@/components/inspector/weekly-timetable-card';
import { InspectorShell } from '@/components/layout/inspector-shell';
import { ROUTES } from '@/constants/routes';

export default function WeeklyAvailabilityPage() {
  return (
    <InspectorShell title="Time Availability" backHref={ROUTES.MORE}>
      <InspectorWeeklyTimetableCard />
    </InspectorShell>
  );
}
