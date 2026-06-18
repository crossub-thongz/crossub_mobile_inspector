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
  licenceNumber: string;
  licenceType: string;
  licenceExpiry: string;
  insuranceProvider: string;
  insurancePolicyNumber: string;
  insuranceExpiry: string;
  serviceRegions: string[];
  tribunalQualified: boolean;
  emergencyContactName: string;
  emergencyContactPhone: string;
  bankAccountName: string;
  bankBsb: string;
  bankAccountNumber: string;
  registrationStatus: InspectorRegistrationStatus;
  submittedAt?: string;
  reviewedAt?: string;
}

export interface InspectorProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  tribunalQualified: boolean;
  weeklyEarnings: number;
  registration?: InspectorRegistration | null;
  registrationComplete: boolean;
}

export interface InspectionJob {
  id: string;
  type: InspectionType;
  propertyAddress: string;
  suburb: string;
  latitude: number;
  longitude: number;
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
  notes?: string;
  /** Estimated on-site hours for fee calculation */
  estimatedHours: number;
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
}

export interface InspectorNotification {
  id: string;
  type:
    | 'job_assigned'
    | 'job_available'
    | 'tribunal'
    | 'message'
    | 'sync_complete';
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
}

export interface RoomInspectionEntry {
  area: string;
  condition: string;
  comments: string;
  photoCount: number;
}

export interface OfflineQueueItem {
  id: string;
  jobId: string;
  action: string;
  payload: Record<string, unknown>;
  createdAt: string;
}
