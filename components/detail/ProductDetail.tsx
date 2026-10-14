import { availabilityLabel } from "@/lib/labels";
import { isProductionSite } from "@/lib/env";
import { telHref } from "@/lib/site";
import { ButtonLink } from "@/components/ui/Button";
import { Badge, SampleBadge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { MediaImage, PlaceholderImage, mediaUrl } from "@/components/ui/Media";
import { Container } from "@/components/ui/Section";
import { Breadcrumbs } from "@/components/catalog/Breadcrumbs";
import { PriceBlock } from "@/components/catalog/PriceBlock";
import { productGlyph } from "@/components/catalog/ProductCard";
import { Paragraphs } from "@/components/content/Blocks";
import type { PublicProduct, SiteSettings } from "@/lib/types";

export function ProductDetail({ product, settings, mediaScope = "public" }: { product: PublicProduct; settings: SiteSettings; mediaScope?: "public" | "admin" }) {

  const [cover, ...rest] = product.images.some((m) => m.is_cover)
    ? [product.images.find((m) => m.is_cover)!, ...product.images.filter((m) => !m.is_cover)]
    : product.images;
  const quoteHref = `/contact?product=${encodeURIComponent(product.slug)}#quote`;

  return (
    <article aria-labelledby="product-title">
      <Container className="py-8 sm:py-10">
        <Breadcrumbs
          items={[
            { href: "/", label: "Home" },
            { href: "/products", label: "Products" },
            ...(product.category ? [{ href: `/products?category=${product.category.slug}`, label: product.category.name }] : []),
            { label: product.name },
          ]}
        />
        <div className="mt-8 grid gap-10 lg:grid-cols-2">
          <div className="space-y-3">
            <div className="aspect-square overflow-hidden rounded-[var(--radius-panel)] border border-steel-200 bg-white">
              {cover ? (
                <MediaImage scope={mediaScope} asset={cover} sizes="(min-width: 1024px) 560px, 100vw" priority className="object-contain" />
              ) : (
                <PlaceholderImage label="Product photo pending" icon={productGlyph(product.category?.slug)} />
              )}
            </div>
            {rest.length > 0 && (
              <ul className="grid grid-cols-4 gap-2" aria-label="More images">
                {rest.map((img) => (
                  <li key={img.id} className="aspect-square overflow-hidden rounded border border-steel-200 bg-white">
                    <MediaImage scope={mediaScope} asset={img} sizes="140px" className="object-contain" />
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              {product.category && <span className="text-sm font-semibold tracking-wide text-steel-600 uppercase">{product.category.name}</span>}
              {product.is_sample && !isProductionSite && <SampleBadge label="Sample listing" />}
            </div>
            <h1 id="product-title" className="mt-2 text-3xl font-extrabold text-steel-950 sm:text-4xl">
              {product.name}
            </h1>
            <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-steel-700">
              {product.brand && (
                <div className="flex gap-1.5">
                  <dt className="font-semibold">Brand:</dt>
                  <dd>{product.brand}</dd>
                </div>
              )}
              {product.model && (
                <div className="flex gap-1.5">
                  <dt className="font-semibold">Model:</dt>
                  <dd className="font-mono">{product.model}</dd>
                </div>
              )}
              {product.sku && (
                <div className="flex gap-1.5">
                  <dt className="font-semibold">SKU:</dt>
                  <dd className="font-mono">{product.sku}</dd>
                </div>
              )}
            </dl>
            {product.summary && <p className="mt-4 text-lg text-steel-700">{product.summary}</p>}

            <div className="mt-6 rounded-[var(--radius-panel)] border border-steel-300 p-5">
              {product.pricing_mode === "quote" ? (
                <p className="font-display text-2xl font-extrabold text-steel-800">Request price</p>
              ) : (
                <PriceBlock item={product} size="lg" />
              )}
              <p className="mt-3">
                <Badge tone={product.availability === "unavailable" ? "ended" : "neutral"}>{availabilityLabel[product.availability]}</Badge>
              </p>
              <p className="mt-2 text-xs text-steel-600">Availability is confirmed when we quote. We do not show live stock levels.</p>
              <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                <ButtonLink href={quoteHref} size="lg" className="flex-1">
                  Request a Product Quote
                </ButtonLink>
                <ButtonLink href={telHref(settings.phone_e164)} variant="secondary" size="lg">
                  <Icon name="phone" className="size-4" /> Call
                </ButtonLink>
              </div>
            </div>

            {product.datasheet && (
              <a
                href={mediaUrl(product.datasheet, "datasheet.pdf", mediaScope)}
                className="mt-4 inline-flex min-h-11 items-center gap-2 font-semibold text-steel-900 underline"
                download
              >
                <Icon name="file" className="size-5 text-gold-800" />
                Download datasheet (PDF{product.datasheet.bytes ? `, ${Math.max(1, Math.round(product.datasheet.bytes / 1024))} KB` : ""})
              </a>
            )}
          </div>
        </div>

        <div className="mt-12 grid gap-10 lg:grid-cols-2">
          <section aria-labelledby="specs-title">
            <h2 id="specs-title" className="text-xl font-bold text-steel-950">
              Specifications
            </h2>
            {product.specs.length ? (
              <table className="mt-3 w-full text-left text-[0.95rem]">
                <caption className="sr-only">Specifications for {product.name}</caption>
                <tbody className="divide-y divide-steel-200 border-y border-steel-200">
                  {product.specs.map((s, i) => (
                    <tr key={i}>
                      <th scope="row" className="w-1/2 py-2.5 pr-4 font-semibold text-steel-800">{s.label}</th>
                      <td className="py-2.5 text-steel-900 tabular">{s.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="mt-3 text-steel-600">Specifications to be confirmed. Ask us for the datasheet.</p>
            )}
          </section>
          <section aria-labelledby="details-title" className="space-y-6">
            {product.description && (
              <div>
                <h2 id="details-title" className="text-xl font-bold text-steel-950">Details</h2>
                <Paragraphs text={product.description} className="mt-3 text-steel-700" />
              </div>
            )}
            <div>
              <h2 className="text-xl font-bold text-steel-950">Warranty</h2>
              <p className="mt-2 text-steel-700">{product.warranty_terms || settings.general_warranty || "Warranty terms to be confirmed."}</p>
            </div>
          </section>
        </div>
      </Container>
    </article>
  );
}
