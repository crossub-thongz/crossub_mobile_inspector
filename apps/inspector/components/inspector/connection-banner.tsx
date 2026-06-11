'use client';

import { RefreshCw, WifiOff } from 'lucide-react';
import { toast } from 'sonner';

import { useInspectorData } from '@/components/providers/inspector-data-provider';
import { Button } from '@/components/ui/button';

export function ConnectionBanner() {
  const { apiConnected, apiError, loading, refresh, pendingSync, syncOfflineQueue } =
    useInspectorData();

  const handleRefresh = async () => {
    try {
      await refresh();
      if (pendingSync > 0) {
        await syncOfflineQueue();
      }
      toast.success('Data refreshed');
    } catch {
      toast.error('Refresh failed');
    }
  };

  return (
    <div className="space-y-2">
      {apiError && (
        <p className="text-destructive rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs">
          {apiError} — showing demo data where needed.
        </p>
      )}
    </div>
  );
}
