import { Suspense } from "react";
import { notFound } from "next/navigation";
import { requireStaffPage } from "@/lib/admin/auth";
import { productValues } from "@/lib/admin/values";
import type { MediaAsset, Product, ProductCategory } from "@/lib/types";
import { EditHeader } from "@/components/admin/EditHeader";
import { ImageManager } from "@/components/admin/ImageManager";
import { Notice } from "@/components/admin/Notice";
import { PageTitle } from "@/components/admin/PageTitle";
import { DatasheetManager, ProductForm } from "@/components/admin/forms/CatalogForms";
import { ProductCard } from "@/components/catalog/ProductCard";

export const metadata = { title: "Edit product" };

export default function EditProduct({ params, searchParams }: PageProps<"/admin/products/[id]">) {
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

async function Editor({ params }: Pick<PageProps<"/admin/products/[id]">, "params">) {
  const { id } = await params;
  const { db } = await requireStaffPage();
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const [{ data }, { data: media }, { data: cats }] = await Promise.all([
    db.from("products").select("*").eq("id", id).maybeSingle(),
    db.from("media_assets").select("*").eq("product_id", id).order("sort_order"),
    db.from("product_categories").select("*").neq("status", "archived").order("sort_order"),
  ]);
  if (!data) notFound();
  const product = data as Product;
  const assets = (media ?? []) as MediaAsset[];
  const images = assets.filter((m) => m.kind === "image");
  const datasheet = assets.find((m) => m.kind === "datasheet") ?? null;
  const categories = (cats ?? []) as ProductCategory[];

  return (
    <>
      <PageTitle title={product.name} back={{ href: "/admin/products", label: "All products" }} />
      <EditHeader previewHref={`/admin/preview/products/${product.id}`} entity="products" id={product.id} name={product.name} status={product.status} isSample={product.is_sample} publicHref={`/products/${product.slug}`} />
      <details className="mb-8 rounded-[var(--radius-panel)] border border-steel-200 bg-white p-4">
        <summary className="inline-flex min-h-11 cursor-pointer items-center font-semibold text-steel-900">Preview card (as saved)</summary>
        <div className="mt-3 max-w-xs">
          <ProductCard mediaScope="admin" product={{ ...product, category: categories.find((c) => c.id === product.category_id) ?? null, images, datasheet }} />
        </div>
      </details>
      <div className="mb-8 space-y-6">
        <ImageManager owner={{ kind: "product", id: product.id }} images={images} title="Product images" coverLabel="main image" />
        <DatasheetManager productId={product.id} current={datasheet} />
      </div>
      <ProductForm values={productValues(product)} id={product.id} version={product.updated_at} status={product.status} categories={categories} />
    </>
  );
}
