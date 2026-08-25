'use client';

import Link from 'next/link';
import {
  CalendarClock,
  ChevronRight,
  CircleHelp,
  CreditCard,
  Scale,
  Settings,
  User,
  Wallet,
} from 'lucide-react';

import { InitialsAvatar } from '@/components/inspector/initials-avatar';
import { TribunalQualifiedTag } from '@/components/inspector/tribunal-qualified-tag';
import { InspectorShell } from '@/components/layout/inspector-shell';
import { useAuth } from '@/components/providers/auth-provider';
import { useInspectorData } from '@/components/providers/inspector-data-provider';
import { INSPECTOR_HOURLY_RATE_AUD } from '@/constants/inspection';
import { REGISTRATION_STATUS_LABEL } from '@/constants/inspector-registration';
import { ROUTES } from '@/constants/routes';
import { inspectorLevelAllows } from '@/lib/inspector-access-level';
import { displayName, formatCurrency, formatDate } from '@/lib/utils';

const MENU = [
  {
    href: ROUTES.PROFILE,
    icon: User,
    title: 'Professional profile',
    subtitle: 'Personal details, licence, service regions',
  },
  {
    href: ROUTES.TRIBUNAL,
    icon: Scale,
    title: 'Tribunal',
    subtitle: 'Apply for tribunal certification',
  },
  {
    href: ROUTES.WEEKLY_AVAILABILITY,
    icon: CalendarClock,
    title: 'Time Availability',
    subtitle: 'Select the times you can take jobs',
  },
  {
    href: ROUTES.EARNINGS,
    icon: CreditCard,
    title: 'Payments',
    subtitle: 'History, payouts, unclaimed payments',
  },
  {
    href: ROUTES.SETTINGS,
    icon: Settings,
    title: 'Settings',
    subtitle: 'Account, notifications, security',
  },
  {
    href: ROUTES.SETTINGS,
    icon: CircleHelp,
    title: 'Help & support',
    subtitle: 'FAQs, contact support',
  },
] as const;

export default function MorePage() {
  const { user } = useAuth();
  const { profile, registration, summary } = useInspectorData();
  const name = user ? displayName(user) : profile.name;
  const approved = registration?.registrationStatus === 'approved';
  const showTribunal = inspectorLevelAllows(profile.accessLevel, 'tribunal');
  const tribunalCertified = Boolean(
    registration?.tribunalQualified || profile.tribunalQualified,
  );
  const menu = MENU.filter((item) => item.href !== ROUTES.TRIBUNAL || showTribunal);

  return (
    <InspectorShell>
      <div className="space-y-5">
        <section className="flex items-start gap-3">
          <InitialsAvatar name={name} className="size-16 text-lg" />
          <div className="min-w-0 flex-1">
            <p className="text-foreground truncate text-xl font-semibold leading-tight">
              {name}
            </p>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              {approved ? (
                <span className="bg-primary text-primary-foreground inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium">
                  {REGISTRATION_STATUS_LABEL.approved}
                </span>
              ) : registration ? (
                <span className="border-border text-muted-foreground inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium">
                  {REGISTRATION_STATUS_LABEL[registration.registrationStatus]}
                </span>
              ) : null}
              <TribunalQualifiedTag certified={tribunalCertified} />
            </div>
            <p className="text-muted-foreground mt-2 truncate text-xs">
              {registration?.email ?? profile.email}
            </p>
            <p className="text-muted-foreground truncate text-xs">
              {registration?.mobile ?? profile.phone}
            </p>
          </div>
        </section>

        <section className="grid grid-cols-3 gap-2">
          <div className="rounded-xl border border-border bg-card p-2.5">
            <Wallet className="text-primary size-4" />
            <p className="mt-2 text-lg font-bold tabular-nums">
              {formatCurrency(summary.weeklyEarnings)}
            </p>
            <p className="text-muted-foreground mt-0.5 text-[10px] leading-snug">
              This week
            </p>
            <p className="text-muted-foreground text-[10px]">
              ${INSPECTOR_HOURLY_RATE_AUD}/hr guideline
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-2.5">
            <CalendarClock className="text-primary size-4" />
            <p className="mt-2 text-lg font-bold tabular-nums">
              {summary.completedThisWeek}
            </p>
            <p className="text-muted-foreground mt-0.5 text-[10px] leading-snug">
              Completed inspections
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-2.5">
            <Wallet className="size-4 text-amber-400" />
            <p className="mt-2 text-lg font-bold tabular-nums text-amber-400">
              {formatCurrency(summary.unclaimedEarnings)}
            </p>
            <p className="text-muted-foreground mt-0.5 text-[10px] leading-snug">
              Unclaimed payments
            </p>
          </div>
        </section>

        <nav className="divide-border divide-y rounded-2xl border border-border bg-card">
          {menu.map((item) => (
            <Link
              key={`${item.href}-${item.title}`}
              href={item.href}
              className="flex items-center gap-3 px-4 py-3.5"
            >
              <item.icon className="text-primary size-5 shrink-0" />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium">{item.title}</span>
                <span className="text-muted-foreground block text-xs">
                  {item.subtitle}
                </span>
              </span>
              <ChevronRight className="text-muted-foreground size-4 shrink-0" />
            </Link>
          ))}
        </nav>

        {registration?.submittedAt ? (
          <p className="text-muted-foreground text-center text-[11px]">
            Member since {formatDate(registration.submittedAt)}
            {registration.reviewedAt
              ? ` • Last reviewed ${formatDate(registration.reviewedAt)}`
              : null}
          </p>
        ) : null}
      </div>
    </InspectorShell>
  );
}
