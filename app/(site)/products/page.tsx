import Link from "next/link";
import { Suspense } from "react";
import { getPublicSnapshot } from "@/lib/content/public";
import { brandsOf, filterProducts, parseProductFilters } from "@/lib/catalog";
import { pageMetadata } from "@/lib/seo";
import { quoteHref } from "@/lib/site";
import { Icon } from "@/components/ui/Icon";
import { Container, PageHeader } from "@/components/ui/Section";
import { ProductCard } from "@/components/catalog/ProductCard";

export const metadata = pageMetadata({
  title: "Solar Equipment",
  description:
    "Solar panels, inverters, batteries, mounting hardware, cables, connectors and protection devices. Search the JFL Solar catalogue and request a product quote.",
  path: "/products",
});

const field =
  "min-h-11 w-full rounded-[var(--radius-control)] border border-steel-400 bg-white px-3 text-base text-steel-900 focus:border-steel-900";

export default function ProductsPage({ searchParams }: PageProps<"/products">) {
  return (
    <>
      <PageHeader
        eyebrow="Products"
        title="Solar equipment"
        intro="For DIY buyers and professional installers. Prices are confirmed on request; listing a brand does not imply an authorised distributorship."
      />
      <Suspense fallback={<Container className="py-10"><p role="status">Loading products…</p></Container>}>
        <Catalogue searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function Catalogue({ searchParams }: Pick<PageProps<"/products">, "searchParams">) {
  const filters = parseProductFilters(await searchParams);
  const { products, categories } = await getPublicSnapshot();
  const brands = brandsOf(products);
  const results = filterProducts(products, filters);
  const activeCategory = categories.find((c) => c.slug === filters.category);
  const hasFilters = Boolean(filters.q || filters.category || filters.brand);

  return (
    <Container className="py-10">
      <form action="/products" method="get" role="search" aria-label="Search products" className="grid gap-3 rounded-[var(--radius-panel)] border border-steel-200 bg-steel-50 p-4 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_auto] lg:items-end">
        <div>
          <label htmlFor="q" className="mb-1 block text-sm font-semibold text-steel-900">
            Search
          </label>
          <input id="q" name="q" type="search" defaultValue={filters.q} placeholder="Model, brand or keyword" className={field} />
        </div>
        <div>
          <label htmlFor="category" className="mb-1 block text-sm font-semibold text-steel-900">
            Category
          </label>
          <select id="category" name="category" defaultValue={filters.category} className={field}>
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="brand" className="mb-1 block text-sm font-semibold text-steel-900">
            Brand
          </label>
          <select id="brand" name="brand" defaultValue={filters.brand} className={field}>
            <option value="">All brands</option>
            {brands.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2 sm:col-span-2 lg:col-span-1">
          <button type="submit" className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-[var(--radius-control)] bg-steel-900 px-5 font-semibold text-white hover:bg-steel-800 lg:flex-none">
            <Icon name="search" className="size-4" /> Search
          </button>
          {hasFilters && (
            <Link href="/products" className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-control)] border border-steel-400 px-4 font-semibold text-steel-900 hover:bg-white">
              Clear
            </Link>
          )}
        </div>
      </form>

      <nav aria-label="Categories" className="mt-6 flex flex-wrap gap-2">
        <CategoryChip href="/products" label="All" active={!filters.category} />
        {categories.map((c) => (
          <CategoryChip key={c.id} href={`/products?category=${c.slug}`} label={c.name} active={filters.category === c.slug} />
        ))}
      </nav>

      <div className="mt-6 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-2xl font-bold text-steel-950">{activeCategory ? activeCategory.name : "All products"}</h2>
        <p role="status" className="text-sm text-steel-600">
          {results.length} {results.length === 1 ? "product" : "products"}
          {filters.q && <> matching “{filters.q}”</>}
          {filters.brand && <> · {filters.brand}</>}
        </p>
      </div>

      {results.length ? (
        <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {results.map((p) => (
            <li key={p.id} className="flex">
              <ProductCard product={p} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-6 rounded-[var(--radius-panel)] border border-dashed border-steel-300 p-8 text-center">
          <p className="text-lg font-semibold text-steel-900">No products match your search.</p>
          <p className="mx-auto mt-2 max-w-md text-steel-600">
            Our catalogue online is not exhaustive. Tell us what you need and we will check availability.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link href="/products" className="inline-flex min-h-11 items-center rounded-[var(--radius-control)] border border-steel-400 px-4 font-semibold hover:bg-steel-50">
              Clear filters
            </Link>
            <Link href={quoteHref} className="inline-flex min-h-11 items-center rounded-[var(--radius-control)] bg-gold-500 px-4 font-semibold text-steel-950 hover:bg-gold-400">
              Request a product quote
            </Link>
          </div>
        </div>
      )}
    </Container>
  );
}

function CategoryChip({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className="inline-flex min-h-11 shrink-0 items-center rounded-full border border-steel-300 px-4 text-sm font-semibold whitespace-nowrap text-steel-800 hover:border-steel-900 aria-[current=page]:border-steel-900 aria-[current=page]:bg-steel-900 aria-[current=page]:text-white"
    >
      {label}
    </Link>
  );
}
