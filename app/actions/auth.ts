"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createAuthActions } from "@insforge/sdk/ssr";
import { syncUserToDatabase } from "@/lib/auth/sync-user";
import type { AuthActionResult } from "@/lib/auth/types";
import {
  createInsForgeServerClient,
  getSessionUser,
  toSessionUser,
  type InsForgeAuthUser,
} from "@/lib/insforge/server";

/** Public origin of this app — used for OAuth redirect targets. */
const appUrl = () => process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

/** The OAuth callback route that exchanges the provider code for a session. */
const oauthCallbackUrl = () => new URL("/api/auth/callback", appUrl()).toString();

type AuthErrorLike = { message?: string; statusCode?: number } | null | undefined;

function failure(error: AuthErrorLike, fallback: string): AuthActionResult {
  return {
    ok: false,
    error: error?.message || fallback,
    statusCode: error?.statusCode,
  };
}

/**
 * Every successful authentication ends here: resolve the session user and
 * persist it to our `users` table on first sign-in/sign-up (idempotent).
 */
async function persistSessionUser(user: InsForgeAuthUser): Promise<void> {
  const sessionUser = toSessionUser(user) ?? (await getSessionUser());
  if (sessionUser) await syncUserToDatabase(sessionUser);
}

/** Email + password sign-in. On success the session cookies are set. */
export async function signInAction(input: {
  email: string;
  password: string;
}): Promise<AuthActionResult> {
  const email = input.email?.trim();
  const password = input.password ?? "";

  if (!email || !password) {
    return { ok: false, error: "Email and password are required." };
  }

  try {
    const auth = createAuthActions({ cookies: await cookies() });
    const { data, error } = await auth.signInWithPassword({ email, password });

    if (error) return failure(error, "Unable to sign in. Please try again.");
    if (!data?.user) return { ok: false, error: "Unable to sign in. Please try again." };

    await persistSessionUser(data.user as InsForgeAuthUser);
    return { ok: true };
  } catch (err) {
    console.error("[auth] signInAction failed", err);
    return { ok: false, error: "Something went wrong while signing you in." };
  }
}

/** Creates the account. Returns `needsVerification` when InsForge emailed a code. */
export async function signUpAction(input: {
  name?: string;
  email: string;
  password: string;
}): Promise<AuthActionResult> {
  const email = input.email?.trim();
  const name = input.name?.trim();
  const password = input.password ?? "";

  if (!email || !password) {
    return { ok: false, error: "Email and password are required." };
  }
  if (password.length < 6) {
    return { ok: false, error: "Password must be at least 6 characters." };
  }

  try {
    const auth = createAuthActions({ cookies: await cookies() });
    const { data, error } = await auth.signUp({
      email,
      password,
      ...(name ? { name } : {}),
    });

    if (error) return failure(error, "Unable to create your account.");

    if (data?.requireEmailVerification) {
      return { ok: true, needsVerification: true };
    }

    await persistSessionUser(data?.user as InsForgeAuthUser);
    return { ok: true };
  } catch (err) {
    console.error("[auth] signUpAction failed", err);
    return { ok: false, error: "Something went wrong while creating your account." };
  }
}

/** Confirms the 6-digit code from the sign-up (or unverified sign-in) flow. */
export async function verifyEmailAction(input: {
  email: string;
  otp: string;
}): Promise<AuthActionResult> {
  const email = input.email?.trim();
  const otp = input.otp?.trim();

  if (!email || !otp) {
    return { ok: false, error: "Enter the 6-digit verification code." };
  }

  try {
    const auth = createAuthActions({ cookies: await cookies() });
    const { data, error } = await auth.verifyEmail({ email, otp });

    if (error) return failure(error, "That verification code is not valid.");

    await persistSessionUser((data as { user?: InsForgeAuthUser } | null)?.user ?? null);
    return { ok: true };
  } catch (err) {
    console.error("[auth] verifyEmailAction failed", err);
    return { ok: false, error: "Unable to verify your email right now." };
  }
}

/** Re-sends the verification code for an account that is still unverified. */
export async function resendVerificationAction(input: {
  email: string;
}): Promise<AuthActionResult> {
  const email = input.email?.trim();
  if (!email) return { ok: false, error: "Email is required." };

  try {
    const insforge = await createInsForgeServerClient();
    const { error } = await insforge.auth.resendVerificationEmail({
      email,
      redirectTo: new URL("/sign-in", appUrl()).toString(),
    });

    if (error) return failure(error, "Could not resend the verification code.");
    return { ok: true };
  } catch (err) {
    console.error("[auth] resendVerificationAction failed", err);
    return { ok: false, error: "Could not resend the verification code." };
  }
}

/**
 * Starts the Google OAuth flow. The PKCE verifier is kept in an httpOnly cookie
 * and the code is exchanged for a session in `/api/auth/callback`.
 */
export async function signInWithGoogleAction(): Promise<AuthActionResult> {
  const cookieStore = await cookies();
  let authorizationUrl: string;
  let codeVerifier: string;

  try {
    const auth = createAuthActions({ cookies: cookieStore });
    const { data, error } = await auth.signInWithOAuth("google", {
      redirectTo: oauthCallbackUrl(),
      additionalParams: { prompt: "select_account" },
      skipBrowserRedirect: true,
    });

    if (error || !data?.url || !data.codeVerifier) {
      return failure(error, "Could not start Google sign-in.");
    }

    authorizationUrl = data.url;
    codeVerifier = data.codeVerifier;
  } catch (err) {
    console.error("[auth] signInWithGoogleAction failed", err);
    return { ok: false, error: "Could not start Google sign-in." };
  }

  cookieStore.set("insforge_code_verifier", codeVerifier, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });

  redirect(authorizationUrl);
}

/** Clears the InsForge session cookies and returns the user to the sign-in page. */
export async function signOutAction(): Promise<void> {
  try {
    const auth = createAuthActions({ cookies: await cookies() });
    await auth.signOut();
  } catch (err) {
    console.error("[auth] signOutAction failed", err);
  }
  redirect("/sign-in");
}
