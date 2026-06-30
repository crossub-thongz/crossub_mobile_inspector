'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { useAuth } from '@/components/providers/auth-provider';
import { useInspectorData } from '@/components/providers/inspector-data-provider';
import { ROUTES, isPublicRoute } from '@/constants/routes';

const REGISTRATION_EXEMPT = [ROUTES.REGISTER, ROUTES.PROFILE];

export function RegistrationGate({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const { registrationComplete, registrationHydrated, loading } = useInspectorData();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (status !== 'authed' || loading || !registrationHydrated) return;
    if (isPublicRoute(pathname)) return;
    if (REGISTRATION_EXEMPT.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
      return;
    }
    if (!registrationComplete) {
      router.replace(ROUTES.REGISTER);
    }
  }, [
    status,
    loading,
    registrationHydrated,
    registrationComplete,
    pathname,
    router,
  ]);

  return <>{children}</>;
}
