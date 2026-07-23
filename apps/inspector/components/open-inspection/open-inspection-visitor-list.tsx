'use client';

import { Mail, Phone, User } from 'lucide-react';

import type { InspectorOpenViewingVisitor } from '@/lib/inspector-open-viewing';

export function OpenInspectionVisitorList({
  visitors,
}: {
  visitors: InspectorOpenViewingVisitor[];
}) {
  if (visitors.length === 0) {
    return (
      <p className="text-muted-foreground rounded-xl border border-dashed px-3 py-8 text-center text-xs">
        No check-ins or applications yet. Prospects who use the links will appear here.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {visitors.map((visitor) => (
        <li key={visitor.id} className="rounded-xl border bg-background px-3 py-2.5 text-xs">
          <div className="flex items-start justify-between gap-2">
            <p className="flex min-w-0 items-center gap-1.5 font-medium">
              <User className="text-muted-foreground size-3.5 shrink-0" />
              <span className="truncate">{visitor.name}</span>
            </p>
            {visitor.hasApplication ? (
              <span className="shrink-0 text-[10px] font-medium text-emerald-700 dark:text-emerald-300">
                Applied
              </span>
            ) : (
              <span className="text-muted-foreground shrink-0 text-[10px]">Checked in</span>
            )}
          </div>
          {visitor.email ? (
            <p className="text-muted-foreground mt-1 flex items-center gap-1.5 text-[11px]">
              <Mail className="size-3 shrink-0" />
              <span className="truncate">{visitor.email}</span>
            </p>
          ) : null}
          {visitor.phone ? (
            <p className="text-muted-foreground mt-0.5 flex items-center gap-1.5 text-[11px]">
              <Phone className="size-3 shrink-0" />
              {visitor.phone}
            </p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
