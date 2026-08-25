'use client';

import { Scale } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { EmptyState } from '@/components/inspector/empty-state';
import { InspectorShell } from '@/components/layout/inspector-shell';
import { useInspectorData } from '@/components/providers/inspector-data-provider';
import { ROUTES } from '@/constants/routes';
import { inspectorLevelAllows } from '@/lib/inspector-access-level';

export default function TribunalDetailPage() {
  const router = useRouter();
  const { profile } = useInspectorData();
  const allowed = inspectorLevelAllows(profile.accessLevel, 'tribunal');

  useEffect(() => {
    if (!allowed) router.replace(ROUTES.DASHBOARD);
  }, [allowed, router]);

  if (!allowed) return null;

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
