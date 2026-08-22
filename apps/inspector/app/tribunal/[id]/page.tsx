'use client';

import { Scale } from 'lucide-react';

import { EmptyState } from '@/components/inspector/empty-state';
import { InspectorShell } from '@/components/layout/inspector-shell';
import { ROUTES } from '@/constants/routes';

export default function TribunalDetailPage() {
  return (
    <InspectorShell title="Tribunal" backHref={ROUTES.TRIBUNAL}>
      <EmptyState
        icon={Scale}
        title="Coming Soon"
        description="Tribunal hearings and evidence packages will appear here."
      />
    </InspectorShell>
  );
}
