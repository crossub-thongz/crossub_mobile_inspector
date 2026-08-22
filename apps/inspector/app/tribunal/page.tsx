'use client';

import { Scale } from 'lucide-react';

import { EmptyState } from '@/components/inspector/empty-state';
import { InspectorShell } from '@/components/layout/inspector-shell';

export default function TribunalPage() {
  return (
    <InspectorShell title="Tribunal">
      <EmptyState
        icon={Scale}
        title="Coming Soon"
        description="Tribunal hearings and evidence packages will appear here."
      />
    </InspectorShell>
  );
}
