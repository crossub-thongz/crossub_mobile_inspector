'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ArrowLeft,
  Bell,
  Briefcase,
  ClipboardCheck,
  Ellipsis,
  LayoutDashboard,
  Menu,
  MessageSquare,
  Scale,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { AvailabilityBubble } from '@/components/inspector/availability-bubble';
import { ConnectionBanner } from '@/components/inspector/connection-banner';
import { useAuth } from '@/components/providers/auth-provider';
import { useInspectorData } from '@/components/providers/inspector-data-provider';
import { Button } from '@/components/ui/button';
import { ROUTES, isPublicRoute } from '@/constants/routes';
import { Role } from '@/constants/roles';
import { inspectorLevelAllows } from '@/lib/inspector-access-level';
import { cn, displayName, personInitials } from '@/lib/utils';

const PRIMARY_NAV = [
  { href: ROUTES.DASHBOARD, label: 'Home', icon: LayoutDashboard },
  { href: ROUTES.JOB_POOL, label: 'Pool', icon: Briefcase },
  { href: ROUTES.INSPECTIONS, label: 'Inspect', icon: ClipboardCheck },
  { href: ROUTES.TRIBUNAL, label: 'Tribunal', icon: Scale },
  { href: ROUTES.MORE, label: 'More', icon: Ellipsis },
] as const;

const MORE_NAV_BASE = [
  { href: ROUTES.OPEN_BATCH, label: 'Open task pool', need: 'open' as const },
  { href: ROUTES.HISTORY, label: 'Job history', need: null },
  { href: ROUTES.EARNINGS, label: 'Earnings', need: null },
  { href: ROUTES.REGISTER, label: 'Registration', need: null },
  { href: ROUTES.MESSAGES, label: 'Messages', need: null },
  { href: ROUTES.NOTIFICATIONS, label: 'Notifications', need: null },
  { href: ROUTES.SETTINGS, label: 'Settings', need: null },
  { href: ROUTES.PROFILE, label: 'Profile', need: null },
] as const;

