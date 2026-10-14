import { Suspense } from "react";
import { requireStaffPage } from "@/lib/admin/auth";
import { availabilityLabel } from "@/lib/labels";
import { priceDisplay } from "@/lib/pricing";
import type { Product } from "@/lib/types";
import { Notice } from "@/components/admin/Notice";
import { NewButton, PageTitle } from "@/components/admin/PageTitle";
import { RecordList } from "@/components/admin/RecordList";

export const metadata = { title: "Products" };

export default function ProductsAdmin({ searchParams }: PageProps<"/admin/products">) {
  return (
    <>
      <PageTitle
        title="Products"
        intro="Equipment catalogue. Listing a brand does not mean JFL Solar is an authorised distributor — only state that once it is confirmed."
        action={<NewButton href="/admin/products/new">New product</NewButton>}
      />
      <Suspense fallback={null}>
        <Notice searchParams={searchParams} />
      </Suspense>
      <Suspense fallback={<p role="status">Loading products…</p>}>
        <List searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function List({ searchParams }: Pick<PageProps<"/admin/products">, "searchParams">) {
  const archived = (await searchParams).view === "archived";
  const { db } = await requireStaffPage();
  const [{ data, error }, { data: cats }] = await Promise.all([
    (() => {
      const q = db.from("products").select("*").order("sort_order").order("created_at");
      return archived ? q.eq("status", "archived") : q.neq("status", "archived");
    })(),
    db.from("product_categories").select("id, name"),
  ]);
  if (error) return <p role="alert">Could not load products.</p>;
  const catName = new Map((cats ?? []).map((c) => [c.id as string, c.name as string]));
  const rows = ((data ?? []) as Product[]).map((p) => ({
    id: p.id,
    name: p.name,
    status: p.status,
    isSample: p.is_sample,
    featured: p.featured,
    subtitle: [catName.get(p.category_id), p.brand, p.model, priceDisplay(p).hasAmount ? priceDisplay(p).headline : "Request price", availabilityLabel[p.availability]]
      .filter(Boolean)
      .join(" · "),
  }));
  return <RecordList entity="products" rows={rows} archived={archived} emptyText="No products yet." />;
}
