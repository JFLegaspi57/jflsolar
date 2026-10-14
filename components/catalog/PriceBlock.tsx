import { priceDisplay, promoWindow } from "@/lib/pricing";
import type { PricingMode, PromoState } from "@/lib/types";
import { Badge } from "@/components/ui/Badge";

interface Priced {
  pricing_mode: PricingMode;
  price_php: number | null;
  price_basis: string | null;
  price_is_sample: boolean;
}

export function PriceBlock({
  item,
  promo = "none",
  promoLabel,
  promoDates,
  size = "md",
}: {
  item: Priced;
  promo?: PromoState;
  promoLabel?: string | null;
  promoDates?: { promo_start: string | null; promo_end: string | null };
  size?: "md" | "lg";
}) {
  const p = priceDisplay(item, promo);
  const window = promoDates ? promoWindow(promoDates) : null;

  return (
    <div className="space-y-1.5">
      <p
        className={`font-display font-extrabold tabular ${p.hasAmount ? "text-steel-950" : "text-steel-700"} ${
          size === "lg" ? (p.hasAmount ? "text-4xl" : "text-2xl") : p.hasAmount ? "text-2xl" : "text-lg"
        }`}
      >
        {p.headline}
      </p>
      {p.basis && <p className="text-sm text-steel-600">{p.basis}</p>}
      {(p.isSample || promo !== "none") && (
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {p.isSample && <Badge tone="sample">Sample price — not a confirmed offer</Badge>}
          {promo === "active" && <Badge tone="promo">{promoLabel || "Promotion"}{window ? ` · ${window}` : ""}</Badge>}
          {promo === "upcoming" && <Badge tone="promo">Starts {window}</Badge>}
          {promo === "ended" && <Badge tone="ended">Ended{window ? ` · ${window}` : ""}</Badge>}
        </div>
      )}
    </div>
  );
}
