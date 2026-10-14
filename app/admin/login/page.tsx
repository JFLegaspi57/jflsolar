import { Suspense } from "react";
import Link from "next/link";
import { isSupabaseConfigured } from "@/lib/env";
import { Logo } from "@/components/layout/Logo";
import { signInWithGoogle } from "../session-actions";

export const metadata = { title: "Sign in" };

const reasons: Record<string, { tone: "info" | "error"; text: string }> = {
  signed_out: { tone: "info", text: "You are signed out. Sign in again to continue." },
  expired: { tone: "info", text: "Your session expired. Please sign in again." },
  error: { tone: "error", text: "Sign-in did not complete. Please try again." },
};

export default function LoginPage({ searchParams }: PageProps<"/admin/login">) {
  return (
    <main id="main" className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-md rounded-[var(--radius-panel)] border border-steel-200 bg-white p-8 shadow-sm">
        <Logo />
        <h1 className="mt-8 text-2xl font-extrabold text-steel-950">Staff sign-in</h1>
        <p className="mt-2 text-steel-600">For JFL Solar staff who manage the website.</p>
        <Suspense fallback={null}>
          <Reason searchParams={searchParams} />
        </Suspense>
        {isSupabaseConfigured ? (
          <form action={signInWithGoogle} className="mt-6">
            <button
              type="submit"
              className="flex min-h-12 w-full items-center justify-center gap-3 rounded-[var(--radius-control)] border-2 border-steel-900 bg-white px-4 font-semibold text-steel-950 hover:bg-steel-50"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5">
                <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.2-2.1 3.5-5.1 3.5-8.8Z" />
                <path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1A12 12 0 0 0 12 24Z" />
                <path fill="#FBBC05" d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6H1.3a12 12 0 0 0 0 10.8l4-3.1Z" />
                <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1c.9-2.9 3.6-4.9 6.7-4.9Z" />
              </svg>
              Continue with Google
            </button>
            <p className="mt-4 text-sm text-steel-600">
              Signing in with Google does not grant access on its own. An owner must first add your email address to the staff list.
            </p>
          </form>
        ) : (
          <div role="status" className="mt-6 rounded-[var(--radius-control)] border-2 border-dashed border-gold-600 bg-gold-50 p-4 text-steel-900">
            <p className="font-bold">Admin is not connected yet.</p>
            <p className="mt-1 text-sm">
              Supabase environment variables are not set on this deployment, so staff sign-in and content editing are unavailable. See
              <code className="mx-1 rounded bg-white px-1">docs/SETUP.md</code>. The public site is showing bundled demo content.
            </p>
          </div>
        )}
        <p className="mt-8 text-sm">
          <Link href="/" className="font-semibold text-steel-900 underline">
            ← Back to the website
          </Link>
        </p>
      </div>
    </main>
  );
}

async function Reason({ searchParams }: Pick<PageProps<"/admin/login">, "searchParams">) {
  const { reason } = await searchParams;
  const r = typeof reason === "string" ? reasons[reason] : undefined;
  if (!r) return null;
  return (
    <p
      role={r.tone === "error" ? "alert" : "status"}
      className={`mt-5 rounded-[var(--radius-control)] border px-3 py-2 text-sm ${
        r.tone === "error" ? "border-[#f3c3be] bg-danger-50 text-danger-700" : "border-steel-200 bg-steel-50 text-steel-800"
      }`}
    >
      {r.text}
    </p>
  );
}
