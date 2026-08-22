import { Scale } from 'lucide-react';

import { cn } from '@/lib/utils';

export function TribunalQualifiedTag({ certified }: { certified: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium',
        certified
          ? 'bg-sky-500 text-white'
          : 'border border-dashed border-muted-foreground/50 bg-transparent text-muted-foreground',
      )}
      aria-label={certified ? 'Tribunal qualified' : 'Tribunal uncertified'}
    >
      <Scale className="size-3" />
      Tribunal qualified
    </span>
  );
}
