/**
 * Agent APP ingoing/outgoing price list (ex-GST), then +GST for the inspector Est. Fee.
 * Keep in lockstep with `crossub_web/apps/api/src/modules/billing/billing-pricing.util.ts`.
 *
 * Routine / open inspector pay is separate — see `ROUTINE_OPEN_INSPECTOR_FEE_INC_GST_AUD`
 * in `constants/inspection-rates.ts` (flat $45 inc GST per job).
 */
import type { InspectionType, PropertyInspectionSpec } from '@/lib/types';

export const GST_PERCENT = 10;

function applyGst(exGst: number): number {
  return Math.round(exGst * (1 + GST_PERCENT / 100) * 100) / 100;
}

function bedBand(bedrooms: number | null | undefined): number {
  if (bedrooms == null || bedrooms <= 0) return 0;
  if (bedrooms >= 6) return 6;
  return bedrooms;
}

/**
 * Ingoing / outgoing ex-GST from the Agent APP rate card.
 * Apartment / unit / townhouse / studio share the compact row; house uses the house row.
 */
export function fieldInspectionExGstAud(
  kind: 'ingoing' | 'outgoing',
  spec: PropertyInspectionSpec,
): number | null {
  const band = bedBand(spec.bedrooms);
  if (spec.propertyKind === 'house') {
    const houseRow = [75, 110, 150, 150, 150, null] as const;
    if (band >= 6) return null;
    return houseRow[band] ?? null;
  }
  const compactRow = [75, 75, 75, 130, 150, 150] as const;
  if (band >= 6) return 150;
  return compactRow[band] ?? 75;
}

/** Agent catalogue fee for ingoing/outgoing Est. Fee (inc GST). */
export function agentCatalogFeeIncGst(
  type: InspectionType,
  spec: PropertyInspectionSpec,
): number | null {
  if (type === 'ingoing' || type === 'outgoing') {
    const exGst = fieldInspectionExGstAud(type, spec);
    return exGst == null ? null : applyGst(exGst);
  }
  return null;
}
