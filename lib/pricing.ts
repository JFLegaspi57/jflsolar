import type { Package, PricingMode, PromoState } from "./types";

export const BUSINESS_TIME_ZONE = "Asia/Manila";

/** Today's date (YYYY-MM-DD) in the Philippines. */
export function manilaToday(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: BUSINESS_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

/**
 * Promotion state. Dates are inclusive calendar days in Asia/Manila: a promo
 * ending 2026-10-31 is active until 23:59:59 PHT that day.
 */
export function promoState(pkg: Pick<Package, "promo_start" | "promo_end">, today: string = manilaToday()): PromoState {
  if (!pkg.promo_start && !pkg.promo_end) return "none";
  if (pkg.promo_start && today < pkg.promo_start) return "upcoming";
  if (pkg.promo_end && today > pkg.promo_end) return "ended";
  return "active";
}

const php = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0, minimumFractionDigits: 0 });
const phpCents = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", minimumFractionDigits: 2 });

export function formatPhp(amount: number): string {
  return Number.isInteger(amount) ? php.format(amount) : phpCents.format(amount);
}

export interface PriceDisplay {
  /** Main line, e.g. "₱205,000", "From ₱120,000", "Price to be confirmed". */
  headline: string;
  /** Whether a number is shown. */
  hasAmount: boolean;
  basis: string | null;
  isSample: boolean;
  /** Promotion has ended — any promotional price is withdrawn. */
  withdrawn: boolean;
}

/** What the public sees for a price, after promotion rules are applied. */
export function priceDisplay(
  item: { pricing_mode: PricingMode; price_php: number | null; price_basis: string | null; price_is_sample: boolean },
  promo: PromoState = "none",
): PriceDisplay {
  const withdrawn = promo === "ended";
  if (withdrawn || item.pricing_mode === "quote" || item.price_php === null) {
    return {
      headline: withdrawn ? "Promotion ended — request current price" : "Price to be confirmed",
      hasAmount: false,
      basis: null,
      isSample: false,
      withdrawn,
    };
  }
  const amount = formatPhp(Number(item.price_php));
  return {
    headline: item.pricing_mode === "starting" ? `From ${amount}` : amount,
    hasAmount: true,
    basis: item.price_basis,
    isSample: item.price_is_sample,
    withdrawn: false,
  };
}

const dateFmt = new Intl.DateTimeFormat("en-PH", { timeZone: "UTC", day: "numeric", month: "short", year: "numeric" });

export function formatDate(isoDate: string): string {
  return dateFmt.format(new Date(`${isoDate}T00:00:00Z`));
}

export function promoWindow(pkg: Pick<Package, "promo_start" | "promo_end">): string | null {
  if (pkg.promo_start && pkg.promo_end) return `${formatDate(pkg.promo_start)} – ${formatDate(pkg.promo_end)}`;
  if (pkg.promo_end) return `Until ${formatDate(pkg.promo_end)}`;
  if (pkg.promo_start) return `From ${formatDate(pkg.promo_start)}`;
  return null;
}

export function formatCapacity(value: number | null, unit: "kW" | "kWp" | "kWh"): string | null {
  if (value === null || value === undefined) return null;
  const n = Number(value);
  return `${Number.isInteger(n) ? n : n.toFixed(2).replace(/0$/, "")} ${unit}`;
}
