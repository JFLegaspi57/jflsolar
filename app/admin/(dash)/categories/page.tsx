import { Suspense } from "react";
import { requireStaffPage } from "@/lib/admin/auth";
import type { ProductCategory } from "@/lib/types";
import { Notice } from "@/components/admin/Notice";
import { NewButton, PageTitle } from "@/components/admin/PageTitle";
import { RecordList } from "@/components/admin/RecordList";

export const metadata = { title: "Categories" };

export default function CategoriesAdmin({ searchParams }: PageProps<"/admin/categories">) {
  return (
    <>
      <PageTitle
        title="Product categories"
        intro="Categories group products and drive the filters on the Products page. A category with products cannot be deleted."
        action={<NewButton href="/admin/categories/new">New category</NewButton>}
      />
      <Suspense fallback={null}>
        <Notice searchParams={searchParams} />
      </Suspense>
      <Suspense fallback={<p role="status">Loading…</p>}>
        <List searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function List({ searchParams }: Pick<PageProps<"/admin/categories">, "searchParams">) {
  const archived = (await searchParams).view === "archived";
  const { db } = await requireStaffPage();
  const q = db.from("product_categories").select("*").order("sort_order");
  const { data, error } = await (archived ? q.eq("status", "archived") : q.neq("status", "archived"));
  if (error) return <p role="alert">Could not load categories.</p>;
  const { data: products } = await db.from("products").select("category_id");
  const n = (id: string) => (products ?? []).filter((p) => p.category_id === id).length;
  const rows = ((data ?? []) as ProductCategory[]).map((c) => ({ id: c.id, name: c.name, status: c.status, subtitle: `/${c.slug} · ${n(c.id)} product(s)` }));
  return <RecordList entity="categories" rows={rows} archived={archived} emptyText="No categories yet." featurable={false} />;
}
