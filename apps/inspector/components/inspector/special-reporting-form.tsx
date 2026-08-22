'use client';

import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { SpecialReportingDraft } from '@/lib/special-reporting';
import { specialReportingMissing } from '@/lib/special-reporting';
import { cn } from '@/lib/utils';

const COMMENT_MAX = 200;

function YesNo({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {([true, false] as const).map((option) => (
        <button
          key={String(option)}
          type="button"
          onClick={() => onChange(option)}
          className={cn(
            'rounded-lg px-3 py-2 text-xs font-semibold',
            value === option
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary text-muted-foreground',
          )}
        >
          {option ? 'Yes' : 'No'}
        </button>
      ))}
    </div>
  );
}

export function SpecialReportingForm({
  value,
  onChange,
  submitting,
  onBack,
  onFinalise,
}: {
  value: SpecialReportingDraft;
  onChange: (next: SpecialReportingDraft) => void;
  submitting?: boolean;
  onBack: () => void;
  onFinalise: () => void;
}) {
  const patch = (partial: Partial<SpecialReportingDraft>) =>
    onChange({ ...value, ...partial });

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-foreground text-base font-semibold">Special Reporting</h2>
        <p className="text-muted-foreground mt-1 text-xs">
          Defaults are pre-set. Meter readings are required before you finalise.
        </p>
      </div>

      <section className="border-border space-y-3 rounded-xl border bg-card p-3">
        <p className="text-xs font-semibold">Safety</p>
        <div className="space-y-1">
          <Label>Smoke alarms installed</Label>
          <YesNo
            value={value.smokeAlarmsInstalled}
            onChange={(smokeAlarmsInstalled) => patch({ smokeAlarmsInstalled })}
          />
        </div>
        <div className="space-y-1">
          <Label>Smoke alarms working</Label>
          <YesNo
            value={value.smokeAlarmsWorking}
            onChange={(smokeAlarmsWorking) => patch({ smokeAlarmsWorking })}
          />
        </div>
        <div className="space-y-1">
          <Label>Safety switch present</Label>
          <YesNo
            value={value.safetySwitchPresent}
            onChange={(safetySwitchPresent) => patch({ safetySwitchPresent })}
          />
        </div>
      </section>

      <section className="border-border space-y-3 rounded-xl border bg-card p-3">
        <p className="text-xs font-semibold">Meter readings</p>
        <div className="space-y-1">
          <Label htmlFor="electricity-meter">Electricity meter</Label>
          <Input
            id="electricity-meter"
            required
            value={value.electricityMeter}
            onChange={(e) => patch({ electricityMeter: e.target.value })}
            placeholder="Required"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="water-meter">Water meter</Label>
          <Input
            id="water-meter"
            required
            value={value.waterMeter}
            onChange={(e) => patch({ waterMeter: e.target.value })}
            placeholder="Required"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="gas-meter">Gas meter (optional)</Label>
          <Input
            id="gas-meter"
            value={value.gasMeter}
            onChange={(e) => patch({ gasMeter: e.target.value })}
            placeholder="Leave blank if not separately metered"
          />
        </div>
      </section>

      <section className="border-border space-y-3 rounded-xl border bg-card p-3">
        <p className="text-xs font-semibold">Handover</p>
        <div className="flex items-center justify-between gap-2">
          <Label>Key sets</Label>
          <Input
            type="number"
            min={0}
            className="h-8 w-20 text-right"
            value={value.keySets}
            onChange={(e) => patch({ keySets: Number(e.target.value) || 0 })}
          />
        </div>
        <div className="flex items-center justify-between gap-2">
          <Label>Remotes</Label>
          <Input
            type="number"
            min={0}
            className="h-8 w-20 text-right"
            value={value.remotes}
            onChange={(e) => patch({ remotes: Number(e.target.value) || 0 })}
          />
        </div>
        <div className="space-y-1">
          <Label>Property ready for occupation</Label>
          <YesNo
            value={value.propertyReady}
            onChange={(propertyReady) => patch({ propertyReady })}
          />
        </div>
        <div className="space-y-1">
          <Label>Overall cleanliness</Label>
          <div className="grid grid-cols-3 gap-2">
            {(['clean', 'fair', 'poor'] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => patch({ overallCleanliness: option })}
                className={cn(
                  'rounded-lg px-2 py-2 text-xs font-semibold capitalize',
                  value.overallCleanliness === option
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-muted-foreground',
                )}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="border-border space-y-2 rounded-xl border bg-card p-3">
        <Label htmlFor="special-notes">Additional comments (optional)</Label>
        <textarea
          id="special-notes"
          rows={3}
          maxLength={COMMENT_MAX}
          placeholder="Anything the account manager should know…"
          value={value.additionalComments}
          onChange={(e) =>
            patch({ additionalComments: e.target.value.slice(0, COMMENT_MAX) })
          }
          className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
        />
        <p className="text-muted-foreground text-right text-[10px]">
          {value.additionalComments.length}/{COMMENT_MAX}
        </p>
      </section>

      <div className="flex gap-2">
        <Button type="button" variant="outline" className="flex-1" onClick={onBack}>
          Back
        </Button>
        <Button
          type="button"
          className="flex-[2]"
          disabled={submitting}
          onClick={() => {
            const missing = specialReportingMissing(value);
            if (missing) {
              toast.error(missing);
              return;
            }
            onFinalise();
          }}
        >
          {submitting ? 'Submitting…' : 'Finalise'}
        </Button>
      </div>
    </div>
  );
}
