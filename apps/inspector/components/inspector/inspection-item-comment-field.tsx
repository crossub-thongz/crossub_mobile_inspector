'use client';

import { Zap } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export const GOOD_CONDITION_COMMENT = 'Good Condition';

type InspectionItemCommentFieldProps = {
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
};

export function InspectionItemCommentField({
  value,
  disabled = false,
  onChange,
}: InspectionItemCommentFieldProps) {
  const insertGoodCondition = () => {
    const trimmed = value.trim();
    if (
      trimmed === GOOD_CONDITION_COMMENT ||
      trimmed.split('\n').some((line) => line.trim() === GOOD_CONDITION_COMMENT)
    ) {
      return;
    }
    onChange(trimmed ? `${trimmed}\n${GOOD_CONDITION_COMMENT}` : GOOD_CONDITION_COMMENT);
  };

  return (
    <div className="flex gap-2">
      <Input
        placeholder="Comment (optional)"
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-9 shrink-0 px-2.5 text-xs"
        disabled={disabled}
        onClick={insertGoodCondition}
        aria-label="Insert Good Condition"
        title="Insert Good Condition"
      >
        <Zap className="size-3.5" />
        Good Condition
      </Button>
    </div>
  );
}
