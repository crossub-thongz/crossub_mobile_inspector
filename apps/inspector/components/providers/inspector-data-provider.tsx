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
  setInspectorPoolAvailability,
  setInspectorLocation,
  submitInspectorRegistration,
  uploadInspectionPhoto,
  clearInspectionAreaPhotos,
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
  keyWorkflowFromCustody,
  syncKeyCustodyToServer,
} from '@/lib/leasing-key-collection';
import {
  compressImageForUpload,
  dataUrlToUploadParts,
  shrinkDataUrlForUpload,
} from '@/lib/compress-image';
import {
  isPersistedPhotoUrl,
  pendingPhotoSources,
} from '@/lib/inspection-area-photos';
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
  isInspectorOnboardingComplete,
  loadInspectorRegistration,
  saveInspectorRegistration,
} from '@/lib/inspector-registration';
import {
  isReceivingJobs,
  loadInspectorAvailability,
  saveInspectorAvailability,
  type InspectorAvailability,
} from '@/lib/inspector-availability';
import { useInspectorLocationSync } from '@/lib/use-inspector-location-sync';
import { useDevicePosition } from '@/lib/use-device-position';
import type { GeoPoint } from '@/lib/travel';
import {
  demoSeedSnapshot,
  shouldShowDemoSeeds,
} from '@/lib/demo-seeds';
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
  /** Set when the job pool API fails (e.g. roster not approved). */
  poolError: string | null;
  /** True when GET /inspector/profile returned an approved roster row. */
  rosterLinked: boolean;
  pendingSync: number;
  /** True when the inspector is open to new pool jobs (green bubble). */
  receivingJobs: boolean;
  /** Latest device GPS fix for on-screen distance/ETA. */
  deviceLocation: GeoPoint | null;
  availability: InspectorAvailability;
  toggleReceivingJobs: () => void;
  refresh: () => Promise<void>;
  syncOfflineQueue: () => Promise<void>;
  profile: InspectorProfile;
  registration: InspectorRegistration | null;
  registrationComplete: boolean;
  registrationHydrated: boolean;
  /** True once GET /inspector/profile has settled for the signed-in user (gate waits on this). */
  registrationResolved: boolean;
  saveRegistration: (data: InspectorRegistration) => Promise<void>;
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
  ) => Promise<void>;
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
   * Returns preview URLs (server URL when uploaded, local data URL for demo/offline).
   * Rejects if any upload fails so the caller can block completion. Uploaded photos
   * surface via the findings read. With an areaName the photos attach to that area.
   */
  uploadInspectionPhotos: (
    id: string,
    sources: Array<File | string>,
    areaName?: string,
  ) => Promise<string[]>;
  /** Clear + upload the final kept photos when advancing to the next area. */
  commitInspectionAreaPhotos: (
    id: string,
    areaName: string,
    photoUrls: string[],
  ) => Promise<string[]>;
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
  rating: null,
  totalCompleted: 0,
  lateArrivals: 0,
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
  const [poolError, setPoolError] = useState<string | null>(null);
  const [rosterLinked, setRosterLinked] = useState(false);
  const [pendingSync, setPendingSync] = useState(0);

  const [jobs, setJobs] = useState<InspectionJob[]>([]);
  const [tribunals, setTribunals] = useState<TribunalHearing[]>([]);
  const [earnings, setEarnings] = useState<EarningsRecord[]>([]);
  const [notifications, setNotifications] = useState<InspectorNotification[]>([]);
  const [messages, setMessages] = useState<MessageThread[]>([]);
  const [threadMessages, setThreadMessages] = useState<Record<string, ThreadMessage[]>>({});
  const [registration, setRegistration] = useState<InspectorRegistration | null>(
    null,
  );
  const [registrationHydrated, setRegistrationHydrated] = useState(false);
  const [registrationResolved, setRegistrationResolved] = useState(false);
  const [availability, setAvailability] = useState<InspectorAvailability>('receiving');
  const receivingJobs = isReceivingJobs(availability);
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
      setRegistrationResolved(false);
      return;
    }
    if (status !== 'authed' || !user?.email) {
      setRegistration(null);
      setRegistrationHydrated(true);
      setRegistrationResolved(true);
      setServerProfile(null);
      setAvailability('receiving');
      setRosterLinked(false);
      setPoolError(null);
      setJobs([]);
      setTribunals([]);
      setEarnings([]);
      setNotifications([]);
      setMessages([]);
      setThreadMessages({});
      return;
    }
    setRegistration(loadInspectorRegistration(user.email));
    setRegistrationHydrated(true);
    setAvailability(loadInspectorAvailability(user.email));
  }, [status, user?.email]);

  const syncServerProfile = useCallback(async (): Promise<void> => {
    if (status !== 'authed' || !user?.email) return;

    const profile = await fetchInspectorProfile();
    setServerProfile(profile);

    if (user?.email && profile.roster) {
      const rosterReceiving = (
        profile.roster as { receivingPoolJobs?: boolean }
      ).receivingPoolJobs;
      const receiving = rosterReceiving !== false;
      const nextAvailability: InspectorAvailability = receiving
        ? 'receiving'
        : 'on_break';
      setAvailability(nextAvailability);
      saveInspectorAvailability(user.email, nextAvailability);
    }

    const serverReg = profile.registration;
    if (!serverReg) return;

    setRegistration((prev) => {
      const merged = mapInspectorRegistration(
        serverReg,
        prev ?? loadInspectorRegistration(user.email),
      );
      saveInspectorRegistration(user.email, merged);
      return merged;
    });
  }, [status, user?.email]);

  useEffect(() => {
    if (status === 'loading') {
      setRegistrationResolved(false);
      return;
    }
    if (status !== 'authed' || !user?.email) {
      return;
    }

    let cancelled = false;
    setRegistrationResolved(false);

    void syncServerProfile()
      .catch(() => {
        // Offline or transient — localStorage from the layout effect is the fallback.
      })
      .finally(() => {
        if (!cancelled) setRegistrationResolved(true);
      });

    return () => {
      cancelled = true;
    };
  }, [status, user?.email, syncServerProfile]);

  const receivingJobsRef = useRef(receivingJobs);
  receivingJobsRef.current = receivingJobs;

  const registrationComplete = isInspectorOnboardingComplete({
    registration,
    hasRoster: Boolean(serverProfile?.roster),
    serverRegistrationStatus: serverProfile?.registration?.registrationStatus,
  });

  const saveRegistration = useCallback(
    async (data: InspectorRegistration): Promise<void> => {
      const email = (user?.email ?? data.email).trim().toLowerCase();
      if (!email) {
        throw new Error('Missing account email');
      }
      const payload = { ...data, email };
      // Local copy first — it keeps the never-echoed PII/bank fields for display
      // and is the offline fallback.
      saveInspectorRegistration(email, payload);
      setRegistration(payload);
      // Then submit to the real registry intake: the application lands
      // PENDING_REVIEW in the staff review queue (approve there mints the roster
      // record), and the response's status truth overlays the local copy.
      try {
        const serverReg = await submitInspectorRegistration({
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
        });
        const merged = mapInspectorRegistration(serverReg, payload);
        saveInspectorRegistration(email, merged);
        setRegistration(merged);
      } catch {
        toast.error(
          'Could not save your profile to the server. Check your connection and try again.',
        );
        throw new Error('Registration submit failed');
      }
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
    let connected = false;
    try {
      await api.get('/health');
      connected = true;
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
        receivingJobsRef.current
          ? fetchPoolInspections()
          : Promise.resolve([]),
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
      connected = true;
      setApiConnected(true);
    } else if (inspections.status === 'rejected') {
      assignedFromApi = [];
    }
    if (pool.status === 'fulfilled') {
      poolFromApi = mapPoolInspections(pool.value);
      apiPoolIds.current = new Set(poolFromApi.map((j) => j.id));
      setPoolError(null);
      connected = true;
      setApiConnected(true);
    } else if (pool.status === 'rejected') {
      apiPoolIds.current = new Set();
      const reason = pool.reason;
      setPoolError(
        reason instanceof Error
          ? reason.message
          : 'Could not load the job pool.',
      );
    }
    // Pool + assigned rows both hit the real facade — key proof must sync for either.
    apiInspectionIds.current = new Set([
      ...assignedFromApi.map((j) => j.id),
      ...poolFromApi.map((j) => j.id),
    ]);
    if (inspections.status === 'fulfilled' || pool.status === 'fulfilled') {
      const apiIds = new Set([
        ...assignedFromApi.map((j) => j.id),
        ...poolFromApi.map((j) => j.id),
      ]);
      let assignedWithKeys = assignedFromApi;
      let poolWithKeys = poolFromApi;
      if (connected) {
        [assignedWithKeys, poolWithKeys] = await Promise.all([
          enrichJobsWithKeyCollection(assignedFromApi),
          enrichJobsWithKeyCollection(poolFromApi),
        ]);
      }
      setJobs((prev) => {
        const prevById = new Map(prev.map((j) => [j.id, j]));
        const mergeApiJob = (apiJob: InspectionJob) => {
          const persisted = loadPersistedJobProgress(apiJob.id);
          const sanitizedPersisted =
            persisted && isKeyCollectComplete(apiJob)
              ? {
                  ...persisted,
                  workflowData: persisted.workflowData
                    ? Object.fromEntries(
                        Object.entries(persisted.workflowData).filter(
                          ([key]) => key !== 'keyWorkflow',
                        ),
                      )
                    : undefined,
                }
              : persisted;
          const fromPrev = mergeJobWithLocalProgress(
            apiJob,
            prevById.get(apiJob.id),
          );
          return mergeJobWithLocalProgress(fromPrev, sanitizedPersisted);
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
        const merged = [
          ...assignedWithKeys.map(mergeApiJobFinal),
          ...poolWithKeys.map(mergeApiJobFinal),
          ...localOnly,
        ];
        return merged.filter((j) => !isDemoJobId(j.id));
      });
    }
    if (ledger.status === 'fulfilled') {
      setEarnings(mapInspectorEarnings(ledger.value));
      connected = true;
      setApiConnected(true);
    }
    if (threads.status === 'fulfilled') {
      const { threads: mappedThreads, messagesByThread } = mapInspectorMessages(
        threads.value,
      );
      apiThreadIds.current = new Set(mappedThreads.map((t) => t.id));
      setMessages(mappedThreads);
      setThreadMessages(messagesByThread);
      connected = true;
      setApiConnected(true);
    }
    if (notifs.status === 'fulfilled') {
      const mapped = mapInspectorNotifications(notifs.value);
      apiNotificationIds.current = new Set(mapped.map((n) => n.id));
      setNotifications(mapped);
      connected = true;
      setApiConnected(true);
    }
    if (tribs.status === 'fulfilled') {
      const mapped = mapTribunalCases(tribs.value);
      apiTribunalIds.current = new Set(mapped.map((t) => t.id));
      setTribunals(mapped);
      connected = true;
      setApiConnected(true);
    }
    if (profileRes.status === 'fulfilled') {
      setServerProfile(profileRes.value);
      setRosterLinked(Boolean(profileRes.value.roster));
      const serverReg = profileRes.value.registration;
      if (serverReg && user?.email) {
        setRegistration((prev) => {
          const merged = mapInspectorRegistration(
            serverReg,
            prev ?? loadInspectorRegistration(user.email),
          );
          saveInspectorRegistration(user.email, merged);
          return merged;
        });
      }
      connected = true;
      setApiConnected(true);
    }

    if (shouldShowDemoSeeds(connected, user?.email)) {
      const demo = demoSeedSnapshot();
      setJobs(demo.jobs);
      setEarnings(demo.earnings);
      setTribunals(demo.tribunals);
      setMessages(demo.messages);
      setNotifications(demo.notifications);
      setThreadMessages(demo.threadMessages);
    }

    setApiConnected(connected);
    setLoading(false);
    refreshPendingSync();
  }, [status, user?.email, refreshPendingSync]);

  const toggleReceivingJobs = useCallback(() => {
    if (!user?.email) return;
    const previous = availability;
    const next: InspectorAvailability =
      previous === 'receiving' ? 'on_break' : 'receiving';

    void (async () => {
      try {
        await setInspectorPoolAvailability(next === 'receiving');
        setAvailability(next);
        saveInspectorAvailability(user.email, next);
        if (next === 'receiving') {
          toast.success('Receiving jobs — refreshing the pool');
          await refresh();
        } else {
          toast.info('On break — removed from dispatch pool');
          apiPoolIds.current = new Set();
          setJobs((prev) =>
            prev.filter((j) => j.status !== 'available' && j.source !== 'pool'),
          );
        }
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : 'Could not sync availability — try again.';
        toast.error(message);
      }
    })();
  }, [availability, refresh, user?.email]);

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
      const job = jobs.find((j) => j.id === id);
      const isPoolApiJob = apiPoolIds.current.has(id);
      const isPoolRow =
        isPoolApiJob || job?.status === 'available' || job?.source === 'pool';
      if (isPoolRow && !receivingJobsRef.current) {
        toast.error('You are on break — switch to receiving jobs to accept new work.');
        return;
      }
      const isAssignedApiJob = apiInspectionIds.current.has(id);
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
        apiInspectionIds.current.add(id);
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
    [apiConnected, jobs, mutateWithOffline, refresh],
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
    async (id: string, phase: 'collect' | 'return', record: KeyPhaseRecord) => {
      const isApiJob =
        apiConnected &&
        (apiInspectionIds.current.has(id) || apiPoolIds.current.has(id));

      if (isApiJob && phase === 'collect') {
        try {
          const custody = await syncKeyCustodyToServer(id, 'collect', record, {
            fromPool: apiPoolIds.current.has(id),
          });
          apiInspectionIds.current.add(id);
          const serverWorkflow = keyWorkflowFromCustody(custody);
          setJobs((prev) => {
            const next = prev.map((j) => {
              if (j.id !== id) return j;
              return {
                ...j,
                workflowData: {
                  ...j.workflowData,
                  ...(serverWorkflow ? { keyWorkflow: serverWorkflow } : {}),
                },
              };
            });
            const updated = next.find((j) => j.id === id);
            if (updated) persistJobProgress(updated);
            return next;
          });
          await refresh();
        } catch (err) {
          const message =
            err instanceof Error
              ? err.message
              : 'Could not sync key collection to the server';
          toast.error(message);
          throw err;
        }
        return;
      }

      if (isApiJob && phase === 'return') {
        try {
          const job = jobs.find((j) => j.id === id);
          if (job?.status !== 'completed') {
            const endTime = new Date();
            const startTime = new Date(
              endTime.getTime() -
                (job?.estimatedHours ?? 2) * 60 * 60 * 1000,
            );
            await apiCompleteInspection(id, {
              startTime: startTime.toISOString(),
              endTime: endTime.toISOString(),
            });
          }
          const custody = await syncKeyCustodyToServer(id, 'return', record);
          pendingReturnCustody.current.delete(id);
          apiInspectionIds.current.add(id);
          const serverWorkflow = keyWorkflowFromCustody(custody);
          setJobs((prev) => {
            const next = prev.map((j) => {
              if (j.id !== id) return j;
              return {
                ...j,
                status: 'completed' as const,
                workflowData: {
                  ...j.workflowData,
                  ...(serverWorkflow ? { keyWorkflow: serverWorkflow } : {}),
                },
              };
            });
            const updated = next.find((j) => j.id === id);
            if (updated) persistJobProgress(updated);
            return next;
          });
          await refresh();
        } catch (err) {
          pendingReturnCustody.current.set(id, record);
          const message =
            err instanceof Error
              ? err.message
              : 'Could not sync key return to the server';
          toast.error(message);
          throw err;
        }
        return;
      }

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

      if (isApiJob) {
        pendingReturnCustody.current.set(id, record);
        return;
      }

      mutateWithOffline(id, 'key_workflow', { phase, record });
    },
    [apiConnected, jobs, mutateWithOffline, refresh],
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
   * the facade). Returns preview URLs for the UI. Demo/offline jobs get local data URLs
   * only. THROWS if any upload fails so the caller can block completion — evidence is
   * never silently lost. The uploaded photos surface back through the findings detail
   * read on the next refresh.
   */
  const uploadInspectionPhotos = useCallback(
    async (
      inspectionId: string,
      sources: Array<File | string>,
      areaName?: string,
    ): Promise<string[]> => {
      const previewUrls: string[] = [];
      const isApiJob =
        apiInspectionIds.current.has(inspectionId) && apiConnected;

      for (let index = 0; index < sources.length; index += 1) {
        const source = sources[index];
        const dataUrl =
          source instanceof File
            ? await compressImageForUpload(source)
            : await shrinkDataUrlForUpload(source);
        if (!isApiJob) {
          previewUrls.push(dataUrl);
          continue;
        }

        const parts = dataUrlToUploadParts(dataUrl);
        if (!parts) throw new Error('Invalid image');

        const slug = areaName?.replace(/\s+/g, '-').toLowerCase() ?? 'area';
        const fileName =
          source instanceof File
            ? source.name.replace(/\.[^.]+$/, '') + '.jpg'
            : `${slug}-${index + 1}.jpg`;

        const result = await uploadInspectionPhoto(inspectionId, {
          fileName,
          mimeType: parts.mimeType,
          sizeBytes: parts.sizeBytes,
          contentBase64: parts.contentBase64,
          ...(areaName ? { areaName } : {}),
        });
        previewUrls.push(result.url || dataUrl);
      }

      return previewUrls;
    },
    [apiConnected],
  );

  const commitInspectionAreaPhotos = useCallback(
    async (
      inspectionId: string,
      areaName: string,
      photoUrls: string[],
    ): Promise<string[]> => {
      const pending = pendingPhotoSources(photoUrls);
      const persisted = photoUrls.filter(isPersistedPhotoUrl);
      const isApiJob =
        apiInspectionIds.current.has(inspectionId) && apiConnected;

      if (!isApiJob) {
        return pending.length > 0 ? pending : persisted;
      }

      await clearInspectionAreaPhotos(inspectionId, areaName);
      if (pending.length === 0) return [];
      return uploadInspectionPhotos(inspectionId, pending, areaName);
    },
    [apiConnected, uploadInspectionPhotos],
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

  const poolJobs = useMemo(
    () => (receivingJobs ? filterPoolJobs(jobs) : []),
    [jobs, receivingJobs],
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
    const roster = serverProfile?.roster as
      | {
          averageRating?: number | null;
          totalCompleted?: number;
          lateArrivals?: number;
        }
      | null
      | undefined;
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
      rating: roster?.averageRating ?? null,
      totalCompleted: roster?.totalCompleted ?? 0,
      lateArrivals: roster?.lateArrivals ?? 0,
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

  useEffect(() => {
    if (status !== 'authed' || !receivingJobs || !apiConnected) return;
    const id = window.setInterval(() => {
      void refresh();
    }, 5_000);
    return () => window.clearInterval(id);
  }, [status, receivingJobs, apiConnected, refresh]);

  const pushInspectorLocation = useCallback(
    (latitude: number, longitude: number) =>
      setInspectorLocation(latitude, longitude).catch(() => {
        // Silent — location is best-effort for dispatch ETA.
      }),
    [],
  );

  useInspectorLocationSync(
    status === 'authed' &&
      apiConnected &&
      Boolean(serverProfile?.roster),
    pushInspectorLocation,
  );

  const deviceLocation = useDevicePosition(status === 'authed');

  const value: InspectorDataContextValue = {
    loading,
    apiConnected,
    apiError,
    poolError,
    rosterLinked,
    pendingSync,
    receivingJobs,
    deviceLocation,
    availability,
    toggleReceivingJobs,
    refresh,
    syncOfflineQueue,
    profile,
    registration,
    registrationComplete,
    registrationHydrated,
    registrationResolved,
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
    commitInspectionAreaPhotos,
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
