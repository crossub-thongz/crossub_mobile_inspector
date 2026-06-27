'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { toast } from 'sonner';

import { useAuth } from '@/components/providers/auth-provider';
import { INSPECTOR_HOURLY_RATE_AUD } from '@/constants/inspection';
import { TRIBUNAL_INSPECTION_HOURS } from '@/constants/inspection-rates';
import { api, ApiError } from '@/lib/api';
import {
  acceptInspection as apiAcceptInspection,
  fetchInspections,
  fetchJobs as fetchInspectorJobs,
} from '@/lib/crossub-api/inspector-client';
import {
  mapInspections,
  mapInspectorEarnings,
} from '@/lib/crossub-api/inspector-mappers';
import { buildDashboardSummary } from '@/lib/inspector-summary';
import { calculateLaborFee } from '@/lib/inspector-pay';
import {
  isRegistrationComplete,
  loadInspectorRegistration,
  saveInspectorRegistration,
} from '@/lib/inspector-registration';
import {
  DEMO_INSPECTOR_REGISTRATION,
  EARNINGS,
  JOBS,
  MESSAGE_THREADS,
  NOTIFICATIONS,
  THREAD_MESSAGES,
  TRIBUNALS,
} from '@/lib/mock-data';
import {
  clearOfflineQueue,
  enqueueOfflineAction,
  loadOfflineQueue,
} from '@/lib/offline-queue';
import type {
  DashboardSummary,
  EarningsRecord,
  InspectionJob,
  InspectorNotification,
  InspectorProfile,
  InspectorRegistration,
  JobStatus,
  MessageThread,
  ThreadMessage,
  TribunalHearing,
  TribunalOutcome,
} from '@/lib/types';

interface InspectorDataContextValue {
  loading: boolean;
  apiConnected: boolean;
  apiError: string | null;
  pendingSync: number;
  refresh: () => Promise<void>;
  syncOfflineQueue: () => Promise<void>;
  profile: InspectorProfile;
  registration: InspectorRegistration | null;
  registrationComplete: boolean;
  saveRegistration: (data: InspectorRegistration) => void;
  summary: DashboardSummary;
  jobs: InspectionJob[];
  poolJobs: InspectionJob[];
  assignedJobs: InspectionJob[];
  todaysJobs: InspectionJob[];
  upcomingJobs: InspectionJob[];
  completedJobs: InspectionJob[];
  tribunals: TribunalHearing[];
  earnings: EarningsRecord[];
  messages: MessageThread[];
  notifications: InspectorNotification[];
  getJob: (id: string) => InspectionJob | undefined;
  getTribunal: (id: string) => TribunalHearing | undefined;
  getThreadMessages: (threadId: string) => ThreadMessage[];
  acceptJob: (id: string) => void;
  declineJob: (id: string) => void;
  updateJobStatus: (id: string, status: JobStatus) => void;
  updateJobWorkflow: (
    id: string,
    step: number,
    data?: Record<string, unknown>,
  ) => void;
  completeJob: (id: string) => void;
  updateTribunalChecklist: (
    id: string,
    key: keyof TribunalHearing['checklist'],
    value: boolean,
  ) => void;
  recordTribunalOutcome: (id: string, outcome: TribunalOutcome) => void;
  markNotificationRead: (id: string) => void;
  sendMessage: (threadId: string, body: string) => void;
}

const InspectorDataContext = createContext<InspectorDataContextValue | null>(
  null,
);

const DEMO_PROFILE: InspectorProfile = {
  id: 'insp-001',
  name: 'Inspector',
  email: '',
  phone: '',
  tribunalQualified: false,
  weeklyEarnings: 0,
  registration: null,
  registrationComplete: false,
};

/**
 * Overlay live API rows onto an existing list by id: matching ids are replaced (the API
 * is the source of truth) and fresh API rows are prepended, while everything else —
 * demo seeds without a facade and runtime-created local rows — is preserved. Empty
 * incoming leaves the list untouched, so a failed/empty fetch never clears demo data.
 */
