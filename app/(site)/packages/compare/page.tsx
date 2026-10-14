import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { getPublicSnapshot } from "@/lib/content/public";
import { fulfillmentLabel, packageTypeLabel, pricingModeLabel, systemTypeLabel } from "@/lib/labels";
import { formatCapacity, priceDisplay, promoWindow } from "@/lib/pricing";
import { pageMetadata } from "@/lib/seo";
import type { PublicPackage } from "@/lib/types";
import { ButtonLink } from "@/components/ui/Button";
import { Container, PageHeader } from "@/components/ui/Section";
import { MAX_COMPARE } from "@/lib/catalog";

export const metadata = pageMetadata({
  title: "Compare packages",
  description: "Compare JFL Solar packages side by side.",
  path: "/packages/compare",
  noindex: true,
});

export default function ComparePage({ searchParams }: PageProps<"/packages/compare">) {
  return (
    <>
      <PageHeader eyebrow="Packages" title="Compare packages" />
      <Suspense fallback={<Container className="py-10"><p role="status">Loading comparison…</p></Container>}>
        <Comparison searchParams={searchParams} />
      </Suspense>
    </>
  );
}

function List({ items, empty }: { items: string[]; empty: string }) {
  return items.length ? (
    <ul className="list-disc space-y-0.5 pl-4">
      {items.map((i) => (
        <li key={i}>{i}</li>
      ))}
    </ul>
  ) : (
    <span className="text-steel-600">{empty}</span>
  );
}

function rows(): { label: string; render: (p: PublicPackage) => ReactNode }[] {
  return [
    { label: "Offer type", render: (p) => <strong>{packageTypeLabel[p.package_type]}</strong> },
    { label: "Installation", render: (p) => (p.package_type === "installed_system" ? p.installation_terms || "Included" : p.installation_terms || "Not included") },
    { label: "System type", render: (p) => (p.system_type ? systemTypeLabel[p.system_type] : "—") },
    { label: "Inverter (kW)", render: (p) => formatCapacity(p.inverter_kw, "kW") ?? "—" },
    { label: "Solar array (kWp)", render: (p) => formatCapacity(p.array_kwp, "kWp") ?? "—" },
    { label: "Battery (kWh)", render: (p) => formatCapacity(p.battery_kwh, "kWh") ?? "Not included" },
    {
      label: "Price",
      render: (p) => {
        const d = priceDisplay(p, p.promo_state);
        return (
          <span>
            <strong className="tabular">{d.headline}</strong>
            {d.isSample && <span className="block text-xs text-steel-600">Sample price — not a confirmed offer</span>}
          </span>
        );
      },
    },
    { label: "Pricing mode and basis", render: (p) => [pricingModeLabel[p.pricing_mode], p.price_basis].filter(Boolean).join(" · ") },
    {
      label: "Promotion",
      render: (p) =>
        p.promo_state === "none" ? "—" : `${p.promo_label ?? "Promotion"} (${p.promo_state === "ended" ? "ended" : p.promo_state}) ${promoWindow(p) ?? ""}`,
    },
    { label: "Pickup and delivery", render: (p) => [fulfillmentLabel[p.fulfillment], p.fulfillment_notes].filter(Boolean).join(". ") },
    { label: "Included", render: (p) => <List items={p.inclusions} empty="Confirmed in quotation" /> },
    { label: "Not included", render: (p) => <List items={p.exclusions} empty="Confirmed in quotation" /> },
    { label: "Warranty", render: (p) => p.warranty_terms || "Warranty terms to be confirmed" },
  ];
}

