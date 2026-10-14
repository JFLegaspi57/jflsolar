import { Suspense } from "react";
import { requireStaffPage } from "@/lib/admin/auth";
import { blockValues } from "@/lib/admin/values";
import { PageTitle } from "@/components/admin/PageTitle";
import { BlockForm } from "@/components/admin/forms/SiteForms";

export const metadata = { title: "New content block" };

export default function NewBlock() {
  return (
    <>
      <PageTitle title="New content block" back={{ href: "/admin/content", label: "Site content" }} />
      <Suspense fallback={<p role="status">Loading…</p>}>
        <Guarded />
      </Suspense>
    </>
  );
}

async function Guarded() {
  await requireStaffPage();
  return <BlockForm values={blockValues()} isNew />;
}
