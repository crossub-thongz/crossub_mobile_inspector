import { INSPECTION_PAY_LABEL } from '@/constants/inspection';
import type { InspectionType, JobPriority, JobStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

const STATUS_STYLES: Record<string, string> = {
  available: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  assigned: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  accepted: 'bg-primary/15 text-primary border-primary/30',
  on_the_way: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  arrived: 'bg-primary/15 text-primary border-primary/30',
  in_progress: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  completed: 'bg-primary/15 text-primary border-primary/30',
  declined: 'bg-destructive/15 text-destructive border-destructive/30',
  urgent: 'bg-destructive/15 text-destructive border-destructive/30',
  normal: 'bg-secondary text-muted-foreground border-border',
  open: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  ingoing: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  outgoing: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  routine: 'bg-teal-500/15 text-teal-400 border-teal-500/30',
  tribunal: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
};

export function StatusBadge({
  label,
  variant,
}: {
  label: string;
  variant: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize',
        STATUS_STYLES[variant] ?? STATUS_STYLES.normal,
      )}
    >
      {label}
    </span>
  );
}

export function JobTypeBadge({ type }: { type: InspectionType }) {
  return (
    <StatusBadge label={INSPECTION_PAY_LABEL[type]} variant={type} />
  );
}

export function JobStatusBadge({ status }: { status: JobStatus }) {
  return (
    <StatusBadge
      label={status.replace(/_/g, ' ')}
      variant={status}
    />
  );
}

export function PriorityBadge({ priority }: { priority: JobPriority }) {
  return <StatusBadge label={priority} variant={priority} />;
}
