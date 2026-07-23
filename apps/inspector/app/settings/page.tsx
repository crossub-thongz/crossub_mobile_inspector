'use client';

import { WifiOff } from 'lucide-react';

import { InspectorWeeklyTimetableCard } from '@/components/inspector/weekly-timetable-card';
import { InspectorShell } from '@/components/layout/inspector-shell';
import { useInspectorData } from '@/components/providers/inspector-data-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function SettingsPage() {
  const { pendingSync, syncOfflineQueue } = useInspectorData();

  return (
    <InspectorShell title="Settings">
      <div className="space-y-4">
        <InspectorWeeklyTimetableCard />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <WifiOff className="size-4" />
              Offline Mode
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="text-muted-foreground text-xs leading-relaxed">
              Photos, inspection details, and job updates are saved locally when
              offline. Changes sync automatically when connection is restored.
            </p>
            {pendingSync > 0 && (
              <p className="text-amber-400 text-xs">
                {pendingSync} change(s) waiting to sync
              </p>
            )}
            <Button
              variant="outline"
              className="w-full"
              onClick={() => void syncOfflineQueue()}
            >
              Sync now
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Connected Apps</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            {process.env.NEXT_PUBLIC_WEB_URL && (
              <a
                href={process.env.NEXT_PUBLIC_WEB_URL}
                className="text-primary block underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                CROSSUB Web Portal
              </a>
            )}
            {process.env.NEXT_PUBLIC_AGENT_PORTAL_URL && (
              <a
                href={process.env.NEXT_PUBLIC_AGENT_PORTAL_URL}
                className="text-primary block underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Agent Portal
              </a>
            )}
          </CardContent>
        </Card>
      </div>
    </InspectorShell>
  );
}
