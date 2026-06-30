export const ROUTES = {
  DASHBOARD: '/dashboard',
  JOB_POOL: '/job-pool',
  INSPECTIONS: '/inspections',
  HISTORY: '/history',
  /** @deprecated Use INSPECTIONS — kept for deep links */
  JOBS: '/inspections',
  TRIBUNAL: '/tribunal',
  KEY_MANAGEMENT: '/key-management',
  EARNINGS: '/earnings',
  MESSAGES: '/messages',
  NOTIFICATIONS: '/notifications',
  PROFILE: '/profile',
  REGISTER: '/register',
  SIGNUP: '/signup',
  SETTINGS: '/settings',
  LOGIN: '/login',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
} as const;

export const PUBLIC_ROUTE_PATTERNS = [
  /^\/login\/?$/,
  /^\/signup\/?$/,
  /^\/forgot-password\/?$/,
  /^\/reset-password(\/|$)/,
];

export const isPublicRoute = (pathname: string): boolean =>
  PUBLIC_ROUTE_PATTERNS.some((rx) => rx.test(pathname));

export const jobDetail = (id: string) => `/jobs/${id}`;
export const jobHistory = (id: string) => `/jobs/${id}/history`;
export const jobKeys = (id: string, tab?: 'collect' | 'return') =>
  tab ? `/jobs/${id}/keys?tab=${tab}` : `/jobs/${id}/keys`;
export const jobWorkflow = (id: string, type: string) => `/jobs/${id}/${type}`;
export const inspectionsByType = (type: string) => `/inspections?type=${type}`;
export const tribunalDetail = (id: string) => `/tribunal/${id}`;
export const messageDetail = (id: string) => `/messages/${id}`;
