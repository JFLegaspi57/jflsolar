import Link from "next/link";
import { fulfillmentLabel, packageTypeLabel, systemTypeLabel } from "@/lib/labels";
import { isProductionSite } from "@/lib/env";
import type { PublicPackage } from "@/lib/types";
import { SampleBadge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { PriceBlock } from "./PriceBlock";
import { SpecRow } from "./SpecRow";

export function PackageTypeTag({ type }: { type: PublicPackage["package_type"] }) {
  return type === "installed_system" ? (
    <span className="inline-flex items-center gap-1.5 rounded bg-steel-900 px-2 py-1 text-xs font-bold tracking-wide text-white uppercase">
      <Icon name="tools" className="size-3.5" /> {packageTypeLabel[type]}
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded border-2 border-gold-500 bg-gold-50 px-2 py-0.5 text-xs font-bold tracking-wide text-gold-800 uppercase">
      <Icon name="battery" className="size-3.5" /> {packageTypeLabel[type]}
    </span>
  );
}

export function PackageCard({
  pkg,
  headingLevel = "h3",
  compareForm,
}: {
  pkg: PublicPackage;
  headingLevel?: "h2" | "h3";
  /** id of a GET form to attach a compare checkbox to */
  compareForm?: string;
}) {
  const H = headingLevel;
  const headingId = `pkg-${pkg.slug}`;
  return (
    <article
      aria-labelledby={headingId}
      className={`flex flex-col rounded-[var(--radius-panel)] border bg-white p-5 sm:p-6 ${
        pkg.package_type === "installed_system" ? "border-steel-300" : "border-gold-200"
      }`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <PackageTypeTag type={pkg.package_type} />
        {pkg.system_type && <span className="text-xs font-semibold tracking-wide text-steel-600 uppercase">{systemTypeLabel[pkg.system_type]}</span>}
        {pkg.is_sample && !isProductionSite && <SampleBadge />}
      </div>
      <H id={headingId} className="mt-3 text-xl font-bold text-steel-950">
        <Link href={`/packages/${pkg.slug}`} className="hover:underline">
          {pkg.name}
        </Link>
      </H>
      <p className="mt-2 text-[0.95rem] text-steel-600">{pkg.summary}</p>
      <div className="mt-4">
        <SpecRow inverter={pkg.inverter_kw} array={pkg.array_kwp} battery={pkg.battery_kwh} dense />
      </div>
      <div className="mt-5 flex-1">
        <PriceBlock item={pkg} promo={pkg.promo_state} promoLabel={pkg.promo_label} promoDates={pkg} />
        <p className="mt-2 flex items-center gap-1.5 text-sm text-steel-700">
          <Icon name={pkg.fulfillment === "installed" ? "tools" : "warehouse"} className="size-4 text-steel-500" />
          {fulfillmentLabel[pkg.fulfillment]}
        </p>
      </div>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-steel-200 pt-4">
        <Link href={`/packages/${pkg.slug}`} className="inline-flex min-h-11 items-center gap-1.5 font-semibold text-steel-900 hover:underline">
          View package <span className="sr-only">{pkg.name}</span>
          <Icon name="arrow" className="size-4" />
        </Link>
        {compareForm && (
          <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 text-sm font-semibold text-steel-700">
            <input
              type="checkbox"
              name="p"
              value={pkg.slug}
              form={compareForm}
              className="size-5 rounded border-steel-400 accent-steel-900"
              data-compare
            />
            Compare <span className="sr-only">{pkg.name}</span>
          </label>
        )}
      </div>
    </article>
  );
}
