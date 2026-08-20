'use client';

import { Button } from '@/components/ui/button';
import {
  ITEM_CONDITION_KEYS,
  ITEM_CONDITION_LABEL,
  type ItemConditionKey,
} from '@/lib/item-condition-marks';
import { cn } from '@/lib/utils';

type ItemConditionColumnBarProps = {
  disabled?: boolean;
  onFillColumn: (key: ItemConditionKey, value: boolean) => void;
};

export function ItemConditionColumnBar({
  disabled = false,
  onFillColumn,
}: ItemConditionColumnBarProps) {
  return (
    <div className="space-y-2 rounded-lg border border-dashed p-3">
      <p className="text-muted-foreground text-xs">
        Hold Yes or No on a column to mark every item in this room.
      </p>
      <div className="grid grid-cols-3 gap-2">
        {ITEM_CONDITION_KEYS.map((key) => (
          <ColumnFillControl
            key={key}
            label={ITEM_CONDITION_LABEL[key]}
            disabled={disabled}
            onFill={(value) => onFillColumn(key, value)}
          />
        ))}
      </div>
    </div>
  );
}

function ColumnFillControl({
  label,
  disabled,
  onFill,
}: {
  label: string;
  disabled: boolean;
  onFill: (value: boolean) => void;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-center text-xs font-medium">{label}</p>
      <div className="flex flex-col gap-1">
        <HoldFillButton
          label="Yes"
          disabled={disabled}
          tone="yes"
          onFill={() => onFill(true)}
        />
        <HoldFillButton
          label="No"
          disabled={disabled}
          tone="no"
          onFill={() => onFill(false)}
        />
      </div>
    </div>
  );
}

const HOLD_MS = 450;

function HoldFillButton({
  label,
  disabled,
  tone,
  onFill,
}: {
  label: string;
  disabled: boolean;
  tone: 'yes' | 'no';
  onFill: () => void;
}) {
  const handlePointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (event.button !== 0 && event.pointerType === 'mouse') return;
    const target = event.currentTarget;
    const timer = window.setTimeout(() => {
      onFill();
      target.releasePointerCapture(event.pointerId);
    }, HOLD_MS);
    const clear = () => {
      window.clearTimeout(timer);
      target.removeEventListener('pointerup', clear);
      target.removeEventListener('pointercancel', clear);
      target.removeEventListener('pointerleave', clear);
    };
    target.addEventListener('pointerup', clear);
    target.addEventListener('pointercancel', clear);
    target.addEventListener('pointerleave', clear);
  };

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      disabled={disabled}
      className={cn(
        'h-8 w-full text-xs',
        tone === 'yes' && 'hover:border-emerald-600 hover:text-emerald-700',
        tone === 'no' && 'hover:border-destructive hover:text-destructive',
      )}
      onPointerDown={handlePointerDown}
    >
      {label}
    </Button>
  );
}
