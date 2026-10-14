import type { PublicProduct } from "./types";

/** Maximum number of packages in a comparison. */
export const MAX_COMPARE = 3;

export interface ProductFilters {
  q: string;
  category: string;
  brand: string;
}

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export function parseProductFilters(sp: Record<string, string | string[] | undefined>): ProductFilters {
  return {
    q: first(sp.q).trim().slice(0, 80),
    category: first(sp.category).trim().slice(0, 80),
    brand: first(sp.brand).trim().slice(0, 60),
  };
}

const norm = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "");

/** Case/accent-insensitive search across name, brand, model, category, summary and spec values. */
export function filterProducts(products: PublicProduct[], f: ProductFilters): PublicProduct[] {
  const terms = norm(f.q).split(/\s+/).filter(Boolean);
  return products.filter((p) => {
    if (f.category && p.category?.slug !== f.category) return false;
    if (f.brand && (p.brand ?? "").toLowerCase() !== f.brand.toLowerCase()) return false;
    if (!terms.length) return true;
    const hay = norm(
      [p.name, p.brand, p.model, p.sku, p.category?.name, p.summary, ...p.specs.map((s) => `${s.label} ${s.value}`)].filter(Boolean).join(" "),
    );
    return terms.every((t) => hay.includes(t));
  });
}

export function brandsOf(products: PublicProduct[]): string[] {
  return [...new Set(products.map((p) => p.brand).filter((b): b is string => Boolean(b)))].sort((a, b) => a.localeCompare(b));
}
