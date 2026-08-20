'use client';

import { Pencil, Trash2 } from 'lucide-react';
import type { ReactNode } from 'react';

type EditableChecklistRowProps = {
  name: string;
  busy?: boolean;
  onRename: () => void;
  onRemove: () => void;
  children: ReactNode;
};

export function EditableChecklistRow({
  name,
  busy = false,
  onRename,
  onRemove,
  children,
}: EditableChecklistRowProps) {
  return (
    <div className="min-w-0 flex-1 space-y-3">
      <div className="flex items-start gap-2">
        <p className="min-w-0 flex-1 pt-2.5 text-sm font-medium leading-snug">{name}</p>
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
