"use client";

import { useState, useTransition } from "react";
import { signInWithGoogleAction } from "@/app/actions/auth";
import { AuthAlert, GoogleIcon } from "@/components/auth/auth-shell";
import { Spinner } from "@/components/ui/spinner";

/** Google OAuth button — runs the whole flow through a Server Action. */
export function GoogleButton({ disabled }: { disabled?: boolean }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    startTransition(async () => {
      try {
        const result = await signInWithGoogleAction();
        if (!result.ok) setError(result.error ?? "Could not start Google sign-in.");
      } catch {
        setError("Could not start Google sign-in. Please try again.");
      }
    });
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending || disabled}
        className="flex h-10 w-full items-center justify-center gap-2.5 rounded-lg border border-zinc-700 bg-zinc-900/60 text-sm font-medium text-zinc-100 transition-colors hover:border-zinc-600 hover:bg-zinc-800/70 disabled:pointer-events-none disabled:opacity-60"
      >
        {pending ? <Spinner className="h-4 w-4 text-zinc-400" /> : <GoogleIcon />}
        {pending ? "Redirecting to Google…" : "Continue with Google"}
      </button>
      {error ? <AuthAlert>{error}</AuthAlert> : null}
    </div>
  );
}
