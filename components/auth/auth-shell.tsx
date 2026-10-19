import Link from "next/link";
import type { ReactNode } from "react";

type AuthShellProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
};

/**
 * Shared dark shell for /sign-in and /sign-up — matches the landing page
 * (zinc-950 canvas, sky/indigo glows, bordered card).
 */
export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#09090b] px-4 py-12 text-zinc-100">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-sky-500/15 blur-[120px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-purple-500/15 blur-[120px]"
      />

      <div className="relative z-10 w-full max-w-[420px]">
        <Link href="/" className="mb-6 flex items-center justify-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-sky-400 to-indigo-400 text-sm font-bold text-zinc-950">
            F
          </span>
          <span className="text-lg font-extrabold tracking-tight text-zinc-50">FastNextJS</span>
        </Link>

        <div className="rounded-2xl border border-zinc-800 bg-[#121214] p-8 shadow-[0_20px_45px_-15px_rgba(0,0,0,0.85)]">
          <div className="mb-6 text-center">
            <h1 className="text-xl font-bold text-zinc-50">{title}</h1>
            {subtitle ? <p className="mt-1.5 text-sm text-zinc-400">{subtitle}</p> : null}
          </div>
          {children}
        </div>

        {footer ? <div className="mt-5 text-center text-sm text-zinc-400">{footer}</div> : null}
      </div>
    </div>
  );
}

/** Inline alert used for form + OAuth errors. */
export function AuthAlert({ children, tone = "error" }: { children: ReactNode; tone?: "error" | "info" }) {
  return (
    <div
      role="alert"
      className={
        tone === "error"
          ? "rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-300"
          : "rounded-lg border border-sky-500/30 bg-sky-500/10 px-3 py-2.5 text-sm text-sky-300"
      }
    >
      {children}
    </div>
  );
}

/** Google "G" mark used by the OAuth buttons. */
export function GoogleIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden focusable="false">
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47a5.54 5.54 0 0 1-2.4 3.64v3.02h3.88c2.27-2.09 3.54-5.17 3.54-8.9z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.08 7.94-2.91l-3.88-3.01c-1.08.72-2.45 1.15-4.06 1.15-3.13 0-5.78-2.11-6.73-4.96H1.27v3.11A11.99 11.99 0 0 0 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.27a7.2 7.2 0 0 1 0-4.54V6.62H1.27a12 12 0 0 0 0 10.76l3.99-3.11z"
      />
      <path
        fill="#EA4335"
        d="M12 4.76c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0A11.99 11.99 0 0 0 1.27 6.62l3.99 3.11C6.22 6.87 8.87 4.76 12 4.76z"
      />
    </svg>
  );
}
