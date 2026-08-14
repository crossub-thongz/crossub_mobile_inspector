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

export function postAuthDestination(
  user: {
    systemAccessAgreementRequired?: boolean;
    systemAccessAccepted?: boolean;
    inspectorPortalAgreementAccepted?: boolean;
  },
  defaultRoute: string,
  agreementRoute: string,
): string {
  return needsSystemAccessAgreement(user) ? agreementRoute : defaultRoute;
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
