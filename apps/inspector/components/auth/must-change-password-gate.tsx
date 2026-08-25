'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { AuthLoadingScreen } from '@/components/auth/auth-loading-screen';
import { useAuth } from '@/components/providers/auth-provider';
import { ROUTES, isPublicRoute } from '@/constants/routes';
import {
  needsPasswordChange,
  needsSystemAccessAgreement,
} from '@/lib/system-access-agreement';

const PASSWORD_EXEMPT = [ROUTES.CHANGE_PASSWORD, ROUTES.SYSTEM_ACCESS_AGREEMENT];

export function MustChangePasswordGate({ children }: { children: React.ReactNode }) {
  const { user, status } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const onExemptPage = PASSWORD_EXEMPT.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );

  const awaitingAgreement = Boolean(user && needsSystemAccessAgreement(user));

  const mustChange =
    status === 'authed' &&
    Boolean(user) &&
    needsPasswordChange(user!) &&
    !awaitingAgreement &&
    !onExemptPage;

  useEffect(() => {
    if (!mustChange || isPublicRoute(pathname)) return;
    router.replace(ROUTES.CHANGE_PASSWORD);
  }, [mustChange, pathname, router]);

  if (status === 'loading' && !isPublicRoute(pathname)) {
    return <AuthLoadingScreen />;
  }
  if (mustChange && !isPublicRoute(pathname)) {
    return <AuthLoadingScreen message="Redirecting to change password…" />;
  }

  return <>{children}</>;
}