async function Comparison({ searchParams }: Pick<PageProps<"/packages/compare">, "searchParams">) {
  const { p } = await searchParams;
  const requested = [...new Set((Array.isArray(p) ? p : p ? p.split(",") : []).map((s) => s.trim()).filter(Boolean))];
  const { packages } = await getPublicSnapshot();
  const selected = requested.map((slug) => packages.find((x) => x.slug === slug)).filter((x): x is PublicPackage => Boolean(x));
  const shown = selected.slice(0, MAX_COMPARE);
  const truncated = selected.length > MAX_COMPARE;
  const missing = requested.length - selected.length;

  if (shown.length < 2) {
    return (
      <Container className="py-12">
        <p className="text-lg text-steel-800">Select at least two packages to compare.</p>
        {missing > 0 && <p className="mt-2 text-steel-600">Some selected packages are no longer available.</p>}
        <ButtonLink href="/packages" className="mt-6">
          Choose packages
        </ButtonLink>
      </Container>
    );
  }

  const table = rows();
  return (
    <Container className="py-10">
      {(truncated || missing > 0) && (
        <p role="status" className="mb-6 rounded-[var(--radius-control)] border border-[#f0d39a] bg-warn-50 px-4 py-3 text-warn-800">
          {truncated && `Only the first ${MAX_COMPARE} packages are compared. `}
          {missing > 0 && "Some selected packages are no longer available."}
        </p>
      )}

      {/* ≥768px: one semantic table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full table-fixed border-collapse text-left text-[0.95rem]">
          <caption className="sr-only">Comparison of {shown.map((s) => s.name).join(", ")}</caption>
          <colgroup>
            <col className="w-48" />
            {shown.map((s) => (
              <col key={s.id} />
            ))}
          </colgroup>
          <thead>
            <tr className="border-b-2 border-steel-900 align-bottom">
              <td />
              {shown.map((s) => (
                <th key={s.id} scope="col" className="px-4 pb-4">
                  <Link href={`/packages/${s.slug}`} className="text-lg font-bold text-steel-950 hover:underline">
                    {s.name}
                  </Link>
                  {s.is_sample && <span className="mt-1 block text-xs font-semibold text-steel-600">Sample package</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-steel-200">
            {table.map((row) => (
              <tr key={row.label} className="align-top">
                <th scope="row" className="bg-steel-50 px-4 py-3 text-sm font-semibold text-steel-800">
                  {row.label}
                </th>
                {shown.map((s) => (
                  <td key={s.id} className="px-4 py-3 text-steel-800">
                    {row.render(s)}
                  </td>
                ))}
              </tr>
            ))}
            <tr>
              <td />
              {shown.map((s) => (
                <td key={s.id} className="px-4 py-5">
                  <ButtonLink href={`/contact?package=${encodeURIComponent(s.slug)}#quote`} size="sm">
                    Ask about this package<span className="sr-only">: {s.name}</span>
                  </ButtonLink>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {/* <768px: attribute-first groups, no horizontal scrolling */}
      <div className="space-y-6 md:hidden">
        <ol className="space-y-1 text-sm text-steel-700">
          {shown.map((s, i) => (
            <li key={s.id}>
              <span className="mr-2 inline-flex size-6 items-center justify-center rounded-full bg-steel-900 text-xs font-bold text-white">{i + 1}</span>
              <Link href={`/packages/${s.slug}`} className="font-semibold text-steel-950 underline">
                {s.name}
              </Link>
              {s.is_sample && <span className="ml-2 text-xs font-semibold text-steel-600">(sample)</span>}
            </li>
          ))}
        </ol>
        {table.map((row) => (
          <section key={row.label} aria-label={row.label} className="rounded-[var(--radius-panel)] border border-steel-200">
            <h2 className="border-b border-steel-200 bg-steel-50 px-4 py-2 text-sm font-bold text-steel-900">{row.label}</h2>
            <dl className="divide-y divide-steel-200">
              {shown.map((s, i) => (
                <div key={s.id} className="grid grid-cols-[1.75rem_1fr] gap-2 px-4 py-2.5">
                  <dt>
                    <span className="inline-flex size-6 items-center justify-center rounded-full bg-steel-900 text-xs font-bold text-white">{i + 1}</span>
                    <span className="sr-only">{s.name}</span>
                  </dt>
                  <dd className="min-w-0 text-steel-800">{row.render(s)}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
        <div className="space-y-2">
          {shown.map((s, i) => (
            <ButtonLink key={s.id} href={`/contact?package=${encodeURIComponent(s.slug)}#quote`} variant={i === 0 ? "primary" : "secondary"} className="w-full">
              Ask about package {i + 1}
              <span className="sr-only">: {s.name}</span>
            </ButtonLink>
          ))}
        </div>
      </div>
    </Container>
  );
}
