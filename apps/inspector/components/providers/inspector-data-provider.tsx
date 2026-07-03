'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { toast } from 'sonner';

import { useAuth } from '@/components/providers/auth-provider';
import { INSPECTOR_HOURLY_RATE_AUD } from '@/constants/inspection';
import { ROUTES } from '@/constants/routes';
import { TRIBUNAL_INSPECTION_HOURS } from '@/constants/inspection-rates';
import { api, ApiError } from '@/lib/api';
import {
  acceptInspection as apiAcceptInspection,
  claimInspection as apiClaimInspection,
  completeInspection as apiCompleteInspection,
  declineInspection as apiDeclineInspection,
  fetchInspectionDetail,
  fetchInspections,
  fetchInspectorMessages,
  fetchInspectorNotifications,
  fetchInspectorProfile,
  fetchInspectorTribunalCases,
  fetchJobs as fetchInspectorJobs,
  fetchPoolInspections,
  markInspectorNotificationRead,
  releaseInspection as apiReleaseInspection,
  replyInspectorMessage,
  saveInspectionFindings as apiSaveInspectionFindings,
  submitInspectorRegistration,
  uploadInspectionPhoto,
  type InspectorFindingAreaPayload,
  type InspectorProfileDto,
} from '@/lib/crossub-api/inspector-client';
import {
  mapInspectionDetail,
  mapInspectionDetailPhotos,
  mapInspections,
  mapInspectorEarnings,
  mapInspectorMessages,
  mapInspectorNotifications,
  mapInspectorRegistration,
  mapPoolInspections,
  mapTribunalCases,
} from '@/lib/crossub-api/inspector-mappers';
import {
  enrichJobsWithKeyCollection,
  syncKeyCustodyToServer,
} from '@/lib/leasing-key-collection';
import { fileToBase64 } from '@/lib/utils';
import { buildDashboardSummary } from '@/lib/inspector-summary';
import {
  filterPoolJobs,
  filterTodaysInspections,
  filterUpcomingInspections,
  isDemoJobId,
} from '@/lib/inspector-job-filters';
import {
  loadPersistedJobProgress,
  mergeJobWithLocalProgress,
  persistJobProgress,
} from '@/lib/job-workflow-persist';
import {
  mergeJobWithHistory,
  saveCompletedJobHistory,
} from '@/lib/job-history';
import { calculateLaborFee } from '@/lib/inspector-pay';
import {
  buildInspectionFinishedPatch,
  buildKeyWorkflowPatch,
  isInspectionWorkflowFinished,
  isKeyCollectComplete,
  isKeyReturnComplete,
  type KeyPhaseRecord,
} from '@/lib/key-access-workflow';
import type { CancelTaskMode } from '@/constants/job-cancellation';
import {
  emergencyCancelBonus,
  formatJobRefId,
  payoutWithEmergencyBonus,
} from '@/lib/job-cancellation';
import {
  isRegistrationComplete,
  loadInspectorRegistration,
  saveInspectorRegistration,
} from '@/lib/inspector-registration';
import {
  EARNINGS,
  JOBS,
  MESSAGE_THREADS,
  NOTIFICATIONS,
  THREAD_MESSAGES,
  TRIBUNALS,
} from '@/lib/mock-data';
import {
  enqueueOfflineAction,
  loadOfflineQueue,
  saveOfflineQueue,
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
  OfflineQueueItem,
  RoomInspectionEntry,
  ThreadMessage,
  TribunalHearing,
  TribunalOutcome,
} from '@/lib/types';
import type { LabeledPhoto } from '@/lib/job-history';

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
  registrationHydrated: boolean;
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
  cancelJob: (
    id: string,
    options: { reason: string; mode: CancelTaskMode },
  ) => void;
  updateJobStatus: (id: string, status: JobStatus) => void;
  updateJobWorkflow: (
    id: string,
    step: number,
    data?: Record<string, unknown>,
  ) => void;
  completeJob: (id: string) => void;
  /** Marks inspection done; returns whether key return is still required. */
  finishInspectionWorkflow: (id: string) => 'needs_key_return' | 'completed';
  saveKeyWorkflow: (
    id: string,
    phase: 'collect' | 'return',
    record: KeyPhaseRecord,
  ) => void;
  /**
   * Load the real seeded findings tree (areas → items → photos) for an API-backed
   * inspection, flattened to the read view-model. Returns [] for demo jobs or when the
   * facade is unreachable (the caller renders nothing rather than erroring).
   */
  loadInspectionFindings: (id: string) => Promise<RoomInspectionEntry[]>;
  /**
   * Load server-persisted findings photos for a completed API-backed inspection
   * (`GET /inspector/inspections/:id/detail`). Returns [] for demo jobs / offline.
   */
  loadInspectionReportPhotos: (id: string) => Promise<LabeledPhoto[]>;
  /**
   * Upload inspection-level evidence photos for an API-backed inspection (base64 → R2).
   * Returns the count uploaded (0 for demo jobs / offline); rejects if any upload fails so
   * the caller can block completion. Uploaded photos surface via the findings read.
   * With an areaName the photos attach to that area of the findings tree.
   */
  uploadInspectionPhotos: (
    id: string,
    files: File[],
    areaName?: string,
  ) => Promise<number>;
  /**
   * Persist the findings tree an execution screen gathered (per-area condition +
   * notes/issues) on the real facade. Best-effort: no-ops for demo jobs, toasts on
   * failure, never throws — but MUST be awaited before completing the job (findings
   * lock once the inspection is COMPLETED).
   */
  saveInspectionFindings: (
    id: string,
    areas: InspectorFindingAreaPayload[],
  ) => Promise<boolean>;
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
  const { status, user } = useAuth();
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
  const [registrationHydrated, setRegistrationHydrated] = useState(false);
  // The server's own-profile read (roster credentials + registration status) —
  // null until the facade answers; the profile memo overlays it on the local copy.
  const [serverProfile, setServerProfile] = useState<InspectorProfileDto | null>(
    null,
  );
  // Ids of jobs sourced from the live `/inspector/inspections` facade — lets the write
  // actions route an API-backed assignment to the real facade and a demo job to local.
  const apiInspectionIds = useRef<Set<string>>(new Set());
  // Key-return records awaiting server sync — the facade rejects a return
  // recorded before the inspection is completed, so completeJob chains it.
  const pendingReturnCustody = useRef<Map<string, KeyPhaseRecord>>(new Map());
  // Pool rows from `GET /inspector/inspections/pool` — claim before accept.
  const apiPoolIds = useRef<Set<string>>(new Set());
  // Same idea for the live message threads + notifications: a write to an API-backed row
  // hits the real facade; a demo row stays local-optimistic.
  const apiThreadIds = useRef<Set<string>>(new Set());
  const apiNotificationIds = useRef<Set<string>>(new Set());
  // Tribunal cases from `GET /inspector/tribunal-cases` — read-only overlay; the
  // checklist toggles and outcome recorder stay local for these rows.
  const apiTribunalIds = useRef<Set<string>>(new Set());

  useLayoutEffect(() => {
    if (status === 'loading') {
      setRegistration(null);
      setRegistrationHydrated(false);
      return;
    }
    if (status !== 'authed' || !user?.email) {
      setRegistration(null);
      setRegistrationHydrated(true);
      return;
    }
    setRegistration(loadInspectorRegistration(user.email));
    setRegistrationHydrated(true);
  }, [status, user?.email]);

  const registrationComplete = isRegistrationComplete(registration);

  const saveRegistration = useCallback(
    (data: InspectorRegistration) => {
      const email = (user?.email ?? data.email).trim().toLowerCase();
      if (!email) return;
      const payload = { ...data, email };
      // Local copy first — it keeps the never-echoed PII/bank fields for display
      // and is the offline fallback.
      saveInspectorRegistration(email, payload);
      setRegistration(payload);
      // Then submit to the real registry intake: the application lands
      // PENDING_REVIEW in the staff review queue (approve there mints the roster
      // record), and the response's status truth overlays the local copy.
      void submitInspectorRegistration({
        firstName: payload.firstName,
        lastName: payload.lastName,
        mobile: payload.mobile || undefined,
        dateOfBirth: payload.dateOfBirth || undefined,
        residentialAddress: payload.residentialAddress || undefined,
        abn: payload.abn || undefined,
        licenceNumber: payload.licenceNumber || undefined,
        licenceType: payload.licenceType || undefined,
        licenceExpiry: payload.licenceExpiry || undefined,
        serviceRegions: payload.serviceRegions,
        tribunalQualified: payload.tribunalQualified ?? false,
        bankAccountName: payload.bankAccountName || undefined,
        bankBsb: payload.bankBsb || undefined,
        bankAccountNumber: payload.bankAccountNumber || undefined,
      })
        .then((serverReg) => {
          const merged = mapInspectorRegistration(serverReg, payload);
          saveInspectorRegistration(email, merged);
          setRegistration(merged);
        })
        .catch(() => undefined);
    },
    [user?.email],
  );

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
    // `/inspector/inspections` -> assigned jobs; `/inspector/inspections/pool` -> pool;
    // `/inspector/jobs` -> the billable earnings ledger; messages + notifications.
    const [inspections, pool, ledger, threads, notifs, tribs, profileRes] =
      await Promise.allSettled([
        fetchInspections(),
        fetchPoolInspections(),
        fetchInspectorJobs(),
        fetchInspectorMessages(),
        fetchInspectorNotifications(),
        fetchInspectorTribunalCases(),
        fetchInspectorProfile(),
      ]);

    let assignedFromApi: InspectionJob[] = [];
    let poolFromApi: InspectionJob[] = [];

    if (inspections.status === 'fulfilled') {
      assignedFromApi = mapInspections(inspections.value);
      apiInspectionIds.current = new Set(assignedFromApi.map((j) => j.id));
      setApiConnected(true);
    } else if (inspections.status === 'rejected') {
      apiInspectionIds.current = new Set();
    }
    if (pool.status === 'fulfilled') {
      poolFromApi = mapPoolInspections(pool.value);
      apiPoolIds.current = new Set(poolFromApi.map((j) => j.id));
      setApiConnected(true);
    } else if (pool.status === 'rejected') {
      apiPoolIds.current = new Set();
    }
    if (inspections.status === 'fulfilled' || pool.status === 'fulfilled') {
      const apiIds = new Set([
        ...assignedFromApi.map((j) => j.id),
        ...poolFromApi.map((j) => j.id),
      ]);
      let assignedWithKeys = assignedFromApi;
      let poolWithKeys = poolFromApi;
      if (apiConnected) {
        [assignedWithKeys, poolWithKeys] = await Promise.all([
          enrichJobsWithKeyCollection(assignedFromApi),
          enrichJobsWithKeyCollection(poolFromApi),
        ]);
      }
      setJobs((prev) => {
        const prevById = new Map(prev.map((j) => [j.id, j]));
        const mergeApiJob = (apiJob: InspectionJob) => {
          const fromPrev = mergeJobWithLocalProgress(
            apiJob,
            prevById.get(apiJob.id),
          );
          return mergeJobWithLocalProgress(
            fromPrev,
            loadPersistedJobProgress(apiJob.id),
          );
        };
        const mergeApiJobFinal = (apiJob: InspectionJob) => {
          const merged = mergeApiJob(apiJob);
          return merged.status === 'completed'
            ? mergeJobWithHistory(merged, { serverBacked: true })
            : merged;
        };
        const localOnly = prev.filter(
          (j) => !isDemoJobId(j.id) && !apiIds.has(j.id),
        );
        return [
          ...assignedWithKeys.map(mergeApiJobFinal),
          ...poolWithKeys.map(mergeApiJobFinal),
          ...localOnly,
        ];
      });
    }
    if (ledger.status === 'fulfilled') {
      setEarnings((prev) => upsertById(prev, mapInspectorEarnings(ledger.value)));
      setApiConnected(true);
    }
    if (threads.status === 'fulfilled') {
      const { threads: mappedThreads, messagesByThread } = mapInspectorMessages(
        threads.value,
      );
      apiThreadIds.current = new Set(mappedThreads.map((t) => t.id));
      setMessages((prev) => upsertById(prev, mappedThreads));
      setThreadMessages((prev) => ({ ...prev, ...messagesByThread }));
      setApiConnected(true);
    }
    if (notifs.status === 'fulfilled') {
      const mapped = mapInspectorNotifications(notifs.value);
      apiNotificationIds.current = new Set(mapped.map((n) => n.id));
      setNotifications((prev) => upsertById(prev, mapped));
      setApiConnected(true);
    }
    if (tribs.status === 'fulfilled') {
      const mapped = mapTribunalCases(tribs.value);
      apiTribunalIds.current = new Set(mapped.map((t) => t.id));
      setTribunals((prev) => upsertById(prev, mapped));
      setApiConnected(true);
    }
    if (profileRes.status === 'fulfilled') {
      setServerProfile(profileRes.value);
      // The server's registration record is the status truth (pending/approved/
      // rejected + review timestamps); the local copy keeps the never-echoed
      // PII/bank fields for display.
      const serverReg = profileRes.value.registration;
      if (serverReg) {
        setRegistration((prev) => mapInspectorRegistration(serverReg, prev));
      }
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
    if (!apiConnected) return;

    const remaining: OfflineQueueItem[] = [];
    let synced = 0;

    for (const item of queue) {
      if (
        item.action === 'key_workflow' &&
        apiInspectionIds.current.has(item.jobId)
      ) {
        const phase = item.payload.phase;
        const record = item.payload.record;
        if (
          (phase === 'collect' || phase === 'return') &&
          record &&
          typeof record === 'object'
        ) {
          try {
            await syncKeyCustodyToServer(
              item.jobId,
              phase,
              record as KeyPhaseRecord,
            );
            synced += 1;
            continue;
          } catch {
            remaining.push(item);
            continue;
          }
        }
      }
      remaining.push(item);
    }

    if (synced > 0) {
      saveOfflineQueue(remaining);
      setPendingSync(remaining.length);
      toast.success(`Synced ${synced} offline change(s)`);
      await refresh();
    }
  }, [apiConnected, refresh]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useLayoutEffect(() => {
    if (status !== 'authed') return;
    setJobs((prev) =>
      prev.map((j) =>
        mergeJobWithLocalProgress(j, loadPersistedJobProgress(j.id)),
      ),
    );
  }, [status]);

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
      const isAssignedApiJob = apiInspectionIds.current.has(id);
      const isPoolApiJob = apiPoolIds.current.has(id);
      setJobs((prev) =>
        prev.map((j) =>
          j.id === id
            ? {
                ...j,
                status: 'accepted',
                source:
                  isAssignedApiJob || isPoolApiJob ? 'assigned' : ('pool' as const),
              }
            : j,
        ),
      );
      if ((isAssignedApiJob || isPoolApiJob) && apiConnected) {
        const persist = isPoolApiJob
          ? apiClaimInspection(id).then(() => apiAcceptInspection(id))
          : apiAcceptInspection(id);
        void persist
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
      // API-backed pool rows (and not-yet-accepted assignments) decline on the real
      // facade — the server hides the job from THIS inspector's pool while leaving
      // it available to everyone else. Demo rows stay local-optimistic.
      const isApiJob =
        apiPoolIds.current.has(id) || apiInspectionIds.current.has(id);
      if (isApiJob && apiConnected) {
        void apiDeclineInspection(id)
          .then(() => refresh())
          .catch(() => undefined);
      } else {
        mutateWithOffline(id, 'decline', {});
      }
      toast.success('Job declined');
    },
    [apiConnected, mutateWithOffline, refresh],
  );

  const cancelJob = useCallback(
    (id: string, options: { reason: string; mode: CancelTaskMode }) => {
      const job = jobs.find((j) => j.id === id);
      if (!job) return;

      const ref = formatJobRefId(id);
      const bonus = emergencyCancelBonus(job);
      const payoutPatch = bonus > 0 ? payoutWithEmergencyBonus(job, bonus) : {};
      const cancelledAt = new Date().toISOString();
      const cancellation = {
        reason: options.reason,
        mode: options.mode,
        cancelledAt,
        criticalRaised: true,
        emergencyBonusAud: bonus,
      };

      setJobs((prev) =>
        prev.map((j) => {
          if (j.id !== id) return j;
          if (options.mode === 'release_pool') {
            return {
              ...j,
              ...payoutPatch,
              status: 'available' as const,
              source: 'pool' as const,
              workflowStep: 0,
              workflowData: { ...j.workflowData, cancellation },
            };
          }
          return {
            ...j,
            ...payoutPatch,
            status: 'declined' as const,
            workflowStep: 0,
            workflowData: { ...j.workflowData, cancellation },
          };
        }),
      );

      const adminAlert: InspectorNotification = {
        id: `cancel-critical-${id}-${Date.now()}`,
        type: 'critical',
        title: `Critical — task cancelled (${ref})`,
        body: `${options.reason} · ${options.mode === 'release_pool' ? 'Released to pool' : 'Flagged to admin'}${
          bonus > 0 ? ` · +$${bonus} emergency payout` : ''
        }`,
        href: ROUTES.INSPECTIONS,
        read: false,
        createdAt: cancelledAt,
      };
      setNotifications((prev) => [adminAlert, ...prev]);

      // An API-backed claimed/accepted job releases on the real facade: status back
      // to DRAFT, unassigned, the reason on the workflow audit trail (flag_admin also
      // marks it for staff). The emergency bonus stays a local display — the server
      // deliberately moves no money on a release.
      if (apiInspectionIds.current.has(id) && apiConnected) {
        void apiReleaseInspection(id, {
          reason: options.reason,
          mode: options.mode,
        })
          .then(() => refresh())
          .catch(() => undefined);
      } else {
        mutateWithOffline(id, 'cancel', {
          reason: options.reason,
          mode: options.mode,
          emergencyBonusAud: bonus,
        });
      }

      toast.success(
        options.mode === 'release_pool'
          ? 'Task released to job pool'
          : 'Cancellation flagged to admin',
      );
    },
    [apiConnected, jobs, mutateWithOffline, refresh],
  );

  const updateJobStatus = useCallback(
    (id: string, newStatus: JobStatus) => {
      const job = jobs.find((j) => j.id === id);
      if (
        job?.keyAccess &&
        !isKeyCollectComplete(job) &&
        newStatus === 'in_progress'
      ) {
        toast.error('Complete key collection before starting the inspection.');
        return;
      }
      setJobs((prev) => {
        const next = prev.map((j) => (j.id === id ? { ...j, status: newStatus } : j));
        const updated = next.find((j) => j.id === id);
        if (updated) persistJobProgress(updated);
        return next;
      });
      mutateWithOffline(id, 'status', { status: newStatus });
    },
    [jobs, mutateWithOffline],
  );

  const updateJobWorkflow = useCallback(
    (id: string, step: number, data?: Record<string, unknown>) => {
      setJobs((prev) => {
        const next = prev.map((j) =>
          j.id === id
            ? {
                ...j,
                workflowStep: step,
                status: step > 0 ? 'in_progress' : j.status,
                workflowData: { ...j.workflowData, ...data },
              }
            : j,
        );
        const updated = next.find((j) => j.id === id);
        if (updated) persistJobProgress(updated);
        return next;
      });
      mutateWithOffline(id, 'workflow', { step, data });
    },
    [mutateWithOffline],
  );

  const completeJob = useCallback(
    (id: string) => {
      setJobs((prev) => {
        const job = prev.find((j) => j.id === id);
        if (!job || job.status === 'completed') return prev;

        if (job.keyAccess) {
          if (!isInspectionWorkflowFinished(job)) {
            toast.error('Finish the inspection before completing this task.');
            return prev;
          }
          if (!isKeyReturnComplete(job)) {
            toast.error('Complete key return before finishing this task.');
            return prev;
          }
        }

        const isApiJob = apiInspectionIds.current.has(id);

        if (isApiJob && apiConnected) {
          const endTime = new Date();
          const startTime = new Date(
            endTime.getTime() - job.estimatedHours * 60 * 60 * 1000,
          );
          void apiCompleteInspection(id, {
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
          })
            .then(async () => {
              // Key return can only be recorded server-side once the
              // inspection is completed — flush the pending record now.
              const pendingReturn = pendingReturnCustody.current.get(id);
              if (pendingReturn) {
                try {
                  await syncKeyCustodyToServer(id, 'return', pendingReturn);
                  pendingReturnCustody.current.delete(id);
                } catch {
                  // Return stays recorded locally; the server keeps the
                  // completed inspection.
                }
              }
            })
            .catch(() => undefined)
            .then(() => refresh());
        } else {
          setEarnings((earnPrev) => [
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
            ...earnPrev,
          ]);
          mutateWithOffline(id, 'complete', {});
        }
        toast.success('Inspection completed — report generated');

        return prev.map((j) => {
          if (j.id !== id) return j;
          const completed = { ...j, status: 'completed' as const, workflowStep: 99 };
          persistJobProgress(completed);
          saveCompletedJobHistory(completed);
          return completed;
        });
      });
    },
    [apiConnected, mutateWithOffline, refresh],
  );

  const saveKeyWorkflow = useCallback(
    (id: string, phase: 'collect' | 'return', record: KeyPhaseRecord) => {
      setJobs((prev) => {
        const next = prev.map((j) => {
          if (j.id !== id) return j;
          const patch = buildKeyWorkflowPatch(j, phase, record);
          return {
            ...j,
            workflowData: { ...j.workflowData, ...patch },
          };
        });
        const updated = next.find((j) => j.id === id);
        if (updated) persistJobProgress(updated);
        return next;
      });

      const isApiJob = apiInspectionIds.current.has(id);
      if (isApiJob && apiConnected) {
        if (phase === 'collect') {
          // Proof photos → R2, then record collection on the server (the
          // facade enforces collect-before-start when a key arrangement
          // exists). Best-effort — the local record is the immediate UX.
          void syncKeyCustodyToServer(id, 'collect', record).catch(() => undefined);
        } else {
          // The facade rejects a return recorded before the inspection is
          // completed — completeJob (always called right after a return
          // submit) syncs this once the completion lands.
          pendingReturnCustody.current.set(id, record);
        }
        return;
      }

      mutateWithOffline(id, 'key_workflow', { phase, record });
    },
    [apiConnected, mutateWithOffline],
  );

  const finishInspectionWorkflow = useCallback(
    (id: string): 'needs_key_return' | 'completed' => {
      const job = jobs.find((j) => j.id === id);
      if (!job) return 'completed';

      if (!job.keyAccess) {
        completeJob(id);
        return 'completed';
      }

      const patch = buildInspectionFinishedPatch();
      const withFinished: InspectionJob = {
        ...job,
        workflowData: { ...job.workflowData, ...patch },
        workflowStep: Math.max(job.workflowStep ?? 0, 99),
      };

      setJobs((prev) => {
        const next = prev.map((j) => (j.id === id ? withFinished : j));
        persistJobProgress(withFinished);
        return next;
      });
      mutateWithOffline(id, 'workflow', {
        step: withFinished.workflowStep ?? 99,
        data: patch,
      });

      if (isKeyReturnComplete(withFinished)) {
        setTimeout(() => completeJob(id), 0);
        return 'completed';
      }

      return 'needs_key_return';
    },
    [jobs, completeJob, mutateWithOffline],
  );

  const loadInspectionFindings = useCallback(
    async (id: string): Promise<RoomInspectionEntry[]> => {
      // Findings only exist on the real facade — demo jobs carry no seeded tree.
      if (!apiInspectionIds.current.has(id) || !apiConnected) return [];
      try {
        const detail = await fetchInspectionDetail(id);
        return mapInspectionDetail(detail);
      } catch {
        return [];
      }
    },
    [apiConnected],
  );

  const loadInspectionReportPhotos = useCallback(
    async (id: string): Promise<LabeledPhoto[]> => {
      if (!apiInspectionIds.current.has(id) || !apiConnected) return [];
      try {
        const detail = await fetchInspectionDetail(id);
        return mapInspectionDetailPhotos(detail);
      } catch {
        return [];
      }
    },
    [apiConnected],
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

  const markNotificationRead = useCallback(
    (id: string) => {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
      );
      // Persist on the real facade for API-backed notifications; an error just leaves the
      // optimistic read state in place (demo rows have no facade and stay local).
      if (apiNotificationIds.current.has(id) && apiConnected) {
        void markInspectorNotificationRead(id).catch(() => undefined);
      }
    },
    [apiConnected],
  );

  const sendMessage = useCallback(
    (threadId: string, body: string) => {
      const msg: ThreadMessage = {
        id: `tm-${Date.now()}`,
        from: 'Alex Chen',
        body,
        at: new Date().toISOString(),
        fromSelf: true,
      };
      // Optimistic append on both paths.
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
      // For an API-backed thread, post the real reply then reconcile from the server; an
      // error leaves the optimistic message in place (graceful, like the other writes).
      if (apiThreadIds.current.has(threadId) && apiConnected) {
        void replyInspectorMessage(threadId, body)
          .then(() => refresh())
          .catch(() => undefined);
      }
    },
    [apiConnected, refresh],
  );

  /**
   * Upload inspection-level evidence photos for an API-backed inspection (base64 → R2 via
   * the facade). No-ops (returns 0) for demo jobs or when offline. THROWS if any upload
   * fails so the caller can block completion — evidence is never silently lost. The
   * uploaded photos surface back through the findings detail read on the next refresh.
   */
  const uploadInspectionPhotos = useCallback(
    async (
      inspectionId: string,
      files: File[],
      areaName?: string,
    ): Promise<number> => {
      if (!apiInspectionIds.current.has(inspectionId) || !apiConnected) return 0;
      let uploaded = 0;
      for (const file of files) {
        const contentBase64 = await fileToBase64(file);
        await uploadInspectionPhoto(inspectionId, {
          fileName: file.name,
          mimeType: file.type,
          sizeBytes: file.size,
          contentBase64,
          ...(areaName ? { areaName } : {}),
        });
        uploaded += 1;
      }
      return uploaded;
    },
    [apiConnected],
  );

  /**
   * Persist the findings tree an execution screen gathered on the real facade.
   * Best-effort by design (demo jobs and offline no-op, a failure toasts) — but
   * awaited by the screens BEFORE completion, since findings lock once the
   * inspection is COMPLETED server-side.
   */
  const saveInspectionFindingsAction = useCallback(
    async (
      inspectionId: string,
      areas: InspectorFindingAreaPayload[],
    ): Promise<boolean> => {
      if (
        !apiInspectionIds.current.has(inspectionId) ||
        !apiConnected ||
        areas.length === 0
      ) {
        return false;
      }
      try {
        await apiSaveInspectionFindings(inspectionId, { areas });
        return true;
      } catch {
        toast.error('Findings could not be saved to the server');
        return false;
      }
    },
    [apiConnected],
  );

  const poolJobs = useMemo(() => filterPoolJobs(jobs), [jobs]);
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
  const todaysJobs = useMemo(() => filterTodaysInspections(jobs), [jobs]);
  const upcomingJobs = useMemo(() => filterUpcomingInspections(jobs), [jobs]);
  const completedJobs = useMemo(
    () => jobs.filter((j) => j.status === 'completed'),
    [jobs],
  );

  const summary = useMemo(
    () => buildDashboardSummary(jobs, tribunals, earnings, pendingSync),
    [jobs, tribunals, earnings, pendingSync],
  );

  const profile: InspectorProfile = useMemo(() => {
    // Server truth first: the roster row (staff-approved credentials) names the
    // inspector and carries the REAL tribunal qualification; the local
    // registration remains the fallback for a fresh/offline registrant.
    const serverName = serverProfile
      ? `${serverProfile.firstName ?? ''} ${serverProfile.lastName ?? ''}`.trim()
      : '';
    const localName = registration
      ? `${registration.firstName} ${registration.lastName}`.trim()
      : '';
    return {
      ...DEMO_PROFILE,
      id: serverProfile?.roster?.inspectorId ?? DEMO_PROFILE.id,
      name: serverName || localName || DEMO_PROFILE.name,
      email:
        serverProfile?.email ?? registration?.email ?? user?.email ?? DEMO_PROFILE.email,
      phone: serverProfile?.phone ?? registration?.mobile ?? DEMO_PROFILE.phone,
      tribunalQualified:
        serverProfile?.roster?.tribunalQualified ??
        registration?.tribunalQualified ??
        false,
      weeklyEarnings: summary.weeklyEarnings,
      registration,
      registrationComplete,
    };
  }, [
    registration,
    registrationComplete,
    serverProfile,
    summary.weeklyEarnings,
    user?.email,
  ]);

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
    registrationHydrated,
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
    getJob: (id) => {
      const job = jobs.find((j) => j.id === id);
      if (!job) return undefined;
      return job.status === 'completed' ? mergeJobWithHistory(job) : job;
    },
    getTribunal: (id) => tribunals.find((t) => t.id === id),
    getThreadMessages: (threadId) => threadMessages[threadId] ?? [],
    acceptJob,
    declineJob,
    cancelJob,
    updateJobStatus,
    updateJobWorkflow,
    completeJob,
    finishInspectionWorkflow,
    saveKeyWorkflow,
    loadInspectionFindings,
    loadInspectionReportPhotos,
    uploadInspectionPhotos,
    saveInspectionFindings: saveInspectionFindingsAction,
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
