import { Camera, KeyRound } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { KeyAccess } from '@/lib/types';

export function KeyAccessCard({ access }: { access: KeyAccess }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <KeyRound className="text-primary size-4" />
          Key collection
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <p className="font-medium">{access.location}</p>
        {access.code && (
          <p className="rounded-lg border border-dashed border-primary/40 bg-primary/5 px-3 py-2 text-center font-mono text-lg font-bold tracking-widest text-primary">
            {access.code}
          </p>
        )}
        <div>
          <p className="text-muted-foreground mb-1 text-xs font-medium uppercase">
            Collect
          </p>
          <ol className="list-decimal space-y-1 pl-4 text-xs">
            {access.collectSteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </div>
        <div>
          <p className="text-muted-foreground mb-1 text-xs font-medium uppercase">
            Return
          </p>
          <ol className="list-decimal space-y-1 pl-4 text-xs">
            {access.returnSteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </div>
        {access.photoRequired && (
          <Button type="button" variant="outline" size="sm" className="w-full">
            <Camera className="size-3.5" />
            Snap photo & confirm keys returned
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
