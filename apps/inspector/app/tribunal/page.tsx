'use client';

import Link from 'next/link';
import { Scale } from 'lucide-react';

import { EmptyState } from '@/components/inspector/empty-state';
import { PageIntro } from '@/components/inspector/page-intro';
import { StatusBadge } from '@/components/inspector/status-badge';
import { InspectorShell } from '@/components/layout/inspector-shell';
import { useInspectorData } from '@/components/providers/inspector-data-provider';
import { ROUTES, tribunalDetail } from '@/constants/routes';
import { inspectorLevelAllows } from '@/lib/inspector-access-level';
import { formatDateTime } from '@/lib/utils';

export default function TribunalPage() {
  const { tribunals, profile } = useInspectorData();
  const showTribunal = inspectorLevelAllows(profile.accessLevel, 'tribunal');
  const upcoming = tribunals.filter((t) => t.status === 'upcoming');
  const completed = tribunals.filter((t) => t.status === 'completed');

  if (!showTribunal) {
    return (
      <InspectorShell title="Tribunal" backHref={ROUTES.DASHBOARD}>
        <EmptyState
          icon={Scale}
          title="Tribunal not available"
          description="Tribunal assignments are only shown for Level 3 and Level 5 inspectors."
        />
      </InspectorShell>
    );
  }

  return (
    <InspectorShell title="Tribunal">
      <div className="space-y-4">
        <PageIntro description="Tribunal-qualified inspectors only. Auto-compiled evidence packages — no manual document gathering." />

        <section className="space-y-3">
          <h2 className="text-sm font-semibold">Upcoming Hearings</h2>
          {upcoming.length === 0 ? (
            <EmptyState
              icon={Scale}
              title="No upcoming hearings"
              description="Tribunal assignments appear here with full evidence packages."
            />
          ) : (
            upcoming.map((t) => (
              <Link
                key={t.id}
                href={tribunalDetail(t.id)}
                className="block rounded-2xl border border-border/80 bg-card p-4 transition hover:border-primary/30"
              >
                <div className="mb-2 flex items-center gap-2">
                  <StatusBadge label="Tribunal" variant="tribunal" />
                  <StatusBadge label={t.status} variant="assigned" />
                </div>
                <p className="text-sm font-semibold">{t.tribunalType}</p>
                <p className="text-muted-foreground mt-1 text-xs">
                  {formatDateTime(t.hearingTime)}
                </p>
                <p className="text-muted-foreground mt-1 text-xs">{t.location}</p>
                <p className="text-muted-foreground mt-2 text-xs">
                  {t.propertyAddress}
                </p>
              </Link>
            ))
          )}
        </section>

        {completed.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold">Completed</h2>
            {completed.map((t) => (
              <Link
                key={t.id}
                href={tribunalDetail(t.id)}
                className="block rounded-xl border border-border/60 bg-secondary/20 p-3 text-sm opacity-80"
              >
                {t.tribunalType} — {t.outcome?.replace(/_/g, ' ')}
              </Link>
            ))}
          </section>
        )}
      </div>
    </InspectorShell>
  );
}
