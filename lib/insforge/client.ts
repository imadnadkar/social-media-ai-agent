import { createBrowserClient } from "@insforge/sdk/ssr";

/**
 * InsForge client for Client Components (browser only).
 *
 * Its auth surface is read-only (`getCurrentUser`, `getProfile`,
 * `getPublicAuthConfig`) — sign-in, sign-up, sign-out and OAuth must run on the
 * server through `app/actions/auth.ts` so the httpOnly refresh token stays
 * server-owned. The short-lived access token cookie is read automatically and
 * refreshed through `/api/auth/refresh`.
 */
export const insforge = createBrowserClient();
