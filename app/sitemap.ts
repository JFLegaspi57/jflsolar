import type { MetadataRoute } from "next";
import { getPublicSnapshot } from "@/lib/content/public";
import { isProductionSite, siteUrl } from "@/lib/env";

/** Published, non-sample content only. Empty on preview deployments. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!isProductionSite) return [];
  const { packages, products, projects } = await getPublicSnapshot();
  const pages = ["", "/services", "/packages", "/products", "/projects", "/about", "/contact", "/privacy", "/terms"];
  const real = <T extends { is_sample: boolean }>(items: T[]) => items.filter((i) => !i.is_sample);
  return [
    ...pages.map((p) => ({ url: `${siteUrl}${p}` })),
    ...real(packages).map((p) => ({ url: `${siteUrl}/packages/${p.slug}`, lastModified: p.updated_at })),
    ...real(products).map((p) => ({ url: `${siteUrl}/products/${p.slug}`, lastModified: p.updated_at })),
    ...real(projects).map((p) => ({ url: `${siteUrl}/projects/${p.slug}`, lastModified: p.updated_at })),
  ];
}
