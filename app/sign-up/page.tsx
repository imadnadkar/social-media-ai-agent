import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignUpForm } from "@/components/auth/sign-up-form";
import { authErrorMessage, safeNextPath } from "@/lib/auth/redirect";
import { getSessionUser } from "@/lib/insforge/server";

export const metadata: Metadata = {
  title: "Create account",
  description: "Create a new account.",
};

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SignUpPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const next = safeNextPath(params.next);
  const error = authErrorMessage(params.error);

  // Already authenticated → straight to the dashboard.
  const user = await getSessionUser();
  if (user) redirect(next);

  return (
    <AuthShell
      title="Create your account"
      subtitle="Start automating your social media in minutes"
    >
      <SignUpForm next={next} initialError={error} />
    </AuthShell>
  );
}
