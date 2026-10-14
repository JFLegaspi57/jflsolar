import Link from "next/link";
import { availabilityLabel } from "@/lib/labels";
import { isProductionSite } from "@/lib/env";
import { priceDisplay } from "@/lib/pricing";
import type { PublicProduct } from "@/lib/types";
import { SampleBadge } from "@/components/ui/Badge";
import { MediaImage, PlaceholderImage } from "@/components/ui/Media";

export function productGlyph(slug: string | undefined): "panel" | "inverter" | "battery" | "hardware" {
  if (slug === "inverters") return "inverter";
  if (slug === "batteries") return "battery";
  if (slug === "solar-panels") return "panel";
  return "hardware";
}

export function ProductCard({ product, mediaScope = "public" }: { product: PublicProduct; mediaScope?: "public" | "admin" }) {
  const price = priceDisplay(product);
  const image = product.images.find((m) => m.is_cover) ?? product.images[0];
  return (
    <article className="group relative flex w-full flex-col overflow-hidden rounded-[var(--radius-panel)] border border-steel-200 bg-white transition-shadow hover:shadow-md">
      <div className="aspect-[4/3] bg-steel-100">
        {image ? (
          <MediaImage scope={mediaScope} asset={image} sizes="(min-width: 1024px) 280px, (min-width: 640px) 45vw, 100vw" className="object-contain bg-white" />
        ) : (
          <PlaceholderImage label="Product photo pending" icon={productGlyph(product.category?.slug)} />
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="text-xs font-semibold tracking-wide text-steel-600 uppercase">
          {product.category?.name}
          {product.brand && <> · {product.brand}</>}
        </p>
        <h3 className="mt-1 line-clamp-2 min-h-[2lh] text-base leading-snug font-bold text-steel-950">
          <Link href={`/products/${product.slug}`} className="after:absolute after:inset-0 hover:underline">
            {product.name}
          </Link>
        </h3>
        <p className="mt-0.5 min-h-[1lh] truncate font-mono text-xs text-steel-600">{product.model ?? ""}</p>
        <div className="mt-3 flex flex-1 flex-wrap items-end justify-between gap-2">
          <p className={`font-semibold ${price.hasAmount ? "text-steel-950 tabular" : "text-steel-700"} text-sm`}>
            {price.hasAmount ? price.headline : "Request price"}
          </p>
          <p className="text-xs text-steel-600">{availabilityLabel[product.availability]}</p>
        </div>
        {product.is_sample && !isProductionSite && (
          <div className="mt-2">
            <SampleBadge label="Sample listing" />
          </div>
        )}
      </div>
    </article>
  );
}
