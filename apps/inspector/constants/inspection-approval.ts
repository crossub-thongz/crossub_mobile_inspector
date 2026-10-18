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

/**
 * Who signs off a submitted ingoing/outgoing report. A CROSSUB inspector's report waits
 * for a CROSSUB officer; an agency inspector's waits for their agency principal.
 */
export interface InspectionApprovalCopy {
  /** Disabled CTA on a job waiting for sign-off. */
  pendingLabel: string;
  /** Status line / badge for a job waiting for sign-off. */
  awaitingLabel: string;
  /** Toast after the report is filed. */
  submittedToast: string;
  /** Who reviews the report, as in "Ingoing report sent for … review". */
  reviewer: string;
  /** Report card note before sign-off. */
  filedNote: string;
}

export const CROSSUB_APPROVAL_COPY: InspectionApprovalCopy = {
  pendingLabel: 'Pending Approval',
  awaitingLabel: 'Awaiting approval',
  submittedToast: 'Report submitted — awaiting approval',
  reviewer: 'account manager',
  filedNote: 'The submitted report as filed for CROSSUB review.',
};

export const AGENCY_APPROVAL_COPY: InspectionApprovalCopy = {
  pendingLabel: 'Pending agency approval',
  awaitingLabel: 'Awaiting agency approval',
  submittedToast: 'Report submitted — awaiting agency approval',
  reviewer: 'agency',
  filedNote: 'The submitted report as filed for agency review.',
};

export function approvalCopy(agencyMode: boolean): InspectionApprovalCopy {
  return agencyMode ? AGENCY_APPROVAL_COPY : CROSSUB_APPROVAL_COPY;
}

export function approvalPendingLabel(agencyMode: boolean): string {
  return approvalCopy(agencyMode).pendingLabel;
}
