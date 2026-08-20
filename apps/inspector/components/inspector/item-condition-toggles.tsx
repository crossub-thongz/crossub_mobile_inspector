'use client';

import { useRef } from 'react';

import { Button } from '@/components/ui/button';
import {
  ITEM_CONDITION_KEYS,
  ITEM_CONDITION_LABEL,
  type ItemConditionKey,
  type ItemConditionMarks,
} from '@/lib/item-condition-marks';
import { cn } from '@/lib/utils';

const HOLD_MS = 450;

type ItemConditionTogglesProps = {
  marks: ItemConditionMarks | undefined;
  disabled?: boolean;
  onChange: (marks: ItemConditionMarks) => void;
  onFillColumn?: (key: ItemConditionKey, value: boolean) => void;
};

function markValue(
  marks: ItemConditionMarks | undefined,
  key: ItemConditionKey,
): boolean | null {
  return marks?.[key] ?? null;
}

export function ItemConditionToggles({
  marks,
  disabled = false,
  onChange,
  onFillColumn,
}: ItemConditionTogglesProps) {
  const held = useRef(false);

  const setMark = (key: ItemConditionKey, value: boolean) => {
    onChange({
      clean: marks?.clean ?? null,
      undamaged: marks?.undamaged ?? null,
      working: marks?.working ?? null,
      [key]: markValue(marks, key) === value ? null : value,
    });
  };

  const bindHold = (
    key: ItemConditionKey,
    value: boolean,
  ): Pick<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    'onPointerDown' | 'onClick'
  > => ({
    onPointerDown: (event) => {
      if (disabled || !onFillColumn) return;
      if (event.button !== 0 && event.pointerType === 'mouse') return;
      held.current = false;
      const target = event.currentTarget;
      const timer = window.setTimeout(() => {
        held.current = true;
        onFillColumn(key, value);
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
    },
    onClick: () => {
      if (held.current) {
        held.current = false;
        return;
      }
      setMark(key, value);
    },
  });

  return (
    <div className="space-y-2">
      {ITEM_CONDITION_KEYS.map((key) => {
        const current = markValue(marks, key);
        return (
          <div key={key} className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium">{ITEM_CONDITION_LABEL[key]}</p>
            <div className="flex gap-1.5">
              <Button
                type="button"
                size="sm"
                variant={current === true ? 'default' : 'outline'}
                disabled={disabled}
                className={cn('min-w-14', current === true && 'bg-emerald-600 hover:bg-emerald-600')}
                {...bindHold(key, true)}
              >
                Yes
              </Button>
              <Button
                type="button"
                size="sm"
                variant={current === false ? 'default' : 'outline'}
                disabled={disabled}
                className={cn(
                  'min-w-14',
                  current === false && 'bg-destructive text-destructive-foreground hover:bg-destructive',
                )}
                {...bindHold(key, false)}
              >
                No
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
