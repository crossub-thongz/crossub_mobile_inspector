'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type AreaAvailablePromptProps = {
  areaName: string;
  areaIndex: number;
  totalAreas: number;
  onYes: () => void;
  onNo: () => void;
};

export function AreaAvailablePrompt({
  areaName,
  areaIndex,
  totalAreas,
  onYes,
  onNo,
}: AreaAvailablePromptProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {areaName} ({areaIndex + 1}/{totalAreas})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-foreground">
          Is this area available?
        </p>
        <p className="text-muted-foreground text-xs">
          Choose Yes to photograph each section. Choose No to skip this area.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <Button type="button" className="w-full" onClick={onYes}>
            Yes
          </Button>
          <Button type="button" variant="outline" className="w-full" onClick={onNo}>
            No — skip
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
