import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { syncUserToDatabase } from "@/lib/auth/sync-user";
import { getSessionUser, type SessionUser } from "@/lib/insforge/server";
import type { User } from "@/db";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your social media AI agent dashboard.",
};

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function DashboardPage({ searchParams }: PageProps) {
  const params = await searchParams;

  // Route-level guard: `proxy.ts` already blocks anonymous traffic, this
  // double-checks the session against InsForge before anything renders.
  const authUser = await getSessionUser();
  if (!authUser) {
    const error = params.error ? `&error=${encodeURIComponent(String(params.error))}` : "";
    redirect(`/sign-in?next=/dashboard${error || "&error=session"}`);
  }

  // Guarantees the user row exists from the very first authenticated visit.
  const dbUser: User | null = await syncUserToDatabase(authUser);

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100">
      <header className="sticky top-0 z-50 border-b border-zinc-800/80 bg-[#09090b]/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <a href="/" className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-sky-400 to-indigo-400 text-sm font-bold text-zinc-950">
              F
            </span>
            <span className="text-base font-extrabold tracking-tight text-zinc-50">FastNextJS</span>
          </a>

          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-zinc-400 sm:inline">{authUser.email}</span>
            <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-zinc-700 bg-zinc-800 text-sm font-semibold text-zinc-200">
              {authUser.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={authUser.image} alt="" className="h-9 w-9 object-cover" />
              ) : (
                initials(authUser)
              )}
            </span>
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="mb-8">
          <p className="text-sm font-medium uppercase tracking-wider text-sky-400">Authenticated</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-zinc-50">
            Welcome back{authUser.name ? `, ${authUser.name}` : ""}
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            You&apos;re signed in with InsForge. Only authenticated users can open this page.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <InfoCard
            title="InsForge session"
            description="Identity issued by InsForge Auth for this request."
            rows={[
              ["Email", authUser.email],
              ["Email verified", authUser.emailVerified ? "Yes" : "No"],
              ["Providers", authUser.providers.length ? authUser.providers.join(", ") : "password"],
              ["Auth user id", authUser.id],
            ]}
          />

          <InfoCard
            title="Postgres record"
            description={
              dbUser
                ? "Persisted to public.users the first time this account authenticated."
                : "Could not reach the database — the row will be created on your next sign-in."
            }
            highlight={!dbUser}
            rows={
              dbUser
                ? [
                    ["Row id", String(dbUser.id)],
                    ["Name", dbUser.name ?? "—"],
                    ["Email", dbUser.email],
                    ["Image", dbUser.image ?? "—"],
                    ["Linked auth id", dbUser.authId ?? "—"],
                    ["Created", formatDate(dbUser.createdAt)],
                    ["Updated", formatDate(dbUser.updatedAt)],
                  ]
                : []
            }
          />
        </div>
      </main>
    </div>
  );
}

function InfoCard({
  title,
  description,
  rows,
  highlight = false,
}: {
  title: string;
  description: string;
  rows: [string, string][];
  highlight?: boolean;
}) {
  return (
    <section className="rounded-2xl border border-zinc-800 bg-[#121214] p-6">
      <h2 className="text-lg font-semibold text-zinc-50">{title}</h2>
      <p
        className={`mt-1 text-sm ${highlight ? "text-amber-400" : "text-zinc-400"}`}
      >
        {description}
      </p>

      {rows.length ? (
        <dl className="mt-5 space-y-3">
          {rows.map(([label, value]) => (
            <div
              key={label}
              className="flex flex-col gap-1 border-b border-zinc-800/70 pb-3 last:border-0 last:pb-0 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4"
            >
              <dt className="text-sm font-medium text-zinc-500">{label}</dt>
              <dd className="break-all text-right font-mono text-sm text-zinc-200">{value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </section>
  );
}

function initials(user: SessionUser): string {
  const source = user.name?.trim() || user.email;
  return source.slice(0, 2).toUpperCase();
}

function formatDate(value: Date | string): string {
  const date = typeof value === "string" ? new Date(value) : value;
  if (!date || Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString();
}
