import { COOKIE_ACCESS, COOKIE_REFRESH } from '@/constants/auth';
import { Role, UserStatus } from '@/constants/roles';
import type { AuthUser } from '@/lib/auth-types';

const ACCOUNTS_KEY = 'crossub_inspector_accounts';
const SESSION_KEY = 'crossub_inspector_session';
const LOCAL_ACCESS_VALUE = 'local-inspector';

/** Seeded demo account when API is offline */
export const DEMO_INSPECTOR_EMAIL = 'demo@crossub.local';
export const DEMO_INSPECTOR_PASSWORD = 'DemoInspect123';

export interface LocalAccount {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  createdAt: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

function readAccounts(): LocalAccount[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    return raw ? (JSON.parse(raw) as LocalAccount[]) : [];
  } catch {
    return [];
  }
}

function writeAccounts(accounts: LocalAccount[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

function ensureDemoAccount(): void {
  const accounts = readAccounts();
  if (accounts.some((a) => a.email === DEMO_INSPECTOR_EMAIL)) return;
  writeAccounts([
    ...accounts,
    {
      id: 'insp-demo-001',
      email: DEMO_INSPECTOR_EMAIL,
      password: DEMO_INSPECTOR_PASSWORD,
      firstName: 'Demo',
      lastName: 'Inspector',
      createdAt: new Date().toISOString(),
    },
  ]);
}

function accountToUser(account: LocalAccount): AuthUser {
  return {
    id: account.id,
    email: account.email,
    role: Role.STAFF,
    status: UserStatus.ACTIVE,
    profileCompleted: false,
    firstName: account.firstName,
    lastName: account.lastName,
    jobTitle: 'Property Inspector',
    department: 'Inspection',
  };
}

function setAccessCookie(): void {
  if (typeof window === 'undefined') return;
  const maxAge = 60 * 60 * 24 * 30;
  document.cookie = `${COOKIE_ACCESS}=${LOCAL_ACCESS_VALUE}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

function startLocalSession(account: LocalAccount): void {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({ userId: account.id }));
  setAccessCookie();
}

export function getLocalSessionUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  ensureDemoAccount();
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const { userId } = JSON.parse(raw) as { userId: string };
    const account = readAccounts().find((a) => a.id === userId);
    return account ? accountToUser(account) : null;
  } catch {
    return null;
  }
}

export function hasLocalAccessCookie(): boolean {
  if (typeof window === 'undefined') return false;
  return document.cookie.split(';').some((c) => {
    const [name, value] = c.trim().split('=');
    return name === COOKIE_ACCESS && value === LOCAL_ACCESS_VALUE;
  });
}

export function registerLocalAccount(input: RegisterInput): AuthUser {
  ensureDemoAccount();
  const email = input.email.trim().toLowerCase();
  const accounts = readAccounts();
  if (accounts.some((a) => a.email === email)) {
    throw new Error('An account with this email already exists. Sign in instead.');
  }
  const account: LocalAccount = {
    id: `insp-${Date.now()}`,
    email,
    password: input.password,
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    createdAt: new Date().toISOString(),
  };
  writeAccounts([...accounts, account]);
  startLocalSession(account);
  return accountToUser(account);
}

export function loginLocalAccount(email: string, password: string): AuthUser | null {
  ensureDemoAccount();
  const normalized = email.trim().toLowerCase();
  const account = readAccounts().find(
    (a) => a.email === normalized && a.password === password,
  );
  if (!account) return null;
  startLocalSession(account);
  return accountToUser(account);
}

export function clearOrphanLocalAccessCookie(): void {
  if (typeof window === 'undefined') return;
  if (hasLocalAccessCookie() && !getLocalSessionUser()) {
    document.cookie = `${COOKIE_ACCESS}=; path=/; max-age=0`;
  }
}

export function clearLocalSession(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(SESSION_KEY);
  if (hasLocalAccessCookie()) {
    document.cookie = `${COOKIE_ACCESS}=; path=/; max-age=0`;
  }
  document.cookie = `${COOKIE_REFRESH}=; path=/api/auth; max-age=0`;
  document.cookie = `${COOKIE_REFRESH}=; path=/; max-age=0`;
}
