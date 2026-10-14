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
  const sp = await searchParams;
  const archived = sp.view === "archived";
  const q = (typeof sp.q === "string" ? sp.q : "").trim().toLowerCase().slice(0, 80);
  const catFilter = typeof sp.category === "string" ? sp.category : "";
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
  const matches = (p: Product) =>
    (!catFilter || p.category_id === catFilter) &&
    (!q || [p.name, p.brand, p.model, p.sku].filter(Boolean).join(" ").toLowerCase().includes(q));
  const all = (data ?? []) as Product[];
  const filtering = Boolean(q || catFilter);
  const rows = all.filter(matches).map((p) => ({
    id: p.id,
    name: p.name,
    status: p.status,
    isSample: p.is_sample,
    featured: p.featured,
    subtitle: [catName.get(p.category_id), p.brand, p.model, priceDisplay(p).hasAmount ? priceDisplay(p).headline : "Request price", availabilityLabel[p.availability]]
      .filter(Boolean)
      .join(" · "),
  }));
  const field = "min-h-11 rounded-[var(--radius-control)] border border-steel-400 bg-white px-3 text-base";
  return (
    <>
      <form method="get" role="search" aria-label="Find products" className="mb-5 flex flex-wrap items-end gap-2 rounded-[var(--radius-panel)] border border-steel-200 bg-white p-3">
        {archived && <input type="hidden" name="view" value="archived" />}
        <div className="min-w-0 flex-1 basis-48">
          <label htmlFor="admin-q" className="mb-1 block text-sm font-semibold">
            Search name, brand or model
          </label>
          <input id="admin-q" name="q" type="search" defaultValue={q} className={`${field} w-full`} />
        </div>
        <div className="basis-48">
          <label htmlFor="admin-cat" className="mb-1 block text-sm font-semibold">
            Category
          </label>
          <select id="admin-cat" name="category" defaultValue={catFilter} className={`${field} w-full`}>
            <option value="">All categories</option>
            {(cats ?? []).map((c) => (
              <option key={c.id as string} value={c.id as string}>
                {c.name as string}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="inline-flex min-h-11 items-center rounded-[var(--radius-control)] bg-steel-900 px-4 font-semibold text-white">
          Find
        </button>
        {filtering && (
          <a href={archived ? "/admin/products?view=archived" : "/admin/products"} className="inline-flex min-h-11 items-center px-2 font-semibold underline">
            Clear
          </a>
        )}
      </form>
      {filtering && (
        <p role="status" className="mb-3 text-sm text-steel-600">
          Showing {rows.length} of {all.length}. Reordering is only available when no search is active.
        </p>
      )}
      <RecordList
        entity="products"
        rows={rows}
        archived={archived}
        canReorder={!filtering}
        keep={new URLSearchParams(Object.entries({ q, category: catFilter }).filter(([, v]) => v)).toString()} emptyText={filtering ? "No products match your search." : "No products yet."} />
    </>
  );
}
