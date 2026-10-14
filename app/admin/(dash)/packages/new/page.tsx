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
        intro="“Save as draft” keeps it hidden while you work; “Save and publish” puts it on the website straight away. You can add images after the first save."
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
