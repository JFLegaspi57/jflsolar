import { Suspense } from "react";
import { requireStaffPage } from "@/lib/admin/auth";
import { productValues } from "@/lib/admin/values";
import { PageTitle } from "@/components/admin/PageTitle";
import { ProductForm } from "@/components/admin/forms/CatalogForms";

export const metadata = { title: "New product" };

export default function NewProduct() {
  return (
    <>
      <PageTitle title="New product" back={{ href: "/admin/products", label: "All products" }} intro="Saved as a draft. Add images and a datasheet after the first save." />
      <Suspense fallback={<p role="status">Loading…</p>}>
        <Guarded />
      </Suspense>
    </>
  );
}

async function Guarded() {
  const { db } = await requireStaffPage();
  const { data } = await db.from("product_categories").select("id, name").neq("status", "archived").order("sort_order");
  return <ProductForm values={productValues()} categories={(data ?? []) as { id: string; name: string }[]} />;
}
