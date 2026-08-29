'use client';

import { ROUTINE_OPEN_INSPECTOR_FEE_INC_GST_AUD } from '@/constants/inspection-rates';
import { formatCurrency } from '@/lib/utils';

export function PayBreakdown({
  hours,
  laborAmount,
  durationLabel,
  compact,
  label = 'Est. Fee',
}: {
  hours: number;
  laborAmount: number;
  durationLabel?: string;
  compact?: boolean;
  label?: string;
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
        {label}
      </p>
      <p className="text-primary text-sm font-semibold tabular-nums">
        {formatCurrency(laborAmount)}
      </p>
      <p className="text-muted-foreground text-[10px] leading-relaxed">
        {hours === 1 && laborAmount === ROUTINE_OPEN_INSPECTOR_FEE_INC_GST_AUD
          ? `$${ROUTINE_OPEN_INSPECTOR_FEE_INC_GST_AUD} inc GST per routine / open job`
          : `Agent APP price list${hours > 0 ? ` · ~${hours}h on site` : ''}`}
      </p>
    </div>
  );
}
