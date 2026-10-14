import { Suspense } from "react";
import { notFound } from "next/navigation";
import { requireStaffPage } from "@/lib/admin/auth";
import { packageValues } from "@/lib/admin/values";
import { promoState } from "@/lib/pricing";
import type { MediaAsset, Package } from "@/lib/types";
import { EditHeader } from "@/components/admin/EditHeader";
import { ImageManager } from "@/components/admin/ImageManager";
import { Notice } from "@/components/admin/Notice";
import { PageTitle } from "@/components/admin/PageTitle";
import { PackageForm } from "@/components/admin/forms/PackageForm";
import { PackageCard } from "@/components/catalog/PackageCard";

export const metadata = { title: "Edit package" };

export default function EditPackage({ params, searchParams }: PageProps<"/admin/packages/[id]">) {
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

async function Editor({ params }: Pick<PageProps<"/admin/packages/[id]">, "params">) {
  const { id } = await params;
  const { db } = await requireStaffPage();
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const { data } = await db.from("packages").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const pkg = data as Package;
  const { data: media } = await db.from("media_assets").select("*").eq("package_id", id).order("sort_order");
  const images = (media ?? []) as MediaAsset[];
  const promo = promoState(pkg);

  return (
    <>
      <PageTitle title={pkg.name} back={{ href: "/admin/packages", label: "All packages" }} />
      <EditHeader previewHref={`/admin/preview/packages/${pkg.id}`} entity="packages" id={pkg.id} name={pkg.name} status={pkg.status} isSample={pkg.is_sample} publicHref={`/packages/${pkg.slug}`}>
        {promo === "ended" && (
          <p className="mt-3 rounded bg-danger-50 px-3 py-2 text-sm text-danger-700">
            The promotion ended on {pkg.promo_end}. {pkg.hide_when_expired ? "This package is hidden from the public site." : "The public page shows “Promotion ended — request current price”."} Update the dates or price, or archive it.
          </p>
        )}
      </EditHeader>

      <PackageForm values={packageValues(pkg)} id={pkg.id} version={pkg.updated_at} status={pkg.status} />
      <div className="mb-28 space-y-8">
      <details className="rounded-[var(--radius-panel)] border border-steel-200 bg-white p-4">
        <summary className="inline-flex min-h-11 cursor-pointer items-center font-semibold text-steel-900">Preview card (as saved)</summary>
        <div className="mt-3 max-w-sm">
          <PackageCard pkg={{ ...pkg, promo_state: promo, images }} />
        </div>
      </details>

      <div>
        <ImageManager owner={{ kind: "package", id: pkg.id }} images={images.filter((m) => m.kind === "image")} />
      </div>
      </div>
    </>
  );
}
