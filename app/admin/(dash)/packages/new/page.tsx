import { Suspense } from "react";
import { requireStaffPage } from "@/lib/admin/auth";
import { packageValues } from "@/lib/admin/values";
import { PageTitle } from "@/components/admin/PageTitle";
import { PackageForm } from "@/components/admin/forms/PackageForm";

export const metadata = { title: "New package" };

export default function NewPackage() {
  return (
    <>
      <PageTitle
        title="New package"
        back={{ href: "/admin/packages", label: "All packages" }}
        intro="New packages are saved as drafts. Add images after the first save, then publish."
      />
      <Suspense fallback={<p role="status">Loading…</p>}>
        <Guarded />
      </Suspense>
    </>
  );
}

async function Guarded() {
  await requireStaffPage();
  return <PackageForm values={packageValues()} />;
}
