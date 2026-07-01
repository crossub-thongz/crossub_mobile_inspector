/** Emergency / urgent tasks: extra payout when inspector cancels in the field. */
export const EMERGENCY_CANCEL_BONUS_AUD = 10;

export const CANCEL_TASK_MODES = {
  FLAG_ADMIN: 'flag_admin',
  RELEASE_POOL: 'release_pool',
} as const;

export type CancelTaskMode =
  (typeof CANCEL_TASK_MODES)[keyof typeof CANCEL_TASK_MODES];

export const CANCEL_TASK_MODE_LABEL: Record<CancelTaskMode, string> = {
  flag_admin: 'Flag cancellation to Admin',
  release_pool: 'Release task back to job pool',
};

export const MIN_CANCEL_REASON_LENGTH = 10;
