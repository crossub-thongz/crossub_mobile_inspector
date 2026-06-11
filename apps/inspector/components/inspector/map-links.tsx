'use client';

import { Navigation } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { buildMapUrl } from '@/lib/navigation';

export function MapLinks({
  address,
  lat,
  lng,
}: {
  address: string;
  lat?: number;
  lng?: number;
}) {
  return (
    <div className="space-y-2">
      <p className="text-muted-foreground text-xs font-medium uppercase">
        Navigate
      </p>
      <div className="flex flex-wrap gap-2">
        {(['google', 'apple', 'waze'] as const).map((app) => (
          <Button
            key={app}
            variant="outline"
            size="sm"
            asChild
          >
            <a
              href={buildMapUrl(app, address, lat, lng)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Navigation className="size-3.5" />
              {app === 'google' ? 'Google Maps' : app === 'apple' ? 'Apple Maps' : 'Waze'}
            </a>
          </Button>
        ))}
      </div>
    </div>
  );
}
