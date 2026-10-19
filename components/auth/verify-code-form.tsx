"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { resendVerificationAction, verifyEmailAction } from "@/app/actions/auth";
import { AuthAlert } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

type VerifyCodeFormProps = {
  email: string;
  /** Where to go once the account is verified and the session is live. */
  next: string;
  onBack?: () => void;
};

/** 6-digit email verification step (InsForge `verifyEmailMethod = "code"`). */
export function VerifyCodeForm({ email, next, onBack }: VerifyCodeFormProps) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [resending, startResend] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);

    if (code.trim().length !== 6) {
      setError("Enter the 6-digit code from your email.");
      return;
    }

    startTransition(async () => {
      const result = await verifyEmailAction({ email, otp: code.trim() });
      if (!result.ok) {
        setError(result.error ?? "That code is not valid.");
        return;
      }
      router.push(next);
      router.refresh();
    });
  }

  function handleResend() {
    setError(null);
    setNotice(null);
    startResend(async () => {
      const result = await resendVerificationAction({ email });
      if (result.ok) {
        setNotice(`A new code was sent to ${email}.`);
      } else {
        setError(result.error ?? "Could not resend the code.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <AuthAlert tone="info">
        We sent a 6-digit code to <span className="font-semibold">{email}</span>. Enter it below to
        activate your account.
      </AuthAlert>

      {error ? <AuthAlert>{error}</AuthAlert> : null}
      {notice ? <AuthAlert tone="info">{notice}</AuthAlert> : null}

      <div className="space-y-2">
        <label htmlFor="otp" className="text-sm font-medium text-zinc-300">
          Verification code
        </label>
        <Input
          id="otp"
          name="otp"
          inputMode="numeric"
          autoComplete="one-time-code"
          autoFocus
          maxLength={6}
          placeholder="123456"
          value={code}
          onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
          className="h-11 w-full rounded-lg border-zinc-700 bg-zinc-900/60 px-3 text-center font-mono text-lg tracking-[0.5em] text-zinc-100 placeholder:text-zinc-600 placeholder:tracking-normal focus-visible:border-sky-400"
        />
      </div>

      <Button
        type="submit"
        disabled={pending || resending}
        className="h-10 w-full bg-sky-400 text-sm font-semibold text-zinc-950 hover:bg-sky-300 disabled:opacity-60"
      >
        {pending ? (
          <>
            <Spinner /> Verifying…
          </>
        ) : (
          "Verify and continue"
        )}
      </Button>

      <div className="flex items-center justify-between text-sm">
        <button
          type="button"
          onClick={handleResend}
          disabled={resending || pending}
          className="text-zinc-400 transition-colors hover:text-zinc-200 disabled:opacity-60"
        >
          {resending ? "Resending…" : "Resend code"}
        </button>
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            disabled={pending || resending}
            className="text-zinc-400 transition-colors hover:text-zinc-200 disabled:opacity-60"
          >
            Back
          </button>
        ) : null}
      </div>
    </form>
  );
}
