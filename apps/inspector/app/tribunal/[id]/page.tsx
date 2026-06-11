'use client';

import { useParams } from 'next/navigation';
import { FileText } from 'lucide-react';

import { InspectorShell } from '@/components/layout/inspector-shell';
import { useInspectorData } from '@/components/providers/inspector-data-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TRIBUNAL_OUTCOMES } from '@/constants/inspection';
import { ROUTES } from '@/constants/routes';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import type { TribunalOutcome } from '@/lib/types';

export default function TribunalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const {
    getTribunal,
    updateTribunalChecklist,
    recordTribunalOutcome,
  } = useInspectorData();
  const hearing = getTribunal(id);

  if (!hearing) {
    return (
      <InspectorShell title="Not found" backHref={ROUTES.TRIBUNAL}>
        <p className="text-muted-foreground text-sm">Hearing not found.</p>
      </InspectorShell>
    );
  }

  return (
    <InspectorShell title="Tribunal Hearing" backHref={ROUTES.TRIBUNAL}>
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>{hearing.tribunalType}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>{formatDateTime(hearing.hearingTime)}</p>
            <p className="text-muted-foreground">{hearing.location}</p>
            <p>{hearing.propertyAddress}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Case Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>{hearing.caseSummary}</p>
            {hearing.bondClaimAmount != null && (
              <p>Bond claim: {formatCurrency(hearing.bondClaimAmount)}</p>
            )}
            {hearing.propertyDamage && (
              <p className="text-muted-foreground">{hearing.propertyDamage}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tribunal Package</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {hearing.packageDocuments.map((doc) => (
              <a
                key={doc.name}
                href={doc.url}
                className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-secondary"
              >
                <FileText className="size-4 text-primary" />
                {doc.name}
              </a>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Checklist</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(
              Object.entries(hearing.checklist) as [
                keyof typeof hearing.checklist,
                boolean,
              ][]
            ).map(([key, value]) => (
              <button
                key={key}
                type="button"
                onClick={() => updateTribunalChecklist(id, key, !value)}
                className={`flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm ${
                  value ? 'border-primary bg-primary/10' : ''
                }`}
              >
                <span
                  className={`size-4 rounded border ${value ? 'bg-primary' : ''}`}
                />
                {key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())}
              </button>
            ))}
          </CardContent>
        </Card>

        {hearing.status === 'upcoming' && (
          <Card>
            <CardHeader>
              <CardTitle>Record Outcome</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {TRIBUNAL_OUTCOMES.map((outcome) => (
                <Button
                  key={outcome}
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    recordTribunalOutcome(id, outcome as TribunalOutcome)
                  }
                >
                  {outcome.replace(/_/g, ' ')}
                </Button>
              ))}
            </CardContent>
          </Card>
        )}

        {hearing.outcome && (
          <p className="text-primary text-sm font-medium">
            Outcome: {hearing.outcome.replace(/_/g, ' ')}
          </p>
        )}
      </div>
    </InspectorShell>
  );
}
