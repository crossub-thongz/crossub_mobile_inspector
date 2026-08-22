import { DoorOpen, Home, Users } from 'lucide-react';

import { INSPECTION_TYPE_LABEL, type CoreInspectionType } from '@/constants/inspection';
import type { InspectionType } from '@/lib/types';

export const INSPECT_TYPE_VISUAL: Record<
  InspectionType,
  {
    icon: typeof Home;
    time: string;
    bar: string;
    badge: string;
    iconWrap: string;
  }
> = {
  routine: {
    icon: Home,
    time: 'text-emerald-400',
    bar: 'bg-emerald-400',
    badge: 'bg-emerald-500 text-white',
    iconWrap: 'text-emerald-400',
  },
  open: {
    icon: Users,
    time: 'text-sky-400',
    bar: 'bg-sky-400',
    badge: 'bg-sky-500 text-white',
    iconWrap: 'text-sky-400',
  },
  ingoing: {
    icon: Users,
    time: 'text-sky-400',
    bar: 'bg-sky-400',
    badge: 'bg-sky-500 text-white',
    iconWrap: 'text-sky-400',
  },
  outgoing: {
    icon: DoorOpen,
    time: 'text-violet-400',
    bar: 'bg-violet-400',
    badge: 'bg-violet-500 text-white',
    iconWrap: 'text-violet-400',
  },
  tribunal: {
    icon: Home,
    time: 'text-rose-400',
    bar: 'bg-rose-400',
    badge: 'bg-rose-500 text-white',
    iconWrap: 'text-rose-400',
  },
};

export function inspectTypeLabel(type: InspectionType): string {
  return type in INSPECTION_TYPE_LABEL
    ? INSPECTION_TYPE_LABEL[type as CoreInspectionType]
    : type.toUpperCase();
}

export function formatInspectDuration(hours: number): string {
  if (!Number.isFinite(hours) || hours <= 0) return '—';
  if (hours < 1) return `${Math.round(hours * 60)} min`;
  const rounded = Number.isInteger(hours) ? String(hours) : hours.toFixed(1);
  return `${rounded} hrs`;
}

export function formatInspectTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-AU', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
    .format(date)
    .replace(/\b(am|pm)\b/gi, (part) => part.toUpperCase());
}
