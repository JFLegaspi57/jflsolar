import Link from "next/link";
import type { ReactNode } from "react";

export function PageTitle({ title, intro, back, action }: { title: ReactNode; intro?: ReactNode; back?: { href: string; label: string }; action?: ReactNode }) {
  return (
    <div className="mb-8">
      {back && (
        <Link href={back.href} className="mb-3 inline-flex min-h-11 items-center text-sm font-semibold text-steel-700 underline hover:text-steel-950">
          ← {back.label}
        </Link>
      )}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-steel-950">{title}</h1>
          {intro && <div className="mt-2 max-w-2xl text-steel-600">{intro}</div>}
        </div>
        {action}
      </div>
    </div>
  );
}

export function NewButton({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="inline-flex min-h-11 items-center rounded-[var(--radius-control)] bg-gold-500 px-5 font-semibold text-steel-950 hover:bg-gold-400">
      {children}
    </Link>
  );
}

export function ViewTabs({ base, active, keep = "" }: { base: string; active: "current" | "archived"; keep?: string }) {
  const tab = (key: "current" | "archived", label: string) => (
    <Link
      href={key === "current" ? (keep ? `${base}?${keep}` : base) : `${base}?view=archived${keep ? `&${keep}` : ""}`}
      aria-current={active === key ? "page" : undefined}
      className="inline-flex min-h-11 items-center rounded-full border border-steel-300 px-4 text-sm font-semibold text-steel-800 aria-[current=page]:border-steel-900 aria-[current=page]:bg-steel-900 aria-[current=page]:text-white"
    >
      {label}
    </Link>
  );
  return (
    <nav aria-label="Filter by status" className="mb-4 flex gap-2">
      {tab("current", "Drafts and published")}
      {tab("archived", "Archived")}
    </nav>
  );
}
