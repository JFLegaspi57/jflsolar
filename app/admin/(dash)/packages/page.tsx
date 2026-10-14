import { Suspense } from "react";
import { requireStaffPage } from "@/lib/admin/auth";
import { packageTypeLabel } from "@/lib/labels";
import { priceDisplay, promoState } from "@/lib/pricing";
import type { Package } from "@/lib/types";
import { Notice } from "@/components/admin/Notice";
import { NewButton, PageTitle } from "@/components/admin/PageTitle";
import { RecordList } from "@/components/admin/RecordList";

export const metadata = { title: "Packages" };

export default function PackagesAdmin({ searchParams }: PageProps<"/admin/packages">) {
  return (
    <>
      <PageTitle
        title="Packages"
        intro="Installed systems and equipment-only bundles. Use ↑ ↓ to set the order on the public site; ★ features a package on the home page."
        action={<NewButton href="/admin/packages/new">New package</NewButton>}
      />
      <Suspense fallback={null}>
        <Notice searchParams={searchParams} />
      </Suspense>
      <Suspense fallback={<p role="status">Loading packages…</p>}>
        <List searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function List({ searchParams }: Pick<PageProps<"/admin/packages">, "searchParams">) {
  const archived = (await searchParams).view === "archived";
  const { db } = await requireStaffPage();
  const q = db.from("packages").select("*").order("sort_order").order("created_at");
  const { data, error } = await (archived ? q.eq("status", "archived") : q.neq("status", "archived"));
  if (error) return <p role="alert">Could not load packages.</p>;
  const rows = ((data ?? []) as Package[]).map((p) => {
    const promo = promoState(p);
    const price = priceDisplay(p, promo);
    return {
      id: p.id,
      name: p.name,
      status: p.status,
      isSample: p.is_sample,
      featured: p.featured,
      subtitle: `${packageTypeLabel[p.package_type]} · ${price.headline}${price.isSample ? " (sample price)" : ""}`,
      badges: (
        <>
          {promo === "ended" && <span className="rounded-full bg-danger-50 px-2 py-0.5 text-xs font-bold text-danger-700">Promotion ended</span>}
          {promo === "upcoming" && <span className="rounded-full bg-gold-100 px-2 py-0.5 text-xs font-bold text-gold-800">Promotion upcoming</span>}
          {promo === "active" && <span className="rounded-full bg-gold-100 px-2 py-0.5 text-xs font-bold text-gold-800">Promotion active</span>}
        </>
      ),
    };
  });
  return <RecordList entity="packages" rows={rows} archived={archived} emptyText="No packages yet. Create the first one." />;
}
