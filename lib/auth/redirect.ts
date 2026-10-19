/** Query-param value that may be a string or an array (Next.js searchParams). */
type ParamValue = string | string[] | undefined;

/**
 * Validates the post-authentication redirect target so we only ever navigate
 * to a safe, internal, non-auth page (blocks `//evil.com`, absolute URLs and
 * sign-in ⇄ sign-up loops).
 */
export function safeNextPath(value: ParamValue, fallback = "/dashboard"): string {
  const candidate = Array.isArray(value) ? value[0] : value;
  if (!candidate) return fallback;
  if (!candidate.startsWith("/") || candidate.startsWith("//")) return fallback;
  if (candidate.startsWith("/sign-in") || candidate.startsWith("/sign-up")) return fallback;
  return candidate;
}

/** Maps the `?error=` codes emitted by the auth routes to readable copy. */
export function authErrorMessage(code: ParamValue): string | null {
  const key = Array.isArray(code) ? code[0] : code;
  if (!key) return null;

  switch (key) {
    case "session":
      return "Your session has expired. Please sign in again.";
    case "oauth_failed":
      return "Google sign-in was cancelled or failed. Please try again.";
    case "missing_code":
      return "Google sign-in did not return a confirmation. Please try again.";
    case "missing_verifier":
      return "Your sign-in attempt expired. Please start again.";
    case "exchange_failed":
      return "We could not complete Google sign-in. Please try again.";
    default:
      return "Something went wrong. Please try again.";
  }
}
