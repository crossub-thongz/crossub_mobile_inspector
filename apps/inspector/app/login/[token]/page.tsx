'use client';

import { ClipboardCheck, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants/routes';
import { ApiError, api } from '@/lib/api';
import type { AuthUser } from '@/lib/auth-types';
import { clearLocalSession } from '@/lib/local-auth';
import { postAuthDestination } from '@/lib/system-access-agreement';

export default function LoginWithTokenPage() {
  const params = useParams<{ token: string }>();
  const token = params.token?.trim() ?? '';
  const [failed, setFailed] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    if (!token || started.current) return;
    started.current = true;

    void (async () => {
      try {
        const result = await api.post<{ user: AuthUser }>('/auth/login-with-token', {
          token,
        });
        clearLocalSession();
        toast.success('Signed in.');
        window.location.replace(
          postAuthDestination(
            result.user,
            ROUTES.DASHBOARD,
            ROUTES.SYSTEM_ACCESS_AGREEMENT,
          ),
        );
      } catch (err) {
        setFailed(true);
        if (err instanceof ApiError && err.status === 401) {
          toast.error('This sign-in link is invalid or has expired.');
          return;
        }
        toast.error('Could not sign you in. Request a new link from the office.');
      }
    })();
  }, [token]);

  if (!token || failed) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
        <div className="w-full max-w-md rounded-xl border bg-card p-8 shadow-lg">
          <h1 className="text-xl font-semibold">Sign-in link expired</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Ask the office to email you another Inspector app link, or sign in with
            your password if you already have one.
          </p>
          <Button asChild className="mt-6 w-full">
            <Link href={ROUTES.LOGIN}>Back to sign in</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <ClipboardCheck className="size-5" />
        </div>
        <div>
          <p className="text-lg font-semibold">CROSSUB Inspector App</p>
          <p className="text-sm text-muted-foreground">Signing you in…</p>
        </div>
      </div>
      <Loader2 className="size-6 animate-spin text-muted-foreground" />
    </div>
  );
}
