import { INSPECTION_PAY_RATES_AUD } from '@/constants/inspection';
import type {
  EarningsRecord,
  InspectionJob,
  InspectorNotification,
  InspectorProfile,
  MessageThread,
  ThreadMessage,
  TribunalHearing,
} from '@/lib/types';

const today = new Date();
const tomorrow = new Date(today);
tomorrow.setDate(tomorrow.getDate() + 1);
const nextWeek = new Date(today);
nextWeek.setDate(nextWeek.getDate() + 5);
const lastWeek = new Date(today);
lastWeek.setDate(lastWeek.getDate() - 3);

const iso = (d: Date, hour = 10, minute = 0) => {
  const copy = new Date(d);
  copy.setHours(hour, minute, 0, 0);
  return copy.toISOString();
};

export const INSPECTOR_PROFILE: InspectorProfile = {
  id: 'insp-001',
  name: 'Alex Chen',
  email: 'alex.chen@crossub.com.au',
  phone: '0412 345 678',
  tribunalQualified: true,
  weeklyEarnings: 385,
};

export const JOBS: InspectionJob[] = [
  {
    id: 'job-001',
    type: 'open',
    propertyAddress: '12 Harbour View Rd, Pyrmont NSW 2009',
    suburb: 'Pyrmont',
    latitude: -33.8688,
    longitude: 151.1957,
    scheduledDate: iso(today, 9, 30),
    scheduledTime: iso(today, 9, 30),
    priority: 'urgent',
    distanceKm: 4.2,
    status: 'accepted',
    source: 'assigned',
    assignedBy: 'Sarah Mitchell',
    agentName: 'Sarah Mitchell',
    agentCompany: 'Harbour Property Group',
    payAmount: INSPECTION_PAY_RATES_AUD.open,
    workflowStep: 1,
  },
  {
    id: 'job-002',
    type: 'ingoing',
    propertyAddress: '45 George St, Parramatta NSW 2150',
    suburb: 'Parramatta',
    latitude: -33.815,
    longitude: 151.001,
    scheduledDate: iso(today, 14, 0),
    scheduledTime: iso(today, 14, 0),
    priority: 'normal',
    distanceKm: 18.5,
    status: 'assigned',
    source: 'assigned',
    assignedBy: 'James Wu',
    tenantName: 'Emma Thompson',
    tenantPhone: '0423 111 222',
    agentName: 'James Wu',
    agentCompany: 'Western Sydney Realty',
    payAmount: INSPECTION_PAY_RATES_AUD.ingoing,
  },
  {
    id: 'job-003',
    type: 'routine',
    propertyAddress: '8 Rose Lane, Chatswood NSW 2067',
    suburb: 'Chatswood',
    latitude: -33.796,
    longitude: 151.183,
    scheduledDate: iso(tomorrow, 11, 0),
    scheduledTime: iso(tomorrow, 11, 0),
    priority: 'normal',
    distanceKm: 12.1,
    status: 'accepted',
    source: 'pool',
    tenantName: 'Michael Park',
    payAmount: INSPECTION_PAY_RATES_AUD.routine,
  },
  {
    id: 'job-004',
    type: 'outgoing',
    propertyAddress: '22 Bondi Rd, Bondi NSW 2026',
    suburb: 'Bondi',
    latitude: -33.891,
    longitude: 151.259,
    scheduledDate: iso(tomorrow, 15, 30),
    scheduledTime: iso(tomorrow, 15, 30),
    priority: 'urgent',
    distanceKm: 9.8,
    status: 'available',
    source: 'pool',
    payAmount: INSPECTION_PAY_RATES_AUD.outgoing,
  },
  {
    id: 'job-005',
    type: 'open',
    propertyAddress: '3 Market St, Sydney NSW 2000',
    suburb: 'Sydney CBD',
    latitude: -33.87,
    longitude: 151.206,
    scheduledDate: iso(nextWeek, 10, 0),
    scheduledTime: iso(nextWeek, 10, 0),
    priority: 'normal',
    distanceKm: 2.1,
    status: 'available',
    source: 'pool',
    payAmount: INSPECTION_PAY_RATES_AUD.open,
  },
  {
    id: 'job-006',
    type: 'routine',
    propertyAddress: '17 Pacific Hwy, St Leonards NSW 2065',
    suburb: 'St Leonards',
    latitude: -33.823,
    longitude: 151.195,
    scheduledDate: iso(lastWeek, 10, 0),
    scheduledTime: iso(lastWeek, 10, 0),
    priority: 'normal',
    distanceKm: 8.4,
    status: 'completed',
    source: 'assigned',
    assignedBy: 'Sarah Mitchell',
    payAmount: INSPECTION_PAY_RATES_AUD.routine,
    workflowStep: 99,
  },
  {
    id: 'job-007',
    type: 'ingoing',
    propertyAddress: '99 Victoria Ave, Chatswood NSW 2067',
    suburb: 'Chatswood',
    latitude: -33.797,
    longitude: 151.18,
    scheduledDate: iso(lastWeek, 13, 0),
    scheduledTime: iso(lastWeek, 13, 0),
    priority: 'normal',
    distanceKm: 11.2,
    status: 'completed',
    source: 'pool',
    payAmount: INSPECTION_PAY_RATES_AUD.ingoing,
    workflowStep: 99,
  },
];

