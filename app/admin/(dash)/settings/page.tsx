import { Suspense } from "react";
import { requireStaffPage } from "@/lib/admin/auth";
import { settingsValues } from "@/lib/admin/values";
import type { SiteSettings } from "@/lib/types";
import { PageTitle } from "@/components/admin/PageTitle";
import { SettingsForm } from "@/components/admin/forms/SiteForms";

export const metadata = { title: "Contact and settings" };

export default function SettingsAdmin() {
  return (
    <>
      <PageTitle title="Contact and settings" intro="Public contact details, locations, service area and general warranty text." />
      <Suspense fallback={<p role="status">Loading…</p>}>
        <Editor />
      </Suspense>
    </>
  );
}

async function Editor() {
  const { db } = await requireStaffPage();
  const { data } = await db.from("site_settings").select("*").eq("id", 1).maybeSingle();
  if (!data) return <p role="alert">The settings row is missing. Run the database seed (see docs/SETUP.md).</p>;
  const s = data as SiteSettings & { updated_at: string };
  return <SettingsForm values={settingsValues(s)} version={s.updated_at} />;
}
