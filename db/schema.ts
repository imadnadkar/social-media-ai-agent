import { pgTable, serial, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    /** InsForge auth user id (auth.users.id) — links this row to the auth identity. */
    authId: text("auth_id"),
    name: text("name"),
    email: text("email").notNull(),
    image: text("image"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [uniqueIndex("users_email_unique").on(table.email), uniqueIndex("users_auth_id_unique").on(table.authId)]
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
