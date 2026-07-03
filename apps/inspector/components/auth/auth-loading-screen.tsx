'use client';

import { Loader2 } from 'lucide-react';

export function AuthLoadingScreen({ message }: { message?: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background px-4">
      <Loader2 className="size-8 animate-spin text-primary" />
      {message ? (
        <p className="text-sm text-muted-foreground">{message}</p>
      ) : null}
    </div>
  );
}
