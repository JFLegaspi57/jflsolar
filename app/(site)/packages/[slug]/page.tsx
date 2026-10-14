import { notFound } from "next/navigation";
import { getPackageBySlug, getPublicSnapshot, getSettings, slugParams } from "@/lib/content/public";
import { pageMetadata } from "@/lib/seo";
import { PackageDetail } from "@/components/detail/PackageDetail";

// The whole page comes from cached content, so require complete static output:
// an unlisted slug waits for the full render instead of an App Shell, letting
// notFound() return a real HTTP 404 rather than a 200 soft-404.
export const ensureStatic = "navigation";

export async function generateStaticParams() {
  return slugParams((await getPublicSnapshot()).packages);
}

export async function generateMetadata({ params }: PageProps<"/packages/[slug]">) {
  const { slug } = await params;
  const pkg = await getPackageBySlug(slug);
  if (!pkg) return { title: "Package not found", robots: { index: false } };
  return pageMetadata({ title: pkg.name, description: pkg.summary || pkg.name, path: `/packages/${pkg.slug}`, noindex: pkg.is_sample });
}

export default async function PackagePage({ params }: PageProps<"/packages/[slug]">) {
  const { slug } = await params;
  const [pkg, settings] = await Promise.all([getPackageBySlug(slug), getSettings()]);
  if (!pkg) notFound();
  return <PackageDetail pkg={pkg} settings={settings} />;
}
