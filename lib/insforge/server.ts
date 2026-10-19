import { cookies } from "next/headers";
import { createServerClient } from "@insforge/sdk/ssr";

/**
 * Shape returned by InsForge `getCurrentUser()` / auth responses.
 * Kept structural so server actions can reuse {@link toSessionUser}.
 */
export type InsForgeAuthUser = {
  id: string;
  email: string;
  emailVerified?: boolean;
  providers?: string[];
  createdAt?: string;
  profile?: {
    name?: string | null;
    avatar_url?: string | null;
  } | null;
} | null;

/** The app-facing, token-free view of the signed-in user. */
export type SessionUser = {
  id: string;
  email: string;
  emailVerified: boolean;
  name: string | null;
  image: string | null;
  providers: string[];
  createdAt: string | null;
};

/** Normalizes an InsForge user object into {@link SessionUser}. */
export function toSessionUser(user: InsForgeAuthUser): SessionUser | null {
  if (!user?.id || !user.email) return null;
  return {
    id: user.id,
    email: user.email,
    emailVerified: user.emailVerified ?? false,
    name: user.profile?.name ?? null,
    image: user.profile?.avatar_url ?? null,
    providers: user.providers ?? [],
    createdAt: user.createdAt ?? null,
  };
}

/**
 * Server-side InsForge client bound to the current request's auth cookies.
 * Use in Server Components, Route Handlers and Server Actions.
 */
export async function createInsForgeServerClient() {
  return createServerClient({ cookies: await cookies() });
}

/**
 * Returns the signed-in user for the current request, or `null` when there is
 * no valid session. Reads `insforge_access_token` (refreshed by `proxy.ts`).
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const insforge = await createInsForgeServerClient();
  const { data, error } = await insforge.auth.getCurrentUser();
  if (error || !data?.user) return null;
  return toSessionUser(data.user);
}
