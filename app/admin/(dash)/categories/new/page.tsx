import { Suspense } from "react";
import { requireStaffPage } from "@/lib/admin/auth";
import { PageTitle } from "@/components/admin/PageTitle";
import { CategoryForm } from "@/components/admin/forms/CatalogForms";

export const metadata = { title: "New category" };

export default function NewCategory() {
  return (
    <>
      <PageTitle title="New category" back={{ href: "/admin/categories", label: "All categories" }} />
      <Suspense fallback={<p role="status">Loading…</p>}>
        <Guarded />
      </Suspense>
    </>
  );
}

async function Guarded() {
  await requireStaffPage();
  return <CategoryForm values={{}} />;
}