function isActive(pathname: string, href: string): boolean {
  if (href === ROUTES.DASHBOARD) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** In-progress field workflows — soft Next.js nav often stalls under Receiving polls. */
function isInspectionWorkflowPath(pathname: string): boolean {
  return /^\/jobs\/[^/]+\/(ingoing|routine|outgoing|open)\/?$/.test(pathname);
}

function navigateFromWorkflow(href: string) {
  window.location.assign(href);
}

function roleLabel(role: string): string {
  if (role === Role.SUPER_ADMIN) return 'Admin';
  if (role === Role.HR) return 'HR';
  return 'Staff';
}

function greetingForHour(date = new Date()): string {
  const hour = date.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

const HOME_DATE_FMT = new Intl.DateTimeFormat('en-AU', {
  weekday: 'long',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

export function InspectorShell({
  children,
  title,
  backHref,
  variant = 'default',
  bare = false,
  hideAvailability = false,
}: {
  children: React.ReactNode;
  title?: string;
  backHref?: string;
  variant?: 'default' | 'home' | 'workspace';
  /** No app header — page supplies its own top bar (e.g. Crossub Inspection list). */
  bare?: boolean;
  /** Hide Messages / Receiving FABs so a sticky inspect footer can sit above the tab bar. */
  hideAvailability?: boolean;
}) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [moreOpen, setMoreOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [headerHeight, setHeaderHeight] = useState(56);
  const { notifications, messages, poolJobs, todaysJobs, profile } = useInspectorData();
  const showOpen = inspectorLevelAllows(profile.accessLevel, 'open');
  const primaryNav = PRIMARY_NAV;
  const moreNav = MORE_NAV_BASE.filter(
    (item) => item.need !== 'open' || showOpen,
  );
  const isMessageThread = /^\/messages\/[^/]+\/?$/.test(pathname);
  const showAvailabilityBubble =
    Boolean(user) &&
    !isPublicRoute(pathname) &&
    !isMessageThread &&
    !hideAvailability;
  const hardLeaveFromWorkflow = isInspectionWorkflowPath(pathname);
  const unreadNotifications = notifications.filter((n) => !n.read).length;
  const unreadMessages = messages.reduce((s, m) => s + m.unread, 0);
  const homeName = user
    ? [user.firstName, user.lastName].filter(Boolean).join(' ').trim() ||
      profile.name ||
      displayName(user)
    : '';

  useEffect(() => {
    if (bare) {
      setHeaderHeight(0);
      return;
    }
    const el = toolbarRef.current;
    if (!el) return;

    const updateHeight = () => setHeaderHeight(el.offsetHeight);
    updateHeight();

    const observer = new ResizeObserver(updateHeight);
    observer.observe(el);
    return () => observer.disconnect();
  }, [title, variant, bare]);

  useEffect(() => {
    if (!moreOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMoreOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [moreOpen]);

  const isHome = variant === 'home';
  const isWorkspace = variant === 'workspace';

  return (
    <div
      className={cn(
        'mx-auto flex max-w-lg flex-col bg-background',
        isMessageThread ? 'h-dvh overflow-hidden' : 'min-h-screen',
      )}
      style={
        {
          '--inspector-header-height': `${headerHeight}px`,
        } as React.CSSProperties
      }
    >
      {!bare && (
      <header
        ref={headerRef}
        className={cn(
          'fixed top-0 left-1/2 z-40 w-full max-w-lg -translate-x-1/2 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 pt-[env(safe-area-inset-top,0px)]',
          isHome && 'bg-background',
        )}
      >
        <div ref={toolbarRef} className="relative">
        {isHome ? (
          <div className="flex items-start justify-between gap-3 px-4 pb-3 pt-3">
            {user ? (
              <Link href={ROUTES.PROFILE} className="flex min-w-0 flex-1 items-start gap-3">
                <div className="flex w-12 shrink-0 flex-col items-center gap-1">
                  <div className="bg-secondary ring-primary/80 flex size-12 items-center justify-center overflow-hidden rounded-full ring-2">
                    <span className="text-primary text-sm font-bold tracking-wide">
                      {personInitials({
                        firstName: user.firstName,
                        lastName: user.lastName,
                        fullName: profile.name,
                        email: user.email,
                      })}
                    </span>
                  </div>
                  <span className="border-primary text-primary inline-flex rounded-full border px-1.5 py-px text-[10px] font-medium leading-tight">
                    {roleLabel(user.role)}
                  </span>
                </div>
                <div className="min-w-0 pt-0.5">
                  <p className="text-foreground truncate text-lg font-semibold leading-tight">
                    {greetingForHour()}, {homeName}
                  </p>
                  <p className="text-muted-foreground mt-1 text-sm">
                    {HOME_DATE_FMT.format(new Date())}
                  </p>
                </div>
              </Link>
            ) : (
              <div className="h-12 flex-1" />
            )}
            <div className="flex shrink-0 items-center gap-0.5 pt-1">
              <Link
                href={ROUTES.NOTIFICATIONS}
                className="relative flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground"
                aria-label="Notifications"
              >
                <Bell className="size-5" />
                {unreadNotifications > 0 && (
                  <span className="bg-destructive absolute top-1.5 right-1.5 size-2 rounded-full" />
                )}
              </Link>
              <Button
                variant="ghost"
                size="icon"
                className="size-9"
                onClick={() => setMoreOpen((v) => !v)}
                aria-label="Menu"
              >
                <Menu className="size-5" />
              </Button>
            </div>
          </div>
        ) : isWorkspace ? (
          <div className="relative flex h-14 items-center gap-1 px-3 pt-1">
            {backHref ? (
              <Link
                href={backHref}
                className="text-foreground flex size-9 shrink-0 items-center justify-center"
                aria-label="Back"
                onClick={(event) => {
                  if (!hardLeaveFromWorkflow) return;
                  event.preventDefault();
                  navigateFromWorkflow(backHref);
                }}
              >
                <ArrowLeft className="size-5" />
              </Link>
            ) : (
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <ClipboardCheck className="size-4" />
              </div>
            )}
            <h1
              className={cn(
                'min-w-0 flex-1 truncate text-base font-semibold',
                backHref && 'pointer-events-none absolute inset-x-12 text-center',
              )}
            >
              {title}
            </h1>
            <div className="ml-auto flex shrink-0 items-center">
              <Link
                href={ROUTES.MESSAGES}
                className="relative flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground"
                aria-label="Messages"
                onClick={(event) => {
                  if (!hardLeaveFromWorkflow) return;
                  event.preventDefault();
                  navigateFromWorkflow(ROUTES.MESSAGES);
                }}
              >
                <MessageSquare className="size-5" />
                {unreadMessages > 0 && (
                  <span className="bg-destructive absolute top-1 right-1 flex size-4 items-center justify-center rounded-full text-[9px] text-white">
                    {unreadMessages}
                  </span>
                )}
              </Link>
              <Link
                href={ROUTES.NOTIFICATIONS}
                className="relative flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground"
                aria-label="Notifications"
                onClick={(event) => {
                  if (!hardLeaveFromWorkflow) return;
                  event.preventDefault();
                  navigateFromWorkflow(ROUTES.NOTIFICATIONS);
                }}
              >
                <Bell className="size-5" />
                {unreadNotifications > 0 && (
                  <span className="bg-destructive absolute top-1 right-1 size-2 rounded-full" />
                )}
              </Link>
              <Button
                variant="ghost"
                size="icon"
                className="size-9"
                onClick={() => setMoreOpen((v) => !v)}
              >
                <Menu className="size-5" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex h-14 items-center justify-between gap-2 px-4 pt-1">
          {backHref ? (
            <Link
              href={backHref}
              className="text-primary -ml-1 text-sm font-medium"
              onClick={(event) => {
                if (!hardLeaveFromWorkflow) return;
                event.preventDefault();
                navigateFromWorkflow(backHref);
              }}
            >
              ← Back
            </Link>
          ) : (
            <Link href={ROUTES.DASHBOARD} className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <ClipboardCheck className="size-4" />
              </div>
              <span className="text-sm font-semibold">CROSSUB Inspector</span>
            </Link>
          )}

          <div className="flex items-center gap-1">
            <Link
              href={ROUTES.MESSAGES}
              className="relative flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground"
              aria-label="Messages"
              onClick={(event) => {
                if (!hardLeaveFromWorkflow) return;
                event.preventDefault();
                navigateFromWorkflow(ROUTES.MESSAGES);
              }}
            >
              <MessageSquare className="size-5" />
              {unreadMessages > 0 && (
                <span className="bg-destructive absolute top-1 right-1 flex size-4 items-center justify-center rounded-full text-[9px] text-white">
                  {unreadMessages}
                </span>
              )}
            </Link>
            <Link
              href={ROUTES.NOTIFICATIONS}
              className="relative flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground"
              aria-label="Notifications"
              onClick={(event) => {
                if (!hardLeaveFromWorkflow) return;
                event.preventDefault();
                navigateFromWorkflow(ROUTES.NOTIFICATIONS);
              }}
            >
              <Bell className="size-5" />
              {unreadNotifications > 0 && (
                <span className="bg-destructive absolute top-1 right-1 size-2 rounded-full" />
              )}
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="size-9"
              onClick={() => setMoreOpen((v) => !v)}
            >
              <Menu className="size-5" />
            </Button>
          </div>
        </div>
        )}

        {title && !isHome && !isWorkspace && (
          <div className="border-t border-border px-4 py-1.5">
            <h1 className="truncate text-base font-semibold">{title}</h1>
            {user && (
              <p className="text-muted-foreground truncate text-xs">
                {displayName(user)}
              </p>
            )}
          </div>
        )}

        {moreOpen && (
          <>
            <button
              type="button"
              aria-label="Close menu"
              className="fixed inset-0 z-40 bg-black/50"
              onClick={() => setMoreOpen(false)}
            />
            <div className="border-border bg-card absolute top-full right-0 left-0 z-50 max-h-[min(70vh,24rem)] overflow-y-auto border-t px-4 py-3 shadow-lg">
              <p className="text-muted-foreground mb-2 text-xs font-medium uppercase">
                More
              </p>
              <div className="flex flex-col gap-1">
                {moreNav.map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={(event) => {
                      setMoreOpen(false);
                      if (!hardLeaveFromWorkflow) return;
                      event.preventDefault();
                      navigateFromWorkflow(href);
                    }}
                    className="rounded-lg px-3 py-2.5 text-sm hover:bg-secondary"
                  >
                    {label}
                  </Link>
                ))}
                <button
                  type="button"
                  onClick={() => void logout()}
                  className="rounded-lg px-3 py-2.5 text-left text-sm text-destructive hover:bg-destructive/10"
                >
                  Sign out
                </button>
              </div>
            </div>
          </>
        )}
        </div>
      </header>
      )}

      <main
        className={cn(
          'flex-1 px-4',
          isMessageThread
            ? 'flex min-h-0 flex-col pb-20'
            : // Messages + Receiving FABs float over the last ~200px above the nav.
              showAvailabilityBubble
              ? 'pb-52'
              : hideAvailability
                ? 'pb-40'
                : 'pb-24',
        )}
        style={bare ? { paddingTop: 8 } : { paddingTop: headerHeight }}
      >
        {user && !bare && !isMessageThread && (
          <div className="mb-2">
            <ConnectionBanner />
          </div>
        )}
        {isMessageThread ? (
          <div className="flex min-h-0 flex-1 flex-col">{children}</div>
        ) : (
          children
        )}
      </main>

      <nav className="fixed bottom-0 left-1/2 z-[60] w-full max-w-lg -translate-x-1/2 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
        <div className="flex h-16 items-stretch justify-around px-1">
          {primaryNav.map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href);
            const badge =
              href === ROUTES.JOB_POOL
                ? poolJobs.length
                : href === ROUTES.INSPECTIONS
                  ? todaysJobs.length
                  : 0;
            return (
              <Link
                key={href}
                href={href}
                onClick={(event) => {
                  if (!hardLeaveFromWorkflow) return;
                  event.preventDefault();
                  navigateFromWorkflow(href);
                }}
                className={cn(
                  'relative flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-1 text-[10px] font-medium transition-colors',
                  active ? 'text-primary' : 'text-muted-foreground',
                )}
              >
                <Icon className={cn('size-5', active && 'stroke-[2.5]')} />
                <span className="truncate">{label}</span>
                {badge > 0 && (
                  <span className="bg-destructive absolute top-2 right-2 flex size-4 items-center justify-center rounded-full text-[9px] text-white">
                    {badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {showAvailabilityBubble ? <AvailabilityBubble /> : null}
    </div>
  );
}
