import { Suspense } from "react";
import { requireStaffPage } from "@/lib/admin/auth";
import { projectValues } from "@/lib/admin/values";
import { PageTitle } from "@/components/admin/PageTitle";
import { ProjectForm } from "@/components/admin/forms/CatalogForms";

export const metadata = { title: "New project" };

export default function NewProject() {
  return (
    <>
      <PageTitle title="New project" back={{ href: "/admin/projects", label: "All projects" }} intro="“Save as draft” keeps it hidden; “Save and publish” puts it on the website. Add photos and choose a cover after the first save." />
      <Suspense fallback={<p role="status">Loading…</p>}>
        <Guarded />
      </Suspense>
    </>
  );
}

async function Guarded() {
  await requireStaffPage();
  return <ProjectForm values={projectValues()} />;
}
