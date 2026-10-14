import Link from "next/link";
import { Suspense } from "react";
import { requireStaffPage } from "@/lib/admin/auth";
import { isProductionSite, siteEnv } from "@/lib/env";
import { isInquiryDeliveryConfigured, serviceRoleKey } from "@/lib/env.server";
import { Notice } from "@/components/admin/Notice";
import { PageTitle } from "@/components/admin/PageTitle";

export const metadata = { title: "Overview" };

export default function AdminHome({ searchParams }: PageProps<"/admin">) {
  return (
    <>
      <Suspense fallback={null}>
        <Notice searchParams={searchParams} />
      </Suspense>
      <Suspense fallback={<p role="status">Loading overview…</p>}>
        <Overview />
      </Suspense>
    </>
  );
}

async function Overview() {
  const { db, staff } = await requireStaffPage();
  const count = async (table: string, filter: (q: ReturnType<typeof base>) => ReturnType<typeof base>) => {
    const { count: n } = await filter(base(table));
    return n ?? 0;
  };
  const base = (table: string) => db.from(table).select("id", { count: "exact", head: true });

  const tables = [
    { table: "packages", label: "Packages", href: "/admin/packages" },
    { table: "products", label: "Products", href: "/admin/products" },
    { table: "projects", label: "Projects", href: "/admin/projects" },
  ];
  const stats = await Promise.all(
    tables.map(async (t) => ({
      ...t,
      published: await count(t.table, (q) => q.eq("status", "published")),
      drafts: await count(t.table, (q) => q.eq("status", "draft")),
      samples: await count(t.table, (q) => q.eq("is_sample", true).neq("status", "archived")),
    })),
  );
  const { data: pending } = await db.from("content_blocks").select("key, title").eq("published", true).eq("claim_status", "needs_confirmation").order("section");
  const { data: mode } = await db.from("deployment_config").select("content_mode").eq("id", 1).maybeSingle();
  const { data: settings } = await db.from("site_settings").select("facebook_enabled, general_warranty, public_email").eq("id", 1).maybeSingle();
  const { data: samplePrices } = await db.from("packages").select("name").eq("price_is_sample", true).neq("status", "archived");

  const todo: { text: string; href: string }[] = [];
  for (const s of stats) if (s.samples) todo.push({ text: `${s.samples} sample ${s.label.toLowerCase()} to replace or archive`, href: s.href });
  if (pending?.length) todo.push({ text: `${pending.length} content blocks awaiting owner confirmation`, href: "/admin/content" });
  if (samplePrices?.length) todo.push({ text: `${samplePrices.length} package(s) with sample prices`, href: "/admin/packages" });
  if (settings && !settings.facebook_enabled) todo.push({ text: "Facebook link not verified/enabled", href: "/admin/settings" });
  if (settings && /to be confirmed/i.test(settings.general_warranty ?? "")) todo.push({ text: "General warranty text still says “to be confirmed”", href: "/admin/settings" });

  return (
    <>
      <PageTitle title="Overview" intro={`Signed in as ${staff.email} (${staff.role}).`} />

      <section aria-labelledby="content-title">
        <h2 id="content-title" className="sr-only">
          Content
        </h2>
        <ul className="grid gap-4 sm:grid-cols-3">
          {stats.map((s) => (
            <li key={s.table}>
              <Link href={s.href} className="block rounded-[var(--radius-panel)] border border-steel-200 bg-white p-5 hover:border-steel-900">
                <span className="block text-lg font-bold text-steel-950">{s.label}</span>
                <span className="mt-2 block text-sm text-steel-700 tabular">
                  {s.published} published · {s.drafts} drafts
                </span>
                {s.samples > 0 && <span className="mt-1 block text-sm text-steel-600">{s.samples} sample</span>}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="launch-title" className="mt-10 rounded-[var(--radius-panel)] border border-steel-200 bg-white p-6">
        <h2 id="launch-title" className="text-xl font-bold text-steel-950">
          Before launch
        </h2>
        {todo.length ? (
          <ul className="mt-3 space-y-2">
            {todo.map((t) => (
              <li key={t.text} className="flex items-start gap-2">
                <span aria-hidden="true" className="mt-2 size-2 shrink-0 rounded-full bg-gold-500" />
                <Link href={t.href} className="font-semibold text-steel-900 underline">
                  {t.text}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-ok-700">No placeholder content remaining.</p>
        )}
      </section>

      <section aria-labelledby="config-title" className="mt-6 rounded-[var(--radius-panel)] border border-steel-200 bg-white p-6">
        <h2 id="config-title" className="text-xl font-bold text-steel-950">
          Configuration
        </h2>
        <dl className="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[max-content_1fr]">
          <dt className="font-semibold">Site mode</dt>
          <dd>{isProductionSite ? "Production (indexed by search engines)" : `Preview (${siteEnv}) — not indexed, samples visible with labels`}</dd>
          <dt className="font-semibold">Database mode</dt>
          <dd>{mode?.content_mode === "production" ? "Production — samples and unconfirmed claims hidden from the public" : "Preview — samples visible"}</dd>
          <dt className="font-semibold">Inquiry form</dt>
          <dd>{isInquiryDeliveryConfigured ? (serviceRoleKey ? "Live — emails delivered" : "Live delivery configured, but rate limiter key missing (inquiries will fail safely)") : "Demo mode — submissions are NOT delivered"}</dd>
        </dl>
      </section>
    </>
  );
}
