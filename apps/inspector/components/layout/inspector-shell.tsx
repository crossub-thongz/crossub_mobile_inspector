'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Bell,
  Briefcase,
  ClipboardCheck,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Scale,
  Wallet,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { ConnectionBanner } from '@/components/inspector/connection-banner';
import { useAuth } from '@/components/providers/auth-provider';
import { useInspectorData } from '@/components/providers/inspector-data-provider';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants/routes';
import { Role } from '@/constants/roles';
import { cn, displayName } from '@/lib/utils';

const PRIMARY_NAV = [
  { href: ROUTES.DASHBOARD, label: 'Home', icon: LayoutDashboard },
  { href: ROUTES.JOB_POOL, label: 'Pool', icon: Briefcase },
  { href: ROUTES.INSPECTIONS, label: 'Inspect', icon: ClipboardCheck },
  { href: ROUTES.TRIBUNAL, label: 'Tribunal', icon: Scale },
] as const;

const MORE_NAV = [
  { href: ROUTES.HISTORY, label: 'Job history' },
  { href: ROUTES.KEY_MANAGEMENT, label: 'Key management' },
  { href: ROUTES.EARNINGS, label: 'Earnings' },
  { href: ROUTES.REGISTER, label: 'Registration' },
  { href: ROUTES.MESSAGES, label: 'Messages' },
  { href: ROUTES.NOTIFICATIONS, label: 'Notifications' },
  { href: ROUTES.SETTINGS, label: 'Settings' },
  { href: ROUTES.PROFILE, label: 'Profile' },
] as const;

function isActive(pathname: string, href: string): boolean {
  if (href === ROUTES.DASHBOARD) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function roleLabel(role: string): string {
  if (role === Role.SUPER_ADMIN) return 'Admin';
  if (role === Role.HR) return 'HR';
  return 'Staff';
}

function userInitials(user: {
  firstName?: string | null;
  lastName?: string | null;
  email: string;
}): string {
  const first = user.firstName?.trim().charAt(0) ?? '';
  const last = user.lastName?.trim().charAt(0) ?? '';
  const initials = `${first}${last}`.toUpperCase();
  return initials || user.email.charAt(0).toUpperCase();
}

export function InspectorShell({
  children,
  title,
  backHref,
  variant = 'default',
  bare = false,
}: {
  children: React.ReactNode;
  title?: string;
  backHref?: string;
  variant?: 'default' | 'home';
  /** No app header — page supplies its own top bar (e.g. Crossub Inspection list). */
  bare?: boolean;
}) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [moreOpen, setMoreOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [headerHeight, setHeaderHeight] = useState(56);
  const { notifications, messages, poolJobs, todaysJobs } = useInspectorData();
  const unreadNotifications = notifications.filter((n) => !n.read).length;
  const unreadMessages = messages.reduce((s, m) => s + m.unread, 0);

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

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col bg-background">
      {!bare && (
      <header
        ref={headerRef}
        className={cn(
          'fixed top-0 left-1/2 z-40 w-full max-w-lg -translate-x-1/2 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80',
          isHome && 'bg-background',
        )}
      >
        <div ref={toolbarRef} className="relative">
        {isHome ? (
          <div className="flex items-center justify-between gap-2 px-4 py-3">
            {user ? (
              <Link href={ROUTES.PROFILE} className="flex min-w-0 flex-1 items-center gap-3">
                <div className="ring-primary bg-secondary flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full ring-2">
                  <span className="text-foreground text-sm font-semibold">
                    {userInitials(user)}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-foreground truncate text-base font-semibold">
                    {displayName(user)}
                  </p>
                  <span className="bg-primary/15 text-primary mt-0.5 inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium">
                    {roleLabel(user.role)}
                  </span>
                </div>
              </Link>
            ) : (
              <div className="h-12 flex-1" />
            )}
            <div className="flex shrink-0 items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="size-9"
                onClick={() => setMoreOpen((v) => !v)}
                aria-label="Menu"
              >
                <Menu className="size-5" />
              </Button>
              <button
                type="button"
                onClick={() => void logout()}
                className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 px-1 text-sm font-medium"
              >
                Log Out
                <LogOut className="size-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex h-14 items-center justify-between gap-2 px-4">
          {backHref ? (
            <Link
              href={backHref}
              className="text-primary -ml-1 text-sm font-medium"
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

        {title && !isHome && (
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
                {MORE_NAV.map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMoreOpen(false)}
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
        className="flex-1 px-4 pb-24"
        style={bare ? { paddingTop: 8 } : { paddingTop: headerHeight }}
      >
        {user && !bare && (
          <div className="mb-2">
            <ConnectionBanner />
          </div>
        )}
        {children}
      </main>

      <nav className="fixed bottom-0 left-1/2 z-50 w-full max-w-lg -translate-x-1/2 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
        <div className="flex h-16 items-stretch justify-around px-1">
          {PRIMARY_NAV.map(({ href, label, icon: Icon }) => {
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
          <Link
            href={ROUTES.EARNINGS}
            className={cn(
              'flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-1 text-[10px] font-medium transition-colors',
              isActive(pathname, ROUTES.EARNINGS)
                ? 'text-primary'
                : 'text-muted-foreground',
            )}
          >
            <Wallet
              className={cn(
                'size-5',
                isActive(pathname, ROUTES.EARNINGS) && 'stroke-[2.5]',
              )}
            />
            <span>Earnings</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
