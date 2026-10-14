import type { MetadataRoute } from "next";
import { isProductionSite, siteUrl } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  if (!isProductionSite) {
    // Proposal/preview deployments must never be indexed.
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  }
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/auth", "/packages/compare", "/media/"] }],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
