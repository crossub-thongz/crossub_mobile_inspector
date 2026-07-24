export type InspectorOpenViewing = {
  id: string;
  propertyId: string;
  startTime: string;
  endTime: string;
  sessionStatus: string;
  openedAt?: string | null;
  startedEarly?: boolean;
  startedEarlyAt?: string | null;
  originalScheduledStart?: string | null;
  canStart?: boolean;
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
  hasApplication?: boolean;
};

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
