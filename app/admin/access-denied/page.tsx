import { Suspense } from "react";
import { redirect } from "next/navigation";
import { checkStaff } from "@/lib/admin/auth";
import { Logo } from "@/components/layout/Logo";
import { signOut } from "../session-actions";

export const metadata = { title: "Access denied" };

export default function AccessDeniedPage() {
  return (
    <main id="main" className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-md rounded-[var(--radius-panel)] border border-steel-200 bg-white p-8 shadow-sm">
        <Logo />
        <h1 className="mt-8 text-2xl font-extrabold text-steel-950">You don’t have staff access</h1>
        <Suspense fallback={<p className="mt-3 text-steel-600">Checking your account…</p>}>
          <Details />
        </Suspense>
      </div>
    </main>
  );
}

async function Details() {
  const res = await checkStaff();
  if (res.state === "ok") redirect("/admin");
  if (res.state !== "denied") redirect("/admin/login");
  return (
    <>
      <p className="mt-3 text-steel-700">
        You are signed in as <strong className="break-all">{res.email ?? "an unknown account"}</strong>, but this account is not on the JFL Solar staff
        list (or has been deactivated).
      </p>
      <p className="mt-3 text-steel-700">Ask a website owner to add this exact email address in Admin → Staff, then sign in again.</p>
      <form action={signOut} className="mt-6">
        <button type="submit" className="inline-flex min-h-11 items-center rounded-[var(--radius-control)] bg-steel-900 px-5 font-semibold text-white hover:bg-steel-800">
          Sign out and use another account
        </button>
      </form>
    </>
  );
}
