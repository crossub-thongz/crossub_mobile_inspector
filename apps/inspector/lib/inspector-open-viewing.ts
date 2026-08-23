export type InspectorOpenViewing = {
  id: string;
  propertyId: string;
  startTime: string;
  endTime: string;
  sessionStatus: string;
  openedAt?: string | null;
  closedAt?: string | null;
  startedEarly?: boolean;
  startedEarlyAt?: string | null;
  originalScheduledStart?: string | null;
  canStart?: boolean;
  /** Level 1 prepaid — agent must pay before Start is allowed. */
  awaitingAgentPayment?: boolean;
  /** Inspector may finish the pool job before the scheduled window ends. */
  canCompleteEarly?: boolean;
  checkInUrl: string;
  applyUrl: string;
  visitors: InspectorOpenViewingVisitor[];
};

export type InspectorOpenViewingVisitor = {
  id: string;
  name: string;
  email: string;
  phone: string;
  registrationSource: string;
  attendanceStatus?: string;
  createdAt?: string;
  hasApplication?: boolean;
};

/** Prospects who already applied via the application form. */
export function isInterestedApplicant(
  visitor: InspectorOpenViewingVisitor,
): boolean {
  return Boolean(visitor.hasApplication);
}

/**
 * On-site check-ins. Application-form-only rows stay in Interested until they
 * also check in (attended / walk-in).
 */
export function isOpenInspectionCheckIn(
  visitor: InspectorOpenViewingVisitor,
): boolean {
  const attendance = (visitor.attendanceStatus ?? '').toLowerCase();
  if (attendance === 'attended' || attendance === 'no_show') return true;
  if (visitor.registrationSource === 'walk_in') return true;
  return !isInterestedApplicant(visitor);
}

export function splitOpenInspectionVisitors(
  visitors: InspectorOpenViewingVisitor[],
): {
  checkIns: InspectorOpenViewingVisitor[];
  interested: InspectorOpenViewingVisitor[];
} {
  return {
    checkIns: visitors.filter(isOpenInspectionCheckIn),
    interested: visitors.filter(isInterestedApplicant),
  };
}

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL ?? '/api'}/v1`;

export async function fetchOpenViewing(
  inspectionId: string,
): Promise<InspectorOpenViewing | null> {
  const res = await fetch(
    `${API_BASE}/inspector/inspections/${encodeURIComponent(inspectionId)}/open-viewing`,
    { credentials: 'include', cache: 'no-store' },
  );
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('Failed to load open viewing');
  return (await res.json()) as InspectorOpenViewing;
}

export async function startOpenViewing(
  inspectionId: string,
): Promise<InspectorOpenViewing> {
  const res = await fetch(
    `${API_BASE}/inspector/inspections/${encodeURIComponent(inspectionId)}/open-viewing/start`,
    {
      method: 'POST',
      credentials: 'include',
    },
  );
  if (!res.ok) {
    let detail = 'Could not start open inspection';
    try {
      const body = (await res.json()) as { message?: string | string[] };
      const msg = body.message;
      if (typeof msg === 'string' && msg.trim()) detail = msg;
      else if (Array.isArray(msg) && msg.length > 0) detail = msg.join(', ');
    } catch {
      // keep generic message
    }
    throw new Error(detail);
  }
  return (await res.json()) as InspectorOpenViewing;
}
