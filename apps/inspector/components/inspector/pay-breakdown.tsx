'use client';

import { formatCurrency } from '@/lib/utils';

export function PayBreakdown({
  hours,
  laborAmount,
  durationLabel,
  compact,
}: {
  hours: number;
  laborAmount: number;
  durationLabel?: string;
  compact?: boolean;
  /** @deprecated Fuel hidden from inspector UI — kept for call-site compatibility */
  travelKmOneWay?: number;
  fuelAllowance?: number;
  total?: number;
  serviceRegion?: string;
}) {
  return (
    <div className={compact ? 'space-y-0.5' : 'space-y-1'}>
      {durationLabel && (
        <p className="text-muted-foreground text-[10px]">{durationLabel}</p>
      )}
      <p className="text-muted-foreground text-[10px] font-medium uppercase tracking-wide">
        Est. Fee
      </p>
      <p className="text-primary text-sm font-semibold tabular-nums">
        {formatCurrency(laborAmount)}
      </p>
      <p className="text-muted-foreground text-[10px] leading-relaxed">
        Agent APP price list{hours > 0 ? ` · ~${hours}h on site` : ''}
      </p>
    </div>
  );
}
