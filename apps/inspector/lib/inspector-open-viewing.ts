export type InspectorOpenViewingVisitor = {
  id: string;
  name: string;
  email: string;
  phone: string;
  registrationSource: string;
  hasApplication?: boolean;
};

export type InspectorOpenViewing = {
  id: string;
  propertyId: string;
  startTime: string;
  endTime: string;
  checkInUrl: string;
  applyUrl: string;
  visitors: InspectorOpenViewingVisitor[];
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
