import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { requireStaffPage } from "@/lib/admin/auth";
import { promoState } from "@/lib/pricing";
import type { MediaAsset, Package, Product, ProductCategory, Project, SiteSettings } from "@/lib/types";
import { PackageDetail } from "@/components/detail/PackageDetail";
import { ProductDetail } from "@/components/detail/ProductDetail";
import { ProjectDetail } from "@/components/detail/ProjectDetail";

export const metadata = { title: "Preview" };

/**
 * Staff-only preview of any package/product/project (including drafts) using
 * the public templates. Data and media are read with the staff session and are
 * never cached publicly (DECISIONS.md D10).
 */
export default function PreviewPage({ params }: PageProps<"/admin/preview/[entity]/[id]">) {
  return (
    <Suspense fallback={<p role="status">Loading preview…</p>}>
      <Preview params={params} />
    </Suspense>
  );
}

async function Preview({ params }: Pick<PageProps<"/admin/preview/[entity]/[id]">, "params">) {
  const { entity, id } = await params;
  if (!["packages", "products", "projects"].includes(entity) || !/^[0-9a-f-]{36}$/.test(id)) notFound();
  const { db } = await requireStaffPage();

  const [{ data: row }, { data: media }, { data: settings }] = await Promise.all([
    db.from(entity).select("*").eq("id", id).maybeSingle(),
    db.from("media_assets").select("*").eq(`${entity.slice(0, -1)}_id`, id).order("sort_order"),
    db.from("site_settings").select("*").eq("id", 1).maybeSingle(),
  ]);
  if (!row || !settings) notFound();
  const assets = (media ?? []) as MediaAsset[];
  const images = assets.filter((m) => m.kind === "image");

  let body: React.ReactNode;
  if (entity === "packages") {
    const pkg = row as Package;
    body = <PackageDetail mediaScope="admin" settings={settings as SiteSettings} pkg={{ ...pkg, promo_state: promoState(pkg), images }} />;
  } else if (entity === "products") {
    const product = row as Product;
    const { data: cat } = await db.from("product_categories").select("*").eq("id", product.category_id).maybeSingle();
    body = (
      <ProductDetail
        mediaScope="admin"
        settings={settings as SiteSettings}
        product={{ ...product, category: (cat as ProductCategory) ?? null, images, datasheet: assets.find((m) => m.kind === "datasheet") ?? null }}
      />
    );
  } else {
    const project = row as Project;
    body = <ProjectDetail mediaScope="admin" project={{ ...project, photos: images, cover: images.find((m) => m.is_cover) ?? images[0] ?? null }} />;
  }

  return (
    <>
      <div role="note" className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-control)] border-2 border-dashed border-gold-600 bg-gold-50 px-4 py-3">
        <p className="text-steel-900">
          <strong>Staff preview</strong> — status: <strong className="capitalize">{(row as { status: string }).status}</strong>.{" "}
          {(row as { status: string }).status === "published" ? "This is live on the website." : "This is not visible to the public."} Buttons on this page
          lead to the public site.
        </p>
        <Link href={`/admin/${entity}/${id}`} className="inline-flex min-h-11 items-center font-semibold text-steel-900 underline">
          ← Back to editing
        </Link>
      </div>
      <div className="overflow-hidden rounded-[var(--radius-panel)] border border-steel-200 bg-white">{body}</div>
    </>
  );
}
