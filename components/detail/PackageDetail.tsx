import { fulfillmentLabel, packageTypeHint, systemTypeLabel } from "@/lib/labels";
import { isProductionSite } from "@/lib/env";
import { telHref } from "@/lib/site";
import { ButtonLink } from "@/components/ui/Button";
import { SampleBadge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { MediaImage, mediaUrl } from "@/components/ui/Media";
import { Container } from "@/components/ui/Section";
import { Breadcrumbs } from "@/components/catalog/Breadcrumbs";
import { PackageTypeTag } from "@/components/catalog/PackageCard";
import { PriceBlock } from "@/components/catalog/PriceBlock";
import { SpecRow } from "@/components/catalog/SpecRow";
import { Paragraphs } from "@/components/content/Blocks";
import type { PublicPackage, SiteSettings } from "@/lib/types";

export function PackageDetail({ pkg, settings, mediaScope = "public" }: { pkg: PublicPackage; settings: SiteSettings; mediaScope?: "public" | "admin" }) {

  const askHref = `/contact?package=${encodeURIComponent(pkg.slug)}#quote`;
  const warranty = pkg.warranty_terms || settings.general_warranty || "Warranty terms to be confirmed.";

  return (
    <article aria-labelledby="pkg-title">
      <div className="border-b border-steel-200 bg-steel-50">
        <Container className="py-8 sm:py-10">
          <Breadcrumbs items={[{ href: "/", label: "Home" }, { href: "/packages", label: "Packages" }, { label: pkg.name }]} />
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <PackageTypeTag type={pkg.package_type} />
            {pkg.system_type && <span className="text-sm font-semibold tracking-wide text-steel-600 uppercase">{systemTypeLabel[pkg.system_type]}</span>}
            {pkg.is_sample && !isProductionSite && <SampleBadge label="Sample package" />}
          </div>
          <h1 id="pkg-title" className="mt-3 max-w-3xl text-3xl font-extrabold text-steel-950 sm:text-4xl">
            {pkg.name}
          </h1>
          <p className="mt-3 max-w-2xl text-lg text-steel-600">{pkg.summary}</p>
          <p className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-steel-800">
            <Icon name="check" className="size-4 text-gold-800" /> {packageTypeHint[pkg.package_type]}
          </p>
        </Container>
      </div>

      <Container className="grid gap-10 py-10 lg:grid-cols-[1fr_22rem] lg:py-14">
        <aside aria-label="Price and inquiry" className="lg:sticky lg:top-28 lg:col-start-2 lg:row-start-1 lg:self-start">
          <div className="rounded-[var(--radius-panel)] border border-steel-300 bg-white p-6 shadow-sm">
            <PriceBlock item={pkg} promo={pkg.promo_state} promoLabel={pkg.promo_label} promoDates={pkg} size="lg" />
            <ButtonLink href={askHref} size="lg" className="mt-6 w-full">
              Ask About This Package
            </ButtonLink>
            <a
              href={telHref(settings.phone_e164)}
              className="mt-3 flex min-h-11 items-center justify-center gap-2 font-semibold text-steel-900 hover:underline"
            >
              <Icon name="phone" className="size-4" /> Call {settings.phone_display}
            </a>
            <p className="mt-4 border-t border-steel-200 pt-4 text-sm text-steel-600">{settings.service_area_note}</p>
          </div>
        </aside>
        <div className="min-w-0 space-y-10 lg:col-start-1 lg:row-start-1">
          <section aria-labelledby="capacity-title">
            <h2 id="capacity-title" className="mb-3 text-xl font-bold text-steel-950">
              System capacity
            </h2>
            <SpecRow inverter={pkg.inverter_kw} array={pkg.array_kwp} battery={pkg.battery_kwh} />
          </section>

          {pkg.images.length > 0 && (
            <section aria-label="Package images" className="grid gap-3 sm:grid-cols-2">
              {pkg.images.map((img, i) => (
                <figure key={img.id} className={`overflow-hidden rounded-[var(--radius-panel)] border border-steel-200 ${i === 0 ? "sm:col-span-2" : ""}`}>
                  <div className="aspect-[16/10]">
                    <MediaImage scope={mediaScope} asset={img} sizes="(min-width: 1024px) 700px, 100vw" priority={i === 0} />
                  </div>
                  <figcaption className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-3 py-2 text-sm text-steel-600">
                    <span>{img.caption}</span>
                    <a
                      href={mediaUrl(img, `${Math.max(...img.widths)}.webp`, mediaScope)}
                      target="_blank"
                      rel="noopener"
                      className="inline-flex min-h-11 items-center font-semibold text-steel-900 underline"
                    >
                      Open full-size image<span className="sr-only"> (opens in a new tab)</span>
                    </a>
                  </figcaption>
                </figure>
              ))}
            </section>
          )}

          {pkg.components.length > 0 && (
            <section aria-labelledby="components-title">
              <h2 id="components-title" className="mb-3 text-xl font-bold text-steel-950">
                Components
              </h2>
              <div className="overflow-hidden rounded-[var(--radius-panel)] border border-steel-200">
                <table className="w-full text-left text-[0.95rem]">
                  <caption className="sr-only">Components in {pkg.name}</caption>
                  <thead className="bg-steel-50 text-xs tracking-wide text-steel-600 uppercase">
                    <tr>
                      <th scope="col" className="px-4 py-2.5 font-semibold">Component</th>
                      <th scope="col" className="px-4 py-2.5 font-semibold">Details</th>
                      <th scope="col" className="px-4 py-2.5 text-right font-semibold">Qty</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-steel-200">
                    {pkg.components.map((c, i) => (
                      <tr key={i}>
                        <th scope="row" className="px-4 py-3 font-semibold text-steel-900">{c.label}</th>
                        <td className="px-4 py-3 text-steel-700">{c.detail}</td>
                        <td className="px-4 py-3 text-right whitespace-nowrap text-steel-700 tabular">{c.quantity ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          <div className="grid gap-6 sm:grid-cols-2">
            <section aria-labelledby="incl-title" className="rounded-[var(--radius-panel)] border border-steel-200 p-5">
              <h2 id="incl-title" className="text-lg font-bold text-steel-950">Included</h2>
              {pkg.inclusions.length ? (
                <ul className="mt-3 space-y-2">
                  {pkg.inclusions.map((x) => (
                    <li key={x} className="flex items-start gap-2 text-steel-800">
                      <Icon name="check" className="mt-1 size-4 text-ok-700" />
                      {x}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-steel-600">Confirmed in your quotation.</p>
              )}
            </section>
            <section aria-labelledby="excl-title" className="rounded-[var(--radius-panel)] border border-steel-200 p-5">
              <h2 id="excl-title" className="text-lg font-bold text-steel-950">Not included</h2>
              {pkg.exclusions.length ? (
                <ul className="mt-3 space-y-2">
                  {pkg.exclusions.map((x) => (
                    <li key={x} className="flex items-start gap-2 text-steel-800">
                      <Icon name="x" className="mt-1 size-4 text-danger-700" />
                      {x}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-steel-600">Confirmed in your quotation.</p>
              )}
            </section>
          </div>

          {pkg.description && (
            <section aria-labelledby="about-title">
              <h2 id="about-title" className="mb-2 text-xl font-bold text-steel-950">About this package</h2>
              <Paragraphs text={pkg.description} className="max-w-2xl text-steel-700" />
            </section>
          )}

          <dl className="grid gap-x-8 gap-y-5 border-t border-steel-200 pt-8 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-bold tracking-wide text-steel-950 uppercase">Installation</dt>
              <dd className="mt-1 text-steel-700">{pkg.installation_terms || "Confirmed during quotation."}</dd>
            </div>
            <div>
              <dt className="text-sm font-bold tracking-wide text-steel-950 uppercase">Pickup and delivery</dt>
              <dd className="mt-1 text-steel-700">
                {fulfillmentLabel[pkg.fulfillment]}
                {pkg.fulfillment_notes && <span className="block text-sm text-steel-600">{pkg.fulfillment_notes}</span>}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-sm font-bold tracking-wide text-steel-950 uppercase">Warranty</dt>
              <dd className="mt-1 text-steel-700">{warranty}</dd>
            </div>
          </dl>
        </div>

      </Container>
    </article>
  );
}
