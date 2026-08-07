'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

import { InspectionCompleteOverlay } from '@/components/inspector/inspection-complete-overlay';
import { useInspectorData } from '@/components/providers/inspector-data-provider';
import { ROUTES, jobKeys } from '@/constants/routes';

type OverlayState = {
  title: string;
  subtitle?: string;
  redirect: 'home' | 'keys';
};

const POST_FINISH_DELAY_MS = 2400;

export function useFinishInspection(jobId: string) {
  const router = useRouter();
  const { finishInspectionWorkflow } = useInspectorData();
  const [overlay, setOverlay] = useState<OverlayState | null>(null);
  const overlayRef = useRef(overlay);
  overlayRef.current = overlay;
  const navigationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const navigateToNextStep = useCallback(
    (redirect: OverlayState['redirect']) => {
      setOverlay(null);
      router.replace(
        redirect === 'keys' ? jobKeys(jobId, 'return') : ROUTES.DASHBOARD,
      );
    },
    [jobId, router],
  );

  const dismissOverlay = useCallback(() => {
    if (navigationTimerRef.current) {
      window.clearTimeout(navigationTimerRef.current);
      navigationTimerRef.current = null;
    }
    const current = overlayRef.current;
    if (!current) return;
    navigateToNextStep(current.redirect);
  }, [navigateToNextStep]);

  const scheduleNavigation = useCallback(
    (redirect: OverlayState['redirect']) => {
      if (navigationTimerRef.current) {
        window.clearTimeout(navigationTimerRef.current);
      }
      navigationTimerRef.current = window.setTimeout(() => {
        navigationTimerRef.current = null;
        navigateToNextStep(redirect);
      }, POST_FINISH_DELAY_MS);
    },
    [navigateToNextStep],
  );

  useEffect(
    () => () => {
      if (navigationTimerRef.current) {
        window.clearTimeout(navigationTimerRef.current);
      }
    },
    [],
  );

  const celebrate = useCallback(
    (
      successMessage: string,
      redirect: OverlayState['redirect'] = 'home',
      title = 'Inspection complete',
    ) => {
      setOverlay({ title, subtitle: successMessage, redirect });
      scheduleNavigation(redirect);
    },
    [scheduleNavigation],
  );

  const finish = useCallback(
    (successMessage: string) => {
      const outcome = finishInspectionWorkflow(jobId);

      if (outcome === 'needs_key_return') {
        celebrate(
          'Return the keys to complete this task.',
          'keys',
          'Report generated',
        );
        return;
      }

      celebrate(successMessage);
    },
    [jobId, finishInspectionWorkflow, celebrate],
  );

  const Celebration = (
    <InspectionCompleteOverlay
      open={overlay != null}
      title={overlay?.title ?? ''}
      subtitle={overlay?.subtitle}
      onDone={dismissOverlay}
    />
  );

  return { finish, celebrate, Celebration };
}
