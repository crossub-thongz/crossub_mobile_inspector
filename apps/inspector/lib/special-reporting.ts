import type { InspectorFindingAreaPayload } from '@/lib/crossub-api/inspector-client';

export type SpecialReportingDraft = {
  smokeAlarmsInstalled: boolean;
  smokeAlarmsWorking: boolean;
  safetySwitchPresent: boolean;
  electricityMeter: string;
  gasMeter: string;
  waterMeter: string;
  keySets: number;
  remotes: number;
  propertyReady: boolean;
  overallCleanliness: 'clean' | 'fair' | 'poor';
  additionalComments: string;
};

/** Filled-version defaults for the inspector — yes/good/ready unless a reading is required. */
export function defaultSpecialReporting(): SpecialReportingDraft {
  return {
    smokeAlarmsInstalled: true,
    smokeAlarmsWorking: true,
    safetySwitchPresent: true,
    electricityMeter: '',
    gasMeter: '',
    waterMeter: '',
    keySets: 1,
    remotes: 0,
    propertyReady: true,
    overallCleanliness: 'clean',
    additionalComments: '',
  };
}

/** Empty-version required fields that must be filled before Finalise. */
export function specialReportingMissing(
  draft: SpecialReportingDraft,
): string | null {
  if (!draft.electricityMeter.trim()) return 'Enter the electricity meter reading';
  if (!draft.waterMeter.trim()) return 'Enter the water meter reading';
  return null;
}

export function specialReportingAsFindings(
  draft: SpecialReportingDraft,
): InspectorFindingAreaPayload {
  const yesNo = (value: boolean) => (value ? 'Yes' : 'No');
  return {
    name: 'Special Reporting',
    rating: draft.overallCleanliness === 'clean' ? 'Excellent' : draft.overallCleanliness === 'fair' ? 'Fair' : 'Poor',
    items: [
      {
        name: 'Smoke alarms installed',
        comment: yesNo(draft.smokeAlarmsInstalled),
      },
      {
        name: 'Smoke alarms working',
        comment: yesNo(draft.smokeAlarmsWorking),
        flagged: !draft.smokeAlarmsWorking,
      },
      {
        name: 'Safety switch present',
        comment: yesNo(draft.safetySwitchPresent),
      },
      {
        name: 'Electricity meter',
        reading: draft.electricityMeter.trim(),
      },
      {
        name: 'Gas meter',
        reading: draft.gasMeter.trim() || undefined,
      },
      {
        name: 'Water meter',
        reading: draft.waterMeter.trim(),
      },
      {
        name: 'Key sets',
        comment: String(draft.keySets),
      },
      {
        name: 'Remotes',
        comment: String(draft.remotes),
      },
      {
        name: 'Property ready for occupation',
        comment: yesNo(draft.propertyReady),
        flagged: !draft.propertyReady,
      },
      ...(draft.additionalComments.trim()
        ? [{ name: 'Additional comments', comment: draft.additionalComments.trim() }]
        : []),
    ],
  };
}
