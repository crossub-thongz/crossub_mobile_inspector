import type { InspectionJob } from '@/lib/types';

const ACCESS_METHOD_LABEL: Record<string, string> = {
  lockbox: 'Collect from lockbox',
  office: 'Collect from office',
  agent: 'Collect from agent',
};

export function jobAccessMethodLabel(job: InspectionJob): string {
  const method = job.keyAccess?.method;
  if (method && ACCESS_METHOD_LABEL[method]) return ACCESS_METHOD_LABEL[method];
  if (job.tenantName) return 'Meet with tenant';
  return '—';
}

export function jobKeysCountLabel(job: InspectionJob): string {
  const count =
    job.leasingKeyCollection?.keyCollection?.tenantReport?.keysCount ?? null;
  if (count != null && count >= 0) {
    return `${count} set${count === 1 ? '' : 's'}`;
  }
  if (job.keyAccess) return '1 set';
  return '—';
}
