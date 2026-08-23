'use client';

import { cn } from '@/lib/utils';

export function OpenInspectionCountdown({
  clock,
  ratio,
  ended,
}: {
  clock: string;
  ratio: number;
  ended?: boolean;
}) {
  const size = 88;
  const stroke = 7;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="relative size-[5.5rem] shrink-0">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          className="stroke-secondary"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          className={cn(ended ? 'stroke-muted-foreground' : 'stroke-primary')}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - ratio)}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <p className="text-foreground text-sm font-semibold tabular-nums leading-none">
          {clock}
        </p>
        <p className="text-muted-foreground mt-0.5 text-[10px] leading-tight">
          remaining
        </p>
      </div>
    </div>
  );
}
