/** Demo seeds are disabled — all inspector data comes from the API. */
export function shouldShowDemoSeeds(
  _apiConnected: boolean,
  _email?: string | null,
): boolean {
  return false;
}

export function demoSeedSnapshot() {
  return {
    jobs: [],
    earnings: [],
    tribunals: [],
    messages: [],
    notifications: [],
    threadMessages: {} as Record<string, never[]>,
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
