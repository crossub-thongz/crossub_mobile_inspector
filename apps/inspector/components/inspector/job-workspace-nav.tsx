'use client';

import Link from 'next/link';
import { FileText, KeyRound, LayoutGrid, Play } from 'lucide-react';

import { jobKeys, jobWorkflow } from '@/constants/routes';
import type { InspectionJob } from '@/lib/types';
import { cn } from '@/lib/utils';

export function JobWorkspaceNav({
  job,
  active,
}: {
  job: InspectionJob;
  active: 'details' | 'handover' | 'areas' | 'start';
}) {
  const workflowHref = jobWorkflow(job.id, job.type);
  const items = [
    {
      id: 'details' as const,
      href: `/jobs/${job.id}`,
      label: 'Job Details',
      icon: FileText,
    },
    {
      id: 'handover' as const,
      href: jobKeys(job.id),
      label: 'Handover',
      icon: KeyRound,
    },
    {
      id: 'areas' as const,
      href: workflowHref,
      label: 'Areas',
      icon: LayoutGrid,
    },
    {
      id: 'start' as const,
      href: workflowHref,
      label: 'Start Inspection',
      icon: Play,
    },
  ];

  return (
    <nav className="border-border -mx-4 mb-3 flex border-b px-1">
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
