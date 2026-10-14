import { notFound } from "next/navigation";
import { getProductBySlug, getPublicSnapshot, getSettings, slugParams } from "@/lib/content/public";
import { pageMetadata } from "@/lib/seo";
import { ProductDetail } from "@/components/detail/ProductDetail";

// The whole page comes from cached content, so require complete static output:
// an unlisted slug waits for the full render instead of an App Shell, letting
// notFound() return a real HTTP 404 rather than a 200 soft-404.
export const ensureStatic = "navigation";

export async function generateStaticParams() {
  return slugParams((await getPublicSnapshot()).products);
}

export async function generateMetadata({ params }: PageProps<"/products/[slug]">) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product not found", robots: { index: false } };
  return pageMetadata({
    title: product.name,
    description: product.summary || `${product.name} — request a quote from JFL Solar.`,
    path: `/products/${product.slug}`,
    noindex: product.is_sample,
  });
}

export default async function ProductPage({ params }: PageProps<"/products/[slug]">) {
  const { slug } = await params;
  const [product, settings] = await Promise.all([getProductBySlug(slug), getSettings()]);
  if (!product) notFound();
  return <ProductDetail product={product} settings={settings} />;
}
