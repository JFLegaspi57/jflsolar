import { Suspense } from "react";
import { notFound } from "next/navigation";
import { requireStaffPage } from "@/lib/admin/auth";
import type { ProductCategory } from "@/lib/types";
import { EditHeader } from "@/components/admin/EditHeader";
import { Notice } from "@/components/admin/Notice";
import { PageTitle } from "@/components/admin/PageTitle";
import { CategoryForm } from "@/components/admin/forms/CatalogForms";

export const metadata = { title: "Edit category" };

export default function EditCategory({ params, searchParams }: PageProps<"/admin/categories/[id]">) {
  return (
    <>
      <Suspense fallback={null}>
        <Notice searchParams={searchParams} />
      </Suspense>
      <Suspense fallback={<p role="status">Loading…</p>}>
        <Editor params={params} />
      </Suspense>
    </>
  );
}

async function Editor({ params }: Pick<PageProps<"/admin/categories/[id]">, "params">) {
  const { id } = await params;
  const { db } = await requireStaffPage();
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const { data } = await db.from("product_categories").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const c = data as ProductCategory & { updated_at: string };
  return (
    <>
      <PageTitle title={c.name} back={{ href: "/admin/categories", label: "All categories" }} />
      <EditHeader entity="categories" id={c.id} name={c.name} status={c.status} publicHref={`/products?category=${c.slug}`} />
      <CategoryForm values={{ name: c.name, slug: c.slug, description: c.description ?? "" }} id={c.id} version={c.updated_at} status={c.status} />
    </>
  );
}
