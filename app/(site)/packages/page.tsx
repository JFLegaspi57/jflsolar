import Link from "next/link";
import { Suspense } from "react";
import { getPublicSnapshot } from "@/lib/content/public";
import { pageMetadata } from "@/lib/seo";
import { Container, PageHeader } from "@/components/ui/Section";
import { PackageCard } from "@/components/catalog/PackageCard";
import { CompareBar } from "@/components/catalog/CompareBar";

export const metadata = pageMetadata({
  title: "Solar Packages",
  description:
    "Installed solar systems and equipment-only bundles with inverter kW, array kWp and battery kWh, inclusions, exclusions and pricing basis. Compare packages and ask JFL Solar.",
  path: "/packages",
});

const filters = [
  { key: "all", label: "All packages" },
  { key: "installed", label: "Installed systems" },
  { key: "equipment", label: "Equipment only" },
] as const;

export default function PackagesPage({ searchParams }: PageProps<"/packages">) {
  return (
    <>
      <PageHeader
        eyebrow="Packages"
        title="Solar packages"
        intro={
          <>
            <strong className="font-semibold text-steel-900">Installed systems</strong> include assessment, installation and commissioning.{" "}
            <strong className="font-semibold text-steel-900">Equipment-only bundles</strong> are supply only — installation is not included.
          </>
        }
      />
      <Suspense fallback={<PackagesSkeleton />}>
        <PackageList searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function PackageList({ searchParams }: Pick<PageProps<"/packages">, "searchParams">) {
  const { type } = await searchParams;
  const active = type === "installed" || type === "equipment" ? type : "all";
  const { packages } = await getPublicSnapshot();
  const shown = packages.filter(
    (p) => active === "all" || (active === "installed" ? p.package_type === "installed_system" : p.package_type === "equipment_bundle"),
  );

  return (
    <>
      <Container className="pt-10 pb-24">
        <nav aria-label="Package type" className="-mx-1 flex flex-wrap gap-2">
          {filters.map((f) => (
            <Link
              key={f.key}
              href={f.key === "all" ? "/packages" : `/packages?type=${f.key}`}
              aria-current={active === f.key ? "page" : undefined}
              className="inline-flex min-h-11 items-center rounded-full border border-steel-300 px-4 text-sm font-semibold text-steel-800 hover:border-steel-900 aria-[current=page]:border-steel-900 aria-[current=page]:bg-steel-900 aria-[current=page]:text-white"
            >
              {f.label}
            </Link>
          ))}
        </nav>
        <p className="mt-4 text-sm text-steel-600" role="status">
          {shown.length} {shown.length === 1 ? "package" : "packages"}
        </p>

        <form id="compare-form" action="/packages/compare" method="get" aria-label="Compare packages" />
        {shown.length > 1 && (
          <div className="mt-4">
            <CompareBar formId="compare-form" />
          </div>
        )}
        {shown.length ? (
          <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {shown.map((pkg) => (
              <PackageCard key={pkg.id} pkg={pkg} headingLevel="h2" compareForm="compare-form" />
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-[var(--radius-panel)] border border-dashed border-steel-300 p-8 text-center">
            <p className="font-semibold text-steel-900">No packages in this category yet.</p>
            <p className="mt-1 text-steel-600">
              <Link href="/contact#quote" className="font-semibold underline">
                Request a quotation
              </Link>{" "}
              and we will recommend a system.
            </p>
          </div>
        )}
        <p className="mt-8 max-w-3xl text-sm text-steel-600">
          Prices marked as samples are for demonstration only. Final pricing, delivery charges and installation scheduling are confirmed in a
          written quotation.
        </p>
      </Container>
    </>
  );
}

function PackagesSkeleton() {
  return (
    <Container className="py-10">
      <p className="sr-only" role="status">Loading packages…</p>
      <div aria-hidden="true" className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-96 animate-pulse rounded-[var(--radius-panel)] bg-steel-100" />
        ))}
      </div>
    </Container>
  );
}
