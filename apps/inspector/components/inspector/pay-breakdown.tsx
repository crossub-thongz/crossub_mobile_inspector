'use client';

import {
  APARTMENT_INSPECTION_HOURS,
  FUEL_RATE_PER_KM_AUD,
  HOUSE_AREA_MINUTES,
  INSPECTOR_HOURLY_RATE_AUD,
  REGIONAL_MIDPOINTS,
} from '@/constants/inspection';
import { formatFuelRate, formatHourlyRate } from '@/lib/inspector-pay';
import { formatCurrency } from '@/lib/utils';

export function PayBreakdown({
  hours,
  laborAmount,
  travelKmOneWay,
  fuelAllowance,
  total,
  durationLabel,
  serviceRegion,
  compact,
}: {
  hours: number;
  laborAmount: number;
  travelKmOneWay: number;
  fuelAllowance: number;
  total: number;
  durationLabel?: string;
  serviceRegion?: keyof typeof REGIONAL_MIDPOINTS;
  compact?: boolean;
}) {
  const midpoint = serviceRegion
    ? REGIONAL_MIDPOINTS[serviceRegion].midpoint
    : null;

  return (
    <div className={compact ? 'space-y-0.5' : 'space-y-1'}>
      {durationLabel && (
        <p className="text-muted-foreground text-[10px]">{durationLabel}</p>
      )}
      <p className="text-primary text-sm font-semibold tabular-nums">
        {formatCurrency(total)}
      </p>
      <p className="text-muted-foreground text-[10px] leading-relaxed">
        {hours}h × {formatHourlyRate()} = {formatCurrency(laborAmount)}
        {fuelAllowance > 0 && (
          <>
            {' '}
            + {travelKmOneWay}km × {formatFuelRate()} fuel ={' '}
            {formatCurrency(fuelAllowance)}
          </>
        )}
      </p>
      {!compact && midpoint && (
        <p className="text-muted-foreground text-[10px]">
          Fuel from {midpoint} (one-way)
        </p>
      )}
    </div>
  );
}

export function RatesGuidelinesCard() {
  return (
    <div className="space-y-4 rounded-xl border border-border/80 bg-card p-4 text-xs">
      <div>
        <p className="font-semibold">Inspector rates</p>
        <p className="text-muted-foreground mt-1">
          Base rate {formatHourlyRate()} for all hours worked during inspection.
          Fuel reimbursed at {formatFuelRate()} one-way from the nearest regional
          midpoint to each property.
        </p>
      </div>

      <div>
        <p className="mb-2 font-semibold">Regional midpoints</p>
        <div className="space-y-1">
          {Object.values(REGIONAL_MIDPOINTS).map((r) => (
            <div key={r.midpoint} className="flex justify-between gap-2">
              <span className="text-muted-foreground">{r.label}</span>
              <span className="text-right font-medium">{r.midpoint}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 font-semibold">Apartments — allocated time</p>
        <div className="grid grid-cols-2 gap-1">
          {Object.entries(APARTMENT_INSPECTION_HOURS).map(([key, hours]) => {
            const [bed, bath] = key.split('-');
            return (
              <div
                key={key}
                className="flex justify-between rounded-md bg-secondary/30 px-2 py-1"
              >
                <span>
                  {bed} bed / {bath} bath
                </span>
                <span className="font-medium">{hours}h</span>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <p className="mb-2 font-semibold">Houses — per area</p>
        <div className="grid grid-cols-2 gap-1">
          <span className="text-muted-foreground">Bedroom</span>
          <span>{HOUSE_AREA_MINUTES.bedroom} min</span>
          <span className="text-muted-foreground">Bathroom</span>
          <span>{HOUSE_AREA_MINUTES.bathroom} min</span>
          <span className="text-muted-foreground">Living area</span>
          <span>{HOUSE_AREA_MINUTES.livingArea} min</span>
          <span className="text-muted-foreground">Kitchen</span>
          <span>{HOUSE_AREA_MINUTES.kitchen} min</span>
          <span className="text-muted-foreground">Laundry</span>
          <span>{HOUSE_AREA_MINUTES.laundry} min</span>
          <span className="text-muted-foreground">Front & back yard</span>
          <span>{HOUSE_AREA_MINUTES.yardsCombined} min (combined)</span>
        </div>
      </div>

      <p className="text-muted-foreground text-[10px]">
        Rates confirmed with Inspection & Accounting departments. Total fee = labour
        ({INSPECTOR_HOURLY_RATE_AUD}/hr × allocated hours) + fuel (
        {FUEL_RATE_PER_KM_AUD}/km one-way).
      </p>
    </div>
  );
}
