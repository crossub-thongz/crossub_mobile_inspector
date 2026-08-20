'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { InspectionAreaKind } from '@/lib/inspection-area-workflow';
import { inspectionStartCopy } from '@/lib/inspection-start-flow';

type AreaAvailablePromptProps = {
  areaName: string;
  areaIndex: number;
  totalAreas: number;
  kind?: InspectionAreaKind;
  onYes: () => void;
  onNo: () => void;
};

export function AreaAvailablePrompt({
  areaName,
  areaIndex,
  totalAreas,
  kind,
  onYes,
  onNo,
}: AreaAvailablePromptProps) {
  const copy = kind ? inspectionStartCopy(kind) : null;
  const question =
    kind === 'routine'
      ? 'Anything to note in this area?'
      : 'Is this area available?';
  const yesLabel = kind === 'routine' ? 'Yes — photograph issues' : 'Yes';
  const noLabel = kind === 'routine' ? 'No — in order' : 'No — skip';

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {areaName} ({areaIndex + 1}/{totalAreas})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-foreground">{question}</p>
        <p className="text-muted-foreground text-xs">
          {copy?.firstRoomHint ??
            'Choose Yes to photograph each section. Choose No to skip this area.'}
        </p>
        <div className="grid grid-cols-2 gap-3">
          <Button type="button" className="w-full" onClick={onYes}>
            {yesLabel}
          </Button>
          <Button type="button" variant="outline" className="w-full" onClick={onNo}>
            {noLabel}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