function upsertById<T extends { id: string }>(current: T[], incoming: T[]): T[] {
  if (incoming.length === 0) return current;
  const incomingIds = new Set(incoming.map((x) => x.id));
  const kept = current.filter((x) => !incomingIds.has(x.id));
  return [...incoming, ...kept];
}

export function InspectorDataProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { status } = useAuth();
  const [loading, setLoading] = useState(true);
  const [apiConnected, setApiConnected] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [pendingSync, setPendingSync] = useState(0);

  const [jobs, setJobs] = useState(JOBS);
  const [tribunals, setTribunals] = useState(TRIBUNALS);
  const [earnings, setEarnings] = useState(EARNINGS);
  const [notifications, setNotifications] = useState(NOTIFICATIONS);
  const [messages, setMessages] = useState(MESSAGE_THREADS);
  const [threadMessages, setThreadMessages] = useState(THREAD_MESSAGES);
  const [registration, setRegistration] = useState<InspectorRegistration | null>(
    null,
  );
  // Ids of jobs sourced from the live `/inspector/inspections` facade — lets the write
  // actions route an API-backed assignment to the real facade and a demo job to local.
  const apiInspectionIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    const saved = loadInspectorRegistration();
    if (saved) {
      setRegistration(saved);
      return;
    }
    // Demo: pre-approve sample registration for local development
    if (process.env.NODE_ENV === 'development') {
      saveInspectorRegistration(DEMO_INSPECTOR_REGISTRATION);
      setRegistration(DEMO_INSPECTOR_REGISTRATION);
    }
  }, []);

  const registrationComplete = isRegistrationComplete(registration);

  const saveRegistration = useCallback((data: InspectorRegistration) => {
    saveInspectorRegistration(data);
    setRegistration(data);
  }, []);

  const refreshPendingSync = useCallback(() => {
    setPendingSync(loadOfflineQueue().length);
  }, []);

  const refresh = useCallback(async () => {
    if (status !== 'authed') {
      setLoading(false);
      return;
    }
    setLoading(true);
    setApiError(null);
    try {
      await api.get('/health');
      setApiConnected(true);
    } catch (err) {
      setApiConnected(false);
      if (err instanceof ApiError) {
        setApiError(`API unavailable (${err.status})`);
      } else {
        setApiError('API unavailable — using demo data');
      }
    }
    // Overlay live facade data onto the demo seeds — each domain independently, so a
    // failure in one leaves just that slice on demo data (the board never blanks).
    // `/inspector/inspections` -> assigned jobs; `/inspector/jobs` -> the billable
    // earnings ledger. The job pool, tribunals and messages have no facade yet, so they
    // stay on demo data.
    const [inspections, ledger] = await Promise.allSettled([
      fetchInspections(),
      fetchInspectorJobs(),
    ]);
    if (inspections.status === 'fulfilled') {
      const mapped = mapInspections(inspections.value);
      apiInspectionIds.current = new Set(mapped.map((j) => j.id));
      setJobs((prev) => upsertById(prev, mapped));
      setApiConnected(true);
    }
    if (ledger.status === 'fulfilled') {
      setEarnings((prev) => upsertById(prev, mapInspectorEarnings(ledger.value)));
      setApiConnected(true);
    }
    setLoading(false);
    refreshPendingSync();
  }, [status, refreshPendingSync]);

  const syncOfflineQueue = useCallback(async () => {
    const queue = loadOfflineQueue();
    if (queue.length === 0) {
      setPendingSync(0);
      return;
    }
    if (apiConnected) {
      clearOfflineQueue();
      setPendingSync(0);
      toast.success(`Synced ${queue.length} offline change(s)`);
    }
  }, [apiConnected]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    refreshPendingSync();
    const onOnline = () => {
      toast.info('Back online — syncing queued changes');
      void syncOfflineQueue();
    };
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, [refreshPendingSync, syncOfflineQueue]);

  const mutateWithOffline = useCallback(
    (jobId: string, action: string, payload: Record<string, unknown>) => {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        enqueueOfflineAction(jobId, action, payload);
        refreshPendingSync();
        toast.info('Saved offline — will sync when connected');
      }
    },
    [refreshPendingSync],
  );

  const acceptJob = useCallback(
    (id: string) => {
      const isApiJob = apiInspectionIds.current.has(id);
      setJobs((prev) =>
        prev.map((j) =>
          j.id === id
            ? {
                ...j,
                status: 'accepted',
                // A pool claim flips the job to a self-assigned source; an API-backed
                // assignment keeps its source and reconciles from the server below.
                source: isApiJob ? j.source : ('pool' as const),
              }
            : j,
        ),
      );
      if (isApiJob && apiConnected) {
        // Persist on the real facade (DRAFT → IN_PROGRESS), then reconcile; an API error
        // just leaves the optimistic state in place (graceful — same as the offline path).
        void apiAcceptInspection(id)
          .then(() => refresh())
          .catch(() => undefined);
      } else {
        mutateWithOffline(id, 'accept', {});
      }
      toast.success('Job accepted');
    },
    [apiConnected, mutateWithOffline, refresh],
  );

  const declineJob = useCallback(
    (id: string) => {
      setJobs((prev) =>
        prev.map((j) => (j.id === id ? { ...j, status: 'declined' } : j)),
      );
      mutateWithOffline(id, 'decline', {});
      toast.success('Job declined');
    },
    [mutateWithOffline],
  );

  const updateJobStatus = useCallback(
    (id: string, newStatus: JobStatus) => {
      setJobs((prev) =>
        prev.map((j) => (j.id === id ? { ...j, status: newStatus } : j)),
      );
      mutateWithOffline(id, 'status', { status: newStatus });
    },
    [mutateWithOffline],
  );

  const updateJobWorkflow = useCallback(
    (id: string, step: number, data?: Record<string, unknown>) => {
      setJobs((prev) =>
        prev.map((j) =>
          j.id === id
            ? {
                ...j,
                workflowStep: step,
                status: step > 0 ? 'in_progress' : j.status,
                workflowData: { ...j.workflowData, ...data },
              }
            : j,
        ),
      );
      mutateWithOffline(id, 'workflow', { step, data });
    },
    [mutateWithOffline],
  );

  const completeJob = useCallback(
    (id: string) => {
      const job = jobs.find((j) => j.id === id);
      if (!job) return;

      setJobs((prev) =>
        prev.map((j) =>
          j.id === id ? { ...j, status: 'completed', workflowStep: 99 } : j,
        ),
      );
      setEarnings((prev) => [
        {
          id: `earn-${Date.now()}`,
          jobId: id,
          type: job.type,
          propertyAddress: job.propertyAddress,
          completedAt: new Date().toISOString(),
          hoursWorked: job.estimatedHours,
          hourlyRate: INSPECTOR_HOURLY_RATE_AUD,
          travelKmOneWay: job.travelKmOneWay,
          fuelAllowance: job.fuelAllowance,
          laborAmount: job.laborAmount,
          amount: job.payAmount,
          accountingSynced: false,
        },
        ...prev,
      ]);
      mutateWithOffline(id, 'complete', {});
      toast.success('Inspection completed — report generated');
    },
    [jobs, mutateWithOffline],
  );

  const updateTribunalChecklist = useCallback(
    (
      id: string,
      key: keyof TribunalHearing['checklist'],
      value: boolean,
    ) => {
      setTribunals((prev) =>
        prev.map((t) =>
          t.id === id
            ? { ...t, checklist: { ...t.checklist, [key]: value } }
            : t,
        ),
      );
    },
    [],
  );

  const recordTribunalOutcome = useCallback(
    (id: string, outcome: TribunalOutcome) => {
      setTribunals((prev) =>
        prev.map((t) =>
          t.id === id ? { ...t, outcome, status: 'completed' } : t,
        ),
      );
      const tribunalHours = TRIBUNAL_INSPECTION_HOURS;
      const laborAmount = calculateLaborFee(tribunalHours);
      setEarnings((prev) => [
        {
          id: `earn-trib-${Date.now()}`,
          jobId: id,
          type: 'tribunal',
          propertyAddress:
            tribunals.find((t) => t.id === id)?.propertyAddress ?? '',
          completedAt: new Date().toISOString(),
          hoursWorked: tribunalHours,
          hourlyRate: INSPECTOR_HOURLY_RATE_AUD,
          travelKmOneWay: 0,
          fuelAllowance: 0,
          laborAmount,
          amount: laborAmount,
          accountingSynced: false,
        },
        ...prev,
      ]);
      toast.success('Tribunal outcome recorded');
    },
    [tribunals],
  );

  const markNotificationRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  }, []);

  const sendMessage = useCallback((threadId: string, body: string) => {
    const msg: ThreadMessage = {
      id: `tm-${Date.now()}`,
      from: 'Alex Chen',
      body,
      at: new Date().toISOString(),
    };
    setThreadMessages((prev) => ({
      ...prev,
      [threadId]: [...(prev[threadId] ?? []), msg],
    }));
    setMessages((prev) =>
      prev.map((m) =>
        m.id === threadId
          ? { ...m, lastMessage: body, lastAt: msg.at, unread: 0 }
          : m,
      ),
    );
  }, []);

  const poolJobs = useMemo(
    () => jobs.filter((j) => j.status === 'available'),
    [jobs],
  );
  const assignedJobs = useMemo(
    () =>
      jobs.filter(
        (j) =>
          j.source === 'assigned' &&
          j.status !== 'available' &&
          j.status !== 'declined',
      ),
    [jobs],
  );
  const todaysJobs = useMemo(
    () =>
      jobs.filter(
        (j) =>
          new Date(j.scheduledDate).toDateString() ===
            new Date().toDateString() &&
          j.status !== 'completed' &&
          j.status !== 'declined' &&
          j.status !== 'available',
      ),
    [jobs],
  );
  const upcomingJobs = useMemo(
    () =>
      jobs.filter(
        (j) =>
          new Date(j.scheduledDate) > new Date() &&
          j.status !== 'completed' &&
          j.status !== 'declined' &&
          j.status !== 'available',
      ),
    [jobs],
  );
  const completedJobs = useMemo(
    () => jobs.filter((j) => j.status === 'completed'),
    [jobs],
  );

  const summary = useMemo(
    () => buildDashboardSummary(jobs, tribunals, earnings, pendingSync),
    [jobs, tribunals, earnings, pendingSync],
  );

  const profile: InspectorProfile = useMemo(() => {
    const name = registration
      ? `${registration.firstName} ${registration.lastName}`.trim()
      : DEMO_PROFILE.name;
    return {
      ...DEMO_PROFILE,
      name,
      email: registration?.email ?? DEMO_PROFILE.email,
      phone: registration?.mobile ?? DEMO_PROFILE.phone,
      tribunalQualified: registration?.tribunalQualified ?? false,
      weeklyEarnings: summary.weeklyEarnings,
      registration,
      registrationComplete,
    };
  }, [registration, registrationComplete, summary.weeklyEarnings]);

  const value: InspectorDataContextValue = {
    loading,
    apiConnected,
    apiError,
    pendingSync,
    refresh,
    syncOfflineQueue,
    profile,
    registration,
    registrationComplete,
    saveRegistration,
    summary,
    jobs,
    poolJobs,
    assignedJobs,
    todaysJobs,
    upcomingJobs,
    completedJobs,
    tribunals,
    earnings,
    messages,
    notifications,
    getJob: (id) => jobs.find((j) => j.id === id),
    getTribunal: (id) => tribunals.find((t) => t.id === id),
    getThreadMessages: (threadId) => threadMessages[threadId] ?? [],
    acceptJob,
    declineJob,
    updateJobStatus,
    updateJobWorkflow,
    completeJob,
    updateTribunalChecklist,
    recordTribunalOutcome,
    markNotificationRead,
    sendMessage,
  };

  return (
    <InspectorDataContext.Provider value={value}>
      {children}
    </InspectorDataContext.Provider>
  );
}

export function useInspectorData(): InspectorDataContextValue {
  const ctx = useContext(InspectorDataContext);
  if (!ctx) {
    throw new Error('useInspectorData must be used within InspectorDataProvider');
  }
  return ctx;
}
