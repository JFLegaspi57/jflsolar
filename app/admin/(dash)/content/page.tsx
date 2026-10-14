import Link from "next/link";
import { Suspense } from "react";
import { requireStaffPage } from "@/lib/admin/auth";
import type { ContentBlock } from "@/lib/types";
import { placementLabel, visibilityLabel } from "@/lib/admin/blocks";
import { Notice } from "@/components/admin/Notice";
import { NewButton, PageTitle } from "@/components/admin/PageTitle";

export const metadata = { title: "Site content" };

const sectionNames: Record<string, string> = { about: "About page", why: "Why choose us", home: "Home", services: "Services", legal: "Legal" };

export default function ContentAdmin({ searchParams }: PageProps<"/admin/content">) {
  return (
    <>
      <PageTitle
        title="Site content"
        intro="Company introduction, history, mission, vision, founder profile and “Why choose us”. Text awaiting confirmation is shown only on the preview site."
        action={<NewButton href="/admin/content/new">New block</NewButton>}
      />
      <Suspense fallback={null}>
        <Notice searchParams={searchParams} />
      </Suspense>
      <Suspense fallback={<p role="status">Loading…</p>}>
        <List />
      </Suspense>
    </>
  );
}

async function List() {
  const { db } = await requireStaffPage();
  const { data, error } = await db.from("content_blocks").select("*").order("section").order("sort_order");
  if (error) return <p role="alert">Could not load content.</p>;
  const blocks = (data ?? []) as ContentBlock[];
  const sections = [...new Set(blocks.map((b) => b.section))];
  return (
    <div className="space-y-8">
      {sections.map((s) => (
        <section key={s} aria-labelledby={`sec-${s}`}>
          <h2 id={`sec-${s}`} className="mb-3 text-xl font-bold text-steel-950">
            {sectionNames[s] ?? s}
          </h2>
          <ul className="divide-y divide-steel-200 rounded-[var(--radius-panel)] border border-steel-200 bg-white">
            {blocks
              .filter((b) => b.section === s)
              .map((b) => (
                <li key={b.key} className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <Link href={`/admin/content/${encodeURIComponent(b.key)}`} className="font-bold text-steel-950 underline-offset-2 hover:underline">
                      {b.title}
                    </Link>
                    <p className="text-sm text-steel-600">{placementLabel(b.key, b.section)}</p>
                  </div>
                  {(() => {
                    const v = visibilityLabel(b.published, b.claim_status);
                    const cls = v.tone === "shown" ? "bg-ok-50 text-ok-700" : v.tone === "pending" ? "bg-warn-50 text-warn-800" : "bg-steel-100 text-steel-700";
                    return <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${cls}`}>{v.text}</span>;
                  })()}
                </li>
              ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
