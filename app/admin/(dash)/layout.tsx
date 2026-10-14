import { Suspense } from "react";
import Link from "next/link";
import { requireStaffPage } from "@/lib/admin/auth";
import { isProductionSite } from "@/lib/env";
import { AdminNav } from "@/components/admin/AdminNav";
import { LogoSymbol } from "@/components/layout/Logo";
import { signOut } from "../session-actions";

export default function DashLayout({ children }: LayoutProps<"/admin">) {
  return (
    <Suspense fallback={<p className="p-8 text-steel-600" role="status">Checking your access…</p>}>
      <Shell>{children}</Shell>
    </Suspense>
  );
}

async function Shell({ children }: { children: React.ReactNode }) {
  const { staff } = await requireStaffPage();
  return (
    <div className="lg:pl-64">
      <a href="#admin-main" className="sr-only z-50 rounded bg-gold-500 px-4 py-3 font-semibold text-steel-950 focus:not-sr-only focus:fixed focus:top-2 focus:left-2">
        Skip to content
      </a>
      <header className="on-dark bg-steel-950 text-white lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex items-center justify-between gap-3 px-4 py-3 lg:block lg:px-5 lg:py-6">
          <Link href="/admin" className="flex items-center gap-3">
            <span className="rounded bg-white p-1">
              <LogoSymbol className="size-8" />
            </span>
            <span className="leading-tight">
              <span className="block font-display font-bold">JFL Solar</span>
              <span className="block text-xs text-steel-300">Website admin</span>
            </span>
          </Link>
          <Link href="/" className="text-sm text-steel-300 underline hover:text-white lg:mt-4 lg:inline-block" target="_blank" rel="noopener">
            View website<span className="sr-only"> (opens in a new tab)</span>
          </Link>
        </div>
        <div className="lg:flex-1 lg:px-3">
          <AdminNav isOwner={staff.role === "owner"} />
        </div>
        <div className="hidden border-t border-white/10 px-5 py-4 text-sm lg:block">
          <p className="truncate text-steel-300" title={staff.email}>
            {staff.email}
          </p>
          <p className="text-xs text-steel-400 capitalize">{staff.role}</p>
          <form action={signOut} className="mt-3">
            <button type="submit" className="inline-flex min-h-11 items-center font-semibold text-white underline">
              Sign out
            </button>
          </form>
        </div>
      </header>
      <main id="admin-main" tabIndex={-1} className="mx-auto max-w-5xl px-4 py-8 focus:outline-none sm:px-6 lg:py-10">
        {!isProductionSite && (
          <p className="mb-6 rounded-[var(--radius-control)] border border-dashed border-steel-400 bg-white px-4 py-2 text-sm text-steel-700">
            Preview deployment — items marked <strong>Sample</strong> are demonstration content and are hidden on the production site.
          </p>
        )}
        {children}
        <form action={signOut} className="mt-12 border-t border-steel-200 pt-4 lg:hidden">
          <p className="text-sm text-steel-600">
            Signed in as {staff.email} ({staff.role})
          </p>
          <button type="submit" className="mt-1 inline-flex min-h-11 items-center font-semibold text-steel-900 underline">
            Sign out
          </button>
        </form>
      </main>
    </div>
  );
}
