'use client';

import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  CANCEL_TASK_MODE_LABEL,
  CANCEL_TASK_MODES,
  EMERGENCY_CANCEL_BONUS_AUD,
  MIN_CANCEL_REASON_LENGTH,
  type CancelTaskMode,
} from '@/constants/job-cancellation';
import { emergencyCancelBonus } from '@/lib/job-cancellation';
import type { InspectionJob } from '@/lib/types';
import { cn } from '@/lib/utils';

export function CancelTaskDialog({
  job,
  open,
  onClose,
  onConfirm,
}: {
  job: InspectionJob;
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string, mode: CancelTaskMode) => void;
}) {
  const [reason, setReason] = useState('');
  const [mode, setMode] = useState<CancelTaskMode>(CANCEL_TASK_MODES.FLAG_ADMIN);
  const bonus = emergencyCancelBonus(job);
  const reasonOk = reason.trim().length >= MIN_CANCEL_REASON_LENGTH;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 p-4 sm:items-center">
      <div
        className="border-border bg-card w-full max-w-md rounded-2xl border p-4 shadow-xl"
        role="dialog"
        aria-labelledby="cancel-task-title"
      >
        <h2 id="cancel-task-title" className="text-foreground text-base font-semibold">
          Cancel task
        </h2>
        <p className="text-muted-foreground mt-1 text-xs">
          A reason is required. Ops will be notified as a critical alert.
        </p>

        {bonus > 0 && (
          <p className="mt-3 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-400">
            <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
            Emergency task — an additional ${EMERGENCY_CANCEL_BONUS_AUD} AUD will be
            added to this job&apos;s payout record.
          </p>
        )}

        <div className="mt-4 space-y-2">
          <Label htmlFor="cancel-reason">Reason for cancellation</Label>
          <textarea
            id="cancel-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Describe why this task cannot be completed (min. 10 characters)"
            className="border-input bg-background min-h-[88px] w-full rounded-lg border px-3 py-2 text-sm"
          />
          <p className="text-muted-foreground text-[10px]">
            {reason.trim().length}/{MIN_CANCEL_REASON_LENGTH} characters minimum
          </p>
        </div>

        <div className="mt-4 space-y-2">
          <p className="text-muted-foreground text-[10px] font-medium uppercase tracking-wide">
            What should happen next?
          </p>
          {(Object.keys(CANCEL_TASK_MODE_LABEL) as CancelTaskMode[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setMode(key)}
              className={cn(
                'w-full rounded-lg border px-3 py-2.5 text-left text-sm transition',
                mode === key
                  ? 'border-primary bg-primary/10 text-foreground'
                  : 'border-border text-muted-foreground hover:border-primary/30',
              )}
            >
              {CANCEL_TASK_MODE_LABEL[key]}
            </button>
          ))}
        </div>

        <div className="mt-4 flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Keep task
          </Button>
          <Button
            variant="destructive"
            className="flex-1"
            disabled={!reasonOk}
            onClick={() => {
              onConfirm(reason.trim(), mode);
              setReason('');
              onClose();
            }}
          >
            Confirm cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
