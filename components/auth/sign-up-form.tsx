"use client";

import { useState, useTransition, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signUpAction } from "@/app/actions/auth";
import { AuthAlert } from "@/components/auth/auth-shell";
import { GoogleButton } from "@/components/auth/google-button";
import { VerifyCodeForm } from "@/components/auth/verify-code-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

type SignUpFormProps = {
  /** Sanitized internal path to restore after a successful sign-up. */
  next: string;
  initialError?: string | null;
};

export function SignUpForm({ next, initialError }: SignUpFormProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(initialError ?? null);
  const [verifyTarget, setVerifyTarget] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    startTransition(async () => {
      const result = await signUpAction({ name, email, password });

      if (!result.ok) {
        setError(result.error ?? "Unable to create your account.");
        return;
      }

      // Email verification is enabled on the backend → ask for the code.
      if (result.needsVerification) {
        setVerifyTarget(email.trim());
        return;
      }

      // Signed in immediately → session cookies are set, head to the dashboard.
      router.push(next);
      router.refresh();
    });
  }

  if (verifyTarget) {
    return (
      <VerifyCodeForm email={verifyTarget} next={next} onBack={() => setVerifyTarget(null)} />
    );
  }

  return (
    <div className="space-y-5">
      <GoogleButton disabled={pending} />

      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-zinc-800" />
        <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">or</span>
        <span className="h-px flex-1 bg-zinc-800" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error ? <AuthAlert>{error}</AuthAlert> : null}

        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-medium text-zinc-300">
            Name <span className="font-normal text-zinc-500">(optional)</span>
          </label>
          <Input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            placeholder="Jane Doe"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="h-10 w-full rounded-lg border-zinc-700 bg-zinc-900/60 px-3 text-zinc-100 placeholder:text-zinc-600 focus-visible:border-sky-400"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium text-zinc-300">
            Email
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="h-10 w-full rounded-lg border-zinc-700 bg-zinc-900/60 px-3 text-zinc-100 placeholder:text-zinc-600 focus-visible:border-sky-400"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium text-zinc-300">
            Password
          </label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="new-password"
            placeholder="At least 6 characters"
            minLength={6}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="h-10 w-full rounded-lg border-zinc-700 bg-zinc-900/60 px-3 text-zinc-100 placeholder:text-zinc-600 focus-visible:border-sky-400"
          />
        </div>

        <Button
          type="submit"
          disabled={pending}
          className="h-10 w-full bg-sky-400 text-sm font-semibold text-zinc-950 hover:bg-sky-300 disabled:opacity-60"
        >
          {pending ? (
            <>
              <Spinner /> Creating account…
            </>
          ) : (
            "Create account"
          )}
        </Button>
      </form>

      <p className="text-center text-sm text-zinc-400">
        Already have an account?{" "}
        <Link
          href={`/sign-in${next !== "/dashboard" ? `?next=${encodeURIComponent(next)}` : ""}`}
          className="font-semibold text-sky-400 transition-colors hover:text-sky-300"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
