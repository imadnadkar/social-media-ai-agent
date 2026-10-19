import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignInForm } from "@/components/auth/sign-in-form";
import { authErrorMessage, safeNextPath } from "@/lib/auth/redirect";
import { getSessionUser } from "@/lib/insforge/server";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your account.",
};

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SignInPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const next = safeNextPath(params.next);
  const error = authErrorMessage(params.error);

  // Already authenticated → straight to the dashboard.
  const user = await getSessionUser();
  if (user) redirect(next);

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to continue to your dashboard">
      <SignInForm next={next} initialError={error} />
    </AuthShell>
  );
}
