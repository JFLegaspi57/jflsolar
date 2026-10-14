import { Suspense } from "react";
import { requireStaffPage } from "@/lib/admin/auth";
import { projectValues } from "@/lib/admin/values";
import { PageTitle } from "@/components/admin/PageTitle";
import { ProjectForm } from "@/components/admin/forms/CatalogForms";

export const metadata = { title: "New project" };

export default function NewProject() {
  return (
    <>
      <PageTitle title="New project" back={{ href: "/admin/projects", label: "All projects" }} intro="Saved as a draft. Add photos after the first save, choose a cover photo, then publish." />
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
