import { DEMO_INSPECTOR_EMAIL } from '@/lib/local-auth';
import {
  EARNINGS,
  JOBS,
  MESSAGE_THREADS,
  NOTIFICATIONS,
  THREAD_MESSAGES,
  TRIBUNALS,
} from '@/lib/mock-data';

/** Demo seeds only for the offline demo login — never for real registered accounts. */
export function shouldShowDemoSeeds(
  apiConnected: boolean,
  email?: string | null,
): boolean {
  return !apiConnected && email === DEMO_INSPECTOR_EMAIL;
}

export function demoSeedSnapshot() {
  return {
    jobs: JOBS,
    earnings: EARNINGS,
    tribunals: TRIBUNALS,
    messages: MESSAGE_THREADS,
    notifications: NOTIFICATIONS,
    threadMessages: THREAD_MESSAGES,
  };
}

export function isDemoEarningsId(id: string): boolean {
  return id.startsWith('earn-');
}

export function isDemoTribunalId(id: string): boolean {
  return id.startsWith('trib-');
}

export function isDemoMessageId(id: string): boolean {
  return id.startsWith('msg-');
}

export function isDemoNotificationId(id: string): boolean {
  return id.startsWith('notif-');
}

export function stripDemoRows<T extends { id: string }>(
  rows: T[],
  isDemo: (id: string) => boolean,
): T[] {
  return rows.filter((row) => !isDemo(row.id));
}
