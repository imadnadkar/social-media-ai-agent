import { createRefreshAuthRouter } from "@insforge/sdk/ssr";

/**
 * Refreshes the InsForge session: exchanges the httpOnly refresh cookie for a
 * fresh access token. Called automatically by `createBrowserClient()` and by
 * `proxy.ts` before protected pages render.
 */
export const { POST } = createRefreshAuthRouter();
