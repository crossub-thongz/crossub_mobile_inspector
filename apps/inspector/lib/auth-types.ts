import type { Role, UserStatus } from '@/constants/roles';

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
  status: UserStatus;
  profileCompleted: boolean;
  systemAccessAgreementRequired?: boolean;
  systemAccessAccepted?: boolean;
  /** True when role SaA or INSPECTOR portal clickwrap is on file. */
  inspectorPortalAgreementAccepted?: boolean;
  systemAccessAcceptedAt?: string | null;
  systemAccessAgreementVersion?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  department?: string | null;
  jobTitle?: string | null;
}
