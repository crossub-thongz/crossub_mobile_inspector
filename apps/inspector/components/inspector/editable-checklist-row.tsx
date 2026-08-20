'use client';

import { ChevronDown, ChevronUp, Pencil, Trash2 } from 'lucide-react';
import type { ReactNode } from 'react';

type EditableChecklistRowProps = {
  name: string;
  index: number;
  total: number;
  busy?: boolean;
  onMove: (from: number, to: number) => void;
  onRename: () => void;
  onRemove: () => void;
  children: ReactNode;
};

export function EditableChecklistRow({
  name,
  index,
  total,
  busy = false,
  onMove,
  onRename,
  onRemove,
  children,
}: EditableChecklistRowProps) {
  return (
    <div className="space-y-3 rounded-lg border border-border p-3">
      <div className="flex items-start gap-2">
        <div className="flex shrink-0 flex-col">
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground rounded-md p-1 disabled:opacity-30"
            aria-label={`Move ${name} up`}
            disabled={busy || index === 0}
            onClick={() => onMove(index, index - 1)}
          >
            <ChevronUp className="size-4" />
          </button>
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground rounded-md p-1 disabled:opacity-30"
            aria-label={`Move ${name} down`}
            disabled={busy || index === total - 1}
            onClick={() => onMove(index, index + 1)}
          >
            <ChevronDown className="size-4" />
          </button>
        </div>
        <p className="min-w-0 flex-1 pt-1 text-sm font-medium leading-snug">{name}</p>
        <button
          type="button"
          className="text-muted-foreground hover:text-foreground shrink-0 rounded-md p-1"
          aria-label={`Rename ${name}`}
          disabled={busy}
          onClick={onRename}
        >
          <Pencil className="size-4" />
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
      </div>
      {children}
    </div>
  );
}
