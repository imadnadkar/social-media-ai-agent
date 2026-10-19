/** Result returned by the auth Server Actions (must stay token-free). */
export type AuthActionResult = {
  ok: boolean;
  /** Human readable failure reason, safe to show in the UI. */
  error?: string;
  /** InsForge status code (403 = email verification required, 401 = bad credentials…). */
  statusCode?: number;
  /** Sign-up only: the account was created and a verification code was emailed. */
  needsVerification?: boolean;
};
