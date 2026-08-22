'use client';

import { Check, ChevronDown, ChevronUp, CircleAlert, Trash2 } from 'lucide-react';
import { useState, type ReactNode } from 'react';

import { InspectionAreaPhotosField } from '@/components/inspector/inspection-area-photos-field';
import {
  ITEM_CONDITION_KEYS,
  ITEM_CONDITION_LABEL,
  marksAreAllGood,
  marksHaveNo,
  type ItemConditionKey,
  type ItemConditionMarks,
  emptyItemMarks,
} from '@/lib/item-condition-marks';
import { cn } from '@/lib/utils';

const ISSUE_DETAIL: { key: ItemConditionKey; label: string }[] = [
  { key: 'clean', label: 'Dirty / Needs cleaning' },
  { key: 'undamaged', label: 'Damaged / Broken' },
  { key: 'working', label: 'Not working' },
];

const COMMENT_MAX = 200;

export function InspectionItemAccordion({
  name,
  marks,
  comment,
  photoUrls,
  busy,
  photoUploading,
  onRename,
  onRemove,
  onChangeMarks,
  onChangeComment,
  onAddFiles,
  onAddDataUrl,
  onAddDataUrls,
  onRemovePhoto,
  extra,
  showItemPhotos = true,
}: {
  name: string;
  marks: ItemConditionMarks | undefined;
  comment: string;
  photoUrls: string[];
  busy?: boolean;
  photoUploading?: boolean;
  onRename: () => void;
  onRemove: () => void;
  onChangeMarks: (marks: ItemConditionMarks) => void;
  onChangeComment: (comment: string) => void;
  onAddFiles?: (files: File[]) => void | Promise<void>;
  onAddDataUrl?: (dataUrl: string) => void | Promise<void>;
  onAddDataUrls?: (urls: string[]) => void | Promise<void>;
  onRemovePhoto?: (index: number) => void;
  extra?: ReactNode;
  showItemPhotos?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const current = marks ?? emptyItemMarks();
  const allGood = marksAreAllGood(current);
  const hasIssue = marksHaveNo(current);

  const toggleChip = (key: ItemConditionKey) => {
    const value = current[key];
    onChangeMarks({
      ...current,
      [key]: value === true ? false : true,
    });
  };

  return (
    <div className="min-w-0 flex-1">
      <div className="flex items-start gap-2">
        <button
          type="button"
          className="min-w-0 flex-1 text-left"
          onClick={() => setOpen((v) => !v)}
        >
          <p className="text-sm font-medium leading-snug">{name}</p>
          <p
            className={cn(
              'mt-0.5 inline-flex items-center gap-1 text-[11px] font-medium',
              hasIssue ? 'text-destructive' : allGood ? 'text-emerald-400' : 'text-muted-foreground',
            )}
          >
            {hasIssue ? (
              <>
                <CircleAlert className="size-3" />
                Issue found
              </>
            ) : allGood ? (
              <>
                <Check className="size-3" />
                All good
              </>
            ) : (
              'Not marked'
            )}
          </p>
        </button>
        <button
          type="button"
          className="text-muted-foreground hover:text-destructive shrink-0 rounded-md p-1"
          aria-label={`Remove ${name}`}
          disabled={busy}
          onClick={onRemove}
        >
          <Trash2 className="size-4" />
        </button>
        <button
          type="button"
          className="text-muted-foreground shrink-0 rounded-md p-1"
          aria-label={open ? `Collapse ${name}` : `Expand ${name}`}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
        </button>
      </div>

      {open ? (
        <div className="mt-3 space-y-3">
          <button
            type="button"
            className="text-muted-foreground text-[11px] underline"
            disabled={busy}
            onClick={onRename}
          >
            Rename item
          </button>

          <div>
            <p className="text-muted-foreground mb-1.5 text-[11px] font-medium uppercase">
              Condition
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              {ITEM_CONDITION_KEYS.map((key) => {
                const value = current[key];
                return (
                  <button
                    key={key}
                    type="button"
                    disabled={busy}
                    onClick={() => toggleChip(key)}
                    className={cn(
                      'rounded-lg px-2 py-2 text-[11px] font-semibold',
                      value === true && 'bg-emerald-600 text-white',
                      value === false && 'bg-destructive text-white',
                      value !== true && value !== false && 'bg-secondary text-muted-foreground',
                    )}
                  >
                    {ITEM_CONDITION_LABEL[key]}
                    {value === true ? ' ✓' : value === false ? ' ✕' : ''}
                  </button>
                );
              })}
            </div>
          </div>

          {hasIssue ? (
            <div>
              <p className="text-muted-foreground mb-1.5 text-[11px] font-medium uppercase">
                Details
              </p>
              <div className="space-y-1.5">
                {ISSUE_DETAIL.map((row) => (
                  <label
                    key={row.key}
                    className="flex items-center gap-2 text-sm"
                  >
                    <input
                      type="radio"
                      name={`issue-${name}`}
                      checked={current[row.key] === false}
                      disabled={busy}
                      onChange={() =>
                        onChangeMarks({
                          clean: true,
                          undamaged: true,
                          working: true,
                          [row.key]: false,
                        })
                      }
                      className="accent-destructive"
                    />
                    {row.label}
                  </label>
                ))}
              </div>
            </div>
          ) : null}

          <div>
            <p className="text-muted-foreground mb-1.5 text-[11px] font-medium uppercase">
              Comments
            </p>
            <textarea
              rows={3}
              maxLength={COMMENT_MAX}
              disabled={busy}
              placeholder="Describe the issue or leave blank if all good…"
              value={comment}
              onChange={(event) => onChangeComment(event.target.value.slice(0, COMMENT_MAX))}
              className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
            />
            <p className="text-muted-foreground mt-1 text-right text-[10px]">
              {comment.length}/{COMMENT_MAX}
            </p>
          </div>

          {extra}

          {showItemPhotos ? (
            <InspectionAreaPhotosField
              label="Item photos"
              photoUrls={photoUrls}
              uploading={photoUploading}
              disabled={busy}
              sessionKey={name}
              compact
              emptyLabel="Take close-ups of this item."
              onAddFiles={onAddFiles ?? (() => undefined)}
              onAddDataUrl={onAddDataUrl}
              onAddDataUrls={onAddDataUrls}
              onRemove={onRemovePhoto}
            />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
