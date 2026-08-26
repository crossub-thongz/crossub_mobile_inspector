/**
 * Officer sign-off on a finished inspection. Same cutoff as the web Task Pool
 * (`INSPECTION_APPROVAL_GO_LIVE` in crossub_web).
 *
 * Approval did not exist until this instant, so every older COMPLETED ingoing/outgoing
 * row has a null `approvedAt`. The inspector already finished those jobs — they belong
 * on Completed, not Pending Approval. Work finished from this instant on with no stamp
 * still waits for an officer.
 */
export const INSPECTION_APPROVAL_GO_LIVE = '2026-08-13T14:00:00.000Z';

export function isAfterInspectionApprovalGoLive(
  completedAt: Date | string,
): boolean {
  const completed =
    completedAt instanceof Date
      ? completedAt.getTime()
      : new Date(completedAt).getTime();
  if (Number.isNaN(completed)) return false;
  return completed >= new Date(INSPECTION_APPROVAL_GO_LIVE).getTime();
}

/** Inspector finished after approval existed, and no officer has signed off yet. */
export function inspectionAwaitingOfficerApproval(job: {
  completedAt?: Date | string | null;
  approvedAt?: string | null;
}): boolean {
  if (job.approvedAt) return false;
  if (!job.completedAt) return false;
  return isAfterInspectionApprovalGoLive(job.completedAt);
}
