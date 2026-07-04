export type InspectionType =
  | 'open'
  | 'ingoing'
  | 'outgoing'
  | 'routine'
  | 'tribunal';

export type JobPriority = 'normal' | 'urgent';

export type JobStatus =
  | 'available'
  | 'assigned'
  | 'accepted'
  | 'on_the_way'
  | 'arrived'
  | 'in_progress'
  | 'completed'
  | 'declined';

export type JobSource = 'pool' | 'assigned';

export type PropertyKind = 'apartment' | 'house';

export type ServiceRegionKey =
  | 'cbd_inner'
  | 'eastern_suburbs'
  | 'western_sydney'
  | 'northern_sydney';

export interface ApartmentSpec {
  propertyKind: 'apartment';
  bedrooms: number;
  bathrooms: number;
}

export interface HouseSpec {
  propertyKind: 'house';
  bedrooms: number;
  bathrooms: number;
  livingAreas: number;
  kitchens: number;
  laundries: number;
  hasYard: boolean;
}

export type PropertyInspectionSpec = ApartmentSpec | HouseSpec;

export type InspectorRegistrationStatus =
  | 'not_started'
  | 'pending_review'
  | 'approved'
  | 'rejected';

export interface InspectorRegistration {
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  dateOfBirth: string;
  residentialAddress: string;
  abn?: string;
  licenceNumber?: string;
  licenceType: string;
  licenceExpiry?: string;
  serviceRegions: string[];
  tribunalQualified?: boolean;
  bankAccountName: string;
  bankBsb: string;
  bankAccountNumber: string;
  registrationStatus: InspectorRegistrationStatus;
  submittedAt?: string;
  reviewedAt?: string;
}

export interface KeyAccess {
  method: 'lockbox' | 'office' | 'agent';
  code?: string;
  location: string;
  collectSteps: string[];
  returnSteps: string[];
  photoRequired: boolean;
}

export type LeasingKeyCustody = 'crossub' | 'agent';

export type LeasingItemStatus =
  | 'not_started'
  | 'in_progress'
  | 'waiting'
  | 'blocked'
  | 'done';

export interface LeasingKeyCollectionTenantReport {
  submittedAt: string | null;
  tagNumber: string | null;
  keysCount: number | null;
  entryDoorCount: number | null;
  windowSlidingCount: number | null;
  fobsCount: number | null;
  remoteControlCount: number | null;
  mailboxCount: number | null;
  othersCount: number | null;
}

export interface LeasingKeyCollectionState {
  status: LeasingItemStatus;
  time: string | null;
  location: string | null;
  photos: string[];
  tenantReport: LeasingKeyCollectionTenantReport | null;
}

/** Leasing onboarding key-collection context from the API (matches crossub_web leasing). */
export interface InspectorLeasingKeyContext {
  cycleId: string;
  propertyId: string;
  propertyAddress: string;
  keyCustody: LeasingKeyCustody;
  keyCollection: LeasingKeyCollectionState;
}

export interface InspectorProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  tribunalQualified: boolean;
  weeklyEarnings: number;
  /** Average performance rating (1–5). Null for brand-new inspectors. */
  rating: number | null;
  totalCompleted: number;
  lateArrivals: number;
  registration?: InspectorRegistration | null;
  registrationComplete: boolean;
}

export interface InspectionJob {
  id: string;
  type: InspectionType;
  propertyAddress: string;
  suburb: string;
  latitude?: number;
  longitude?: number;
  scheduledDate: string;
  scheduledTime: string;
  priority: JobPriority;
  distanceKm: number;
  status: JobStatus;
  source: JobSource;
  assignedBy?: string;
  tenantName?: string;
  tenantPhone?: string;
  agentName?: string;
  agentCompany?: string;
  agentEmail?: string;
  agentPhone?: string;
  keyAccess?: KeyAccess;
  /** Live leasing key-collection arrangement (API-backed jobs). */
  leasingKeyCollection?: InspectorLeasingKeyContext;
  notes?: string;
  serviceRegion: ServiceRegionKey;
  property: PropertyInspectionSpec;
  durationLabel: string;
  /** One-way km from regional midpoint to property (fuel allowance basis) */
  travelKmOneWay: number;
  estimatedHours: number;
  laborAmount: number;
  fuelAllowance: number;
  payAmount: number;
  workflowStep?: number;
  workflowData?: Record<string, unknown>;
}

export interface TribunalHearing {
  id: string;
  jobId?: string;
  hearingDate: string;
  hearingTime: string;
  tribunalType: string;
  location: string;
  propertyAddress: string;
  caseSummary: string;
  rentalArrears?: number;
  bondClaimAmount?: number;
  propertyDamage?: string;
  checklist: {
    evidenceComplete: boolean;
    hearingConfirmed: boolean;
    documentsDownloaded: boolean;
    attendanceConfirmed: boolean;
  };
  packageDocuments: { name: string; url: string }[];
  outcome?: TribunalOutcome;
  status: 'upcoming' | 'completed';
}

export type TribunalOutcome =
  | 'claim_successful'
  | 'partially_successful'
  | 'rejected'
  | 'adjourned';

export interface EarningsRecord {
  id: string;
  jobId: string;
  type: InspectionType;
  propertyAddress: string;
  completedAt: string;
  hoursWorked: number;
  hourlyRate: number;
  travelKmOneWay: number;
  fuelAllowance: number;
  laborAmount: number;
  amount: number;
  accountingSynced: boolean;
}

export interface MessageThread {
  id: string;
  subject: string;
  participants: string[];
  lastMessage: string;
  lastAt: string;
  unread: number;
  category: 'agent' | 'leasing' | 'inspection' | 'maintenance';
}

export interface ThreadMessage {
  id: string;
  from: string;
  body: string;
  at: string;
  attachments?: { name: string; url: string }[];
  /** True when the signed-in inspector sent it (server-resolved; absent for demo data). */
  fromSelf?: boolean;
}

export interface InspectorNotification {
  id: string;
  type:
    | 'job_assigned'
    | 'job_available'
    | 'tribunal'
    | 'message'
    | 'sync_complete'
    | 'critical'
    | 'job_cancelled';
  title: string;
  body: string;
  href: string;
  read: boolean;
  createdAt: string;
}

export interface DashboardSummary {
  todaysJobs: number;
  upcomingJobs: number;
  tribunalHearings: number;
  completedThisWeek: number;
  weeklyEarnings: number;
  availableInPool: number;
  pendingSync: number;
  unclaimedEarnings: number;
}

export interface RoomInspectionEntry {
  area: string;
  condition: string;
  comments: string;
  photoCount: number;
  photoUrls: string[];
  /** Outgoing before/after rows — ingoing left, outgoing right. */
  ingoingPhotoUrls?: string[];
  outgoingPhotoUrls?: string[];
}

export interface OfflineQueueItem {
  id: string;
  jobId: string;
  action: string;
  payload: Record<string, unknown>;
  createdAt: string;
}
