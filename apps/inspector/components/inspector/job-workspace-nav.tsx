'use client';

import Link from 'next/link';
import { FileText, KeyRound, LayoutGrid, Play, type LucideIcon } from 'lucide-react';

import { jobAreas, jobInspect, jobKeys } from '@/constants/routes';
import type { InspectionJob } from '@/lib/types';
import { cn } from '@/lib/utils';

type WorkspaceTab = 'details' | 'handover' | 'areas' | 'start';

export function JobWorkspaceNav({
  job,
  active,
}: {
  job: InspectionJob;
  active: WorkspaceTab;
}) {
  const items: { id: WorkspaceTab; href: string; label: string; icon: LucideIcon }[] = [
    {
      id: 'details',
      href: `/jobs/${job.id}`,
      label: 'Job Details',
      icon: FileText,
    },
    {
      id: 'handover',
      href: jobKeys(job.id),
      label: 'Handover',
      icon: KeyRound,
    },
  ];

  if (job.type !== 'open') {
    items.push({
      id: 'areas',
      href: jobAreas(job.id, job.type),
      label: 'Areas',
      icon: LayoutGrid,
    });
  }

  items.push({
    id: 'start',
    href: jobInspect(job.id, job.type),
    label: 'Start Inspection',
    icon: Play,
  });

  return (
    <nav className="border-border -mx-4 flex border-b px-1">
      {items.map(({ id, href, label, icon: Icon }) => {
        const isActive = active === id;
        return (
          <Link
            key={id}
            href={href}
            className={cn(
              'flex min-w-0 flex-1 flex-col items-center gap-1 px-1 py-2 text-[10px] font-medium',
              isActive
                ? 'text-primary border-primary border-b-2'
                : 'text-muted-foreground border-b-2 border-transparent',
            )}
          >
            <Icon className={cn('size-4', id === 'start' && isActive && 'fill-current')} />
            <span className="truncate">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