export const TRIBUNALS: TribunalHearing[] = [
  {
    id: 'trib-001',
    jobId: 'job-trib-001',
    hearingDate: iso(nextWeek, 9, 0),
    hearingTime: iso(nextWeek, 9, 0),
    tribunalType: 'NCAT — Rental Bond',
    location: 'NCAT Sydney, 255 Elizabeth St',
    propertyAddress: '5/88 Crown St, Surry Hills NSW 2010',
    caseSummary: 'Bond claim for cleaning and minor damage at end of lease.',
    rentalArrears: 0,
    bondClaimAmount: 1850,
    propertyDamage: 'Carpet stain (living room), wall scuff (bedroom 2)',
    checklist: {
      evidenceComplete: true,
      hearingConfirmed: true,
      documentsDownloaded: false,
      attendanceConfirmed: false,
    },
    packageDocuments: [
      { name: 'Lease Agreement.pdf', url: '#' },
      { name: 'Ingoing Inspection Report.pdf', url: '#' },
      { name: 'Outgoing Inspection Report.pdf', url: '#' },
      { name: 'Tenant Ledger.pdf', url: '#' },
      { name: 'Tribunal Application.pdf', url: '#' },
    ],
    status: 'upcoming',
  },
];

export const EARNINGS: EarningsRecord[] = [
  {
    id: 'earn-001',
    jobId: 'job-006',
    type: 'routine',
    propertyAddress: '17 Pacific Hwy, St Leonards NSW 2065',
    completedAt: iso(lastWeek, 11, 30),
    amount: INSPECTION_PAY_RATES_AUD.routine,
  },
  {
    id: 'earn-002',
    jobId: 'job-007',
    type: 'ingoing',
    propertyAddress: '99 Victoria Ave, Chatswood NSW 2067',
    completedAt: iso(lastWeek, 15, 0),
    amount: INSPECTION_PAY_RATES_AUD.ingoing,
  },
  {
    id: 'earn-003',
    jobId: 'job-prev-001',
    type: 'open',
    propertyAddress: '14 King St, Newtown NSW 2042',
    completedAt: iso(new Date(today.getTime() - 5 * 86400000), 12, 0),
    amount: INSPECTION_PAY_RATES_AUD.open,
  },
];

export const MESSAGE_THREADS: MessageThread[] = [
  {
    id: 'msg-001',
    subject: 'Open inspection — 12 Harbour View Rd',
    participants: ['Sarah Mitchell', 'Alex Chen'],
    lastMessage: 'Tenant confirmed for 9:30am. Keys in lockbox 4821.',
    lastAt: iso(today, 8, 15),
    unread: 1,
    category: 'agent',
  },
  {
    id: 'msg-002',
    subject: 'Tribunal package — Surry Hills',
    participants: ['Leasing Team', 'Alex Chen'],
    lastMessage: 'Updated tenant ledger attached for NCAT hearing.',
    lastAt: iso(today, 7, 0),
    unread: 0,
    category: 'leasing',
  },
];

export const THREAD_MESSAGES: Record<string, ThreadMessage[]> = {
  'msg-001': [
    {
      id: 'tm-001',
      from: 'Sarah Mitchell',
      body: 'Hi Alex, open inspection today at Harbour View. Please confirm arrival.',
      at: iso(today, 7, 45),
    },
    {
      id: 'tm-002',
      from: 'Alex Chen',
      body: 'Confirmed — leaving now, ETA 9:20.',
      at: iso(today, 8, 0),
    },
    {
      id: 'tm-003',
      from: 'Sarah Mitchell',
      body: 'Tenant confirmed for 9:30am. Keys in lockbox 4821.',
      at: iso(today, 8, 15),
    },
  ],
  'msg-002': [
    {
      id: 'tm-004',
      from: 'Leasing Team',
      body: 'Tribunal package ready. Please review bond claim evidence before Friday.',
      at: iso(new Date(today.getTime() - 86400000), 16, 0),
    },
    {
      id: 'tm-005',
      from: 'Leasing Team',
      body: 'Updated tenant ledger attached for NCAT hearing.',
      at: iso(today, 7, 0),
      attachments: [{ name: 'Tenant_Ledger_Surry_Hills.pdf', url: '#' }],
    },
  ],
};

export const NOTIFICATIONS: InspectorNotification[] = [
  {
    id: 'notif-001',
    type: 'job_assigned',
    title: 'New assignment',
    body: 'Ingoing inspection assigned — 45 George St, Parramatta',
    href: '/jobs/job-002',
    read: false,
    createdAt: iso(today, 6, 30),
  },
  {
    id: 'notif-002',
    type: 'tribunal',
    title: 'Tribunal hearing scheduled',
    body: 'NCAT Sydney — 5/88 Crown St, Surry Hills',
    href: '/tribunal/trib-001',
    read: false,
    createdAt: iso(today, 7, 0),
  },
  {
    id: 'notif-003',
    type: 'job_available',
    title: 'Job available in pool',
    body: 'Outgoing inspection — 22 Bondi Rd, Bondi (urgent)',
    href: '/job-pool',
    read: true,
    createdAt: iso(new Date(today.getTime() - 3600000), 5, 0),
  },
];
