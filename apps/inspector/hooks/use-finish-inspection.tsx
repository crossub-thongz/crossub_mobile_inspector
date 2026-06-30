'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';

import { InspectionCompleteOverlay } from '@/components/inspector/inspection-complete-overlay';
import { useInspectorData } from '@/components/providers/inspector-data-provider';
import { ROUTES, jobKeys } from '@/constants/routes';

type OverlayState = {
  title: string;
  subtitle?: string;
  redirect: 'home' | 'keys';
};

export function useFinishInspection(jobId: string) {
  const router = useRouter();
  const { finishInspectionWorkflow } = useInspectorData();
  const [overlay, setOverlay] = useState<OverlayState | null>(null);

  const finish = useCallback(
    (successMessage: string) => {
      const outcome = finishInspectionWorkflow(jobId);

      if (outcome === 'needs_key_return') {
        setOverlay({
          title: 'Report generated',
          subtitle: 'Return the keys to complete this task.',
          redirect: 'keys',
        });
        return;
      }

      setOverlay({
        title: 'Inspection complete',
        subtitle: successMessage,
        redirect: 'home',
      });
    },
    [jobId, finishInspectionWorkflow],
  );

  const dismissOverlay = useCallback(() => {
    setOverlay((current) => {
      if (!current) return null;
      if (current.redirect === 'keys') {
        router.push(jobKeys(jobId, 'return'));
      } else {
        router.push(ROUTES.DASHBOARD);
      }
      return null;
    });
  }, [jobId, router]);

  const Celebration = (
    <InspectionCompleteOverlay
      open={overlay != null}
      title={overlay?.title ?? ''}
      subtitle={overlay?.subtitle}
      onDone={dismissOverlay}
    />
  );

  return { finish, Celebration };
}
