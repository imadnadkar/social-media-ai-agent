import { eq } from "drizzle-orm";
import { db, users, type User } from "@/db";
import type { SessionUser } from "@/lib/insforge/server";

/**
 * Persists the authenticated InsForge user into our Postgres `users` table.
 *
 * Runs after every successful sign-up, email verification, password sign-in and
 * OAuth callback, so the first time a user authenticates their record is
 * created — and later sign-ins keep name/image in sync. Idempotent: an existing
 * row (matched by email, then by auth id) is updated instead of duplicated.
 *
 * Never throws — an auth session must not be broken by a database hiccup; the
 * row is simply retried on the next sign-in.
 */
export async function syncUserToDatabase(authUser: SessionUser): Promise<User | null> {
  const email = authUser.email?.trim().toLowerCase();
  if (!email) return null;

  try {
    const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);

    if (!existing) {
      const [inserted] = await db
        .insert(users)
        .values({
          authId: authUser.id,
          name: authUser.name,
          image: authUser.image,
          email,
        })
        .onConflictDoUpdate({
          target: users.email,
          set: {
            authId: authUser.id,
            name: authUser.name,
            image: authUser.image,
            updatedAt: new Date(),
          },
        })
        .returning();
      return inserted ?? null;
    }

    const patch: Partial<typeof users.$inferInsert> = {};
    if (authUser.id && existing.authId !== authUser.id) patch.authId = authUser.id;
    if (authUser.name && existing.name !== authUser.name) patch.name = authUser.name;
    if (authUser.image && existing.image !== authUser.image) patch.image = authUser.image;
    if (Object.keys(patch).length === 0) return existing;

    const [updated] = await db
      .update(users)
      .set({ ...patch, updatedAt: new Date() })
      .where(eq(users.id, existing.id))
      .returning();

    return updated ?? existing;
  } catch (error) {
    console.error("[auth] Failed to persist user to the database", {
      authId: authUser.id,
      email,
      error,
    });
    return null;
  }
}
