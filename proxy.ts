import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@insforge/sdk/ssr/middleware";

/** Routes that require a signed-in user. */
const PROTECTED_PREFIXES = ["/dashboard"];

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

/**
 * Refreshes the InsForge session cookies before Server Components render and
 * keeps unauthenticated visitors out of /dashboard.
 *
 * - Valid/expired access tokens are refreshed through the InsForge backend.
 * - When the refresh fails the auth cookies are cleared and the user is sent to
 *   `/sign-in?next=…` (the original destination is restored after signing in).
 */
export async function proxy(request: NextRequest) {
  const response = NextResponse.next({ request });

  const { accessToken } = await updateSession({
    requestCookies: request.cookies,
    responseCookies: response.cookies,
  });

  const { pathname, search } = request.nextUrl;

  if (isProtectedPath(pathname) && !accessToken) {
    const signInUrl = new URL("/sign-in", request.url);
    signInUrl.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(signInUrl);
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
