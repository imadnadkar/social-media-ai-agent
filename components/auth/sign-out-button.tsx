"use client";

import { useTransition } from "react";
import { signOutAction } from "@/app/actions/auth";
import { Spinner } from "@/components/ui/spinner";

export function SignOutButton() {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      onClick={() => startTransition(() => signOutAction())}
      disabled={pending}
      className="flex h-9 items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900/60 px-3.5 text-sm font-medium text-zinc-200 transition-colors hover:border-zinc-600 hover:bg-zinc-800/70 disabled:opacity-60"
    >
      {pending ? <Spinner /> : null}
      {pending ? "Signing out…" : "Sign out"}
    </button>
  );
}
