import type { InspectionType } from '@/lib/types';

export const POOL_TYPE_ACCENT: Record<
  InspectionType,
  {
    icon: string;
    text: string;
    border: string;
    fee: string;
  }
> = {
  routine: {
    icon: 'text-emerald-400',
    text: 'text-emerald-400',
    border: 'border-emerald-500/50 bg-emerald-500/10',
    fee: 'text-emerald-400',
  },
  open: {
    icon: 'text-sky-400',
    text: 'text-sky-400',
    border: 'border-sky-500/50 bg-sky-500/10',
    fee: 'text-sky-400',
  },
  ingoing: {
    icon: 'text-orange-400',
    text: 'text-orange-400',
    border: 'border-orange-500/50 bg-orange-500/10',
    fee: 'text-orange-400',
  },
  outgoing: {
    icon: 'text-orange-300',
    text: 'text-orange-300',
    border: 'border-orange-400/50 bg-orange-400/10',
    fee: 'text-orange-300',
  },
  tribunal: {
    icon: 'text-rose-400',
    text: 'text-rose-400',
    border: 'border-rose-500/50 bg-rose-500/10',
    fee: 'text-rose-400',
  },
};
