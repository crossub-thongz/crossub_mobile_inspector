export interface SystemAccessAgreementView {
  agreementType: string;
  title: string;
  version: string;
  fileName: string;
  documentPath: string;
}

/** Always request the INSPECTOR clickwrap (name-only) from this app. */
export const INSPECTOR_SAA_PORTAL_QUERY = 'portal=inspector';

export function needsSystemAccessAgreement(user: {
  systemAccessAgreementRequired?: boolean;
  systemAccessAccepted?: boolean;
  inspectorPortalAgreementAccepted?: boolean;
}): boolean {
  if (!user.systemAccessAgreementRequired) return false;
  // Prefer the inspector-specific claim (covers dual-hat staff who signed name-only).
  if (user.inspectorPortalAgreementAccepted) return false;
  if (user.systemAccessAccepted) return false;
  return true;
}

export function needsPasswordChange(user: { mustChangePassword?: boolean }): boolean {
  return Boolean(user.mustChangePassword);
}

export function needsPasswordChangeWithoutCurrent(user: {
  mustChangePasswordWithoutCurrent?: boolean;
}): boolean {
  return Boolean(user.mustChangePasswordWithoutCurrent);
}

/**
 * Post-login destination order:
 * 1) System access agreement (if required)
 * 2) Forced password change (temp / first-login password)
 * 3) Default app route
 */
export function postAuthDestination(
  user: {
    systemAccessAgreementRequired?: boolean;
    systemAccessAccepted?: boolean;
    inspectorPortalAgreementAccepted?: boolean;
    mustChangePassword?: boolean;
  },
  defaultRoute: string,
  agreementRoute: string,
  changePasswordRoute: string = '/change-password',
): string {
  if (needsSystemAccessAgreement(user)) return agreementRoute;
  if (needsPasswordChange(user)) return changePasswordRoute;
  return defaultRoute;
}

/** After inspector profile details are saved — agreement before dashboard. */
export function postRegistrationDestination(
  user: {
    systemAccessAgreementRequired?: boolean;
    systemAccessAccepted?: boolean;
    inspectorPortalAgreementAccepted?: boolean;
  },
  dashboardRoute: string,
  agreementRoute: string,
): string {
  return needsSystemAccessAgreement(user) ? agreementRoute : dashboardRoute;
}
