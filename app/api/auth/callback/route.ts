import { NextResponse, type NextRequest } from "next/server";
import { createAuthActions } from "@insforge/sdk/ssr";
import { syncUserToDatabase } from "@/lib/auth/sync-user";
import { toSessionUser, type InsForgeAuthUser } from "@/lib/insforge/server";

/**
 * OAuth (Google) callback. InsForge redirects here with `?insforge_code=…`
 * after the provider approves. We exchange the code for a session, persist the
 * user to our database on first sign-in, then continue to /dashboard.
 */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("insforge_code");
  const oauthError = request.nextUrl.searchParams.get("error");

  if (oauthError || !code) {
    const params = new URLSearchParams({ error: oauthError ? "oauth_failed" : "missing_code" });
    return NextResponse.redirect(new URL(`/sign-in?${params.toString()}`, request.url));
  }

  const codeVerifier = request.cookies.get("insforge_code_verifier")?.value;
  if (!codeVerifier) {
    return NextResponse.redirect(new URL("/sign-in?error=missing_verifier", request.url));
  }

  const response = NextResponse.redirect(new URL("/dashboard", request.url));
  const auth = createAuthActions({
    requestCookies: request.cookies,
    responseCookies: response.cookies,
  });

  const { data, error } = await auth.exchangeOAuthCode(code, codeVerifier);
  if (error || !data?.user) {
    console.error("[auth] OAuth code exchange failed", error);
    return NextResponse.redirect(new URL("/sign-in?error=exchange_failed", request.url));
  }

  response.cookies.delete("insforge_code_verifier");

  const sessionUser = toSessionUser(data.user as InsForgeAuthUser);
  if (sessionUser) await syncUserToDatabase(sessionUser);

  return response;
}
