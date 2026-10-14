import Link from "next/link";
import { getSettings } from "@/lib/content/public";
import { pageMetadata } from "@/lib/seo";
import { quoteHref } from "@/lib/site";
import { processSteps, systemTypes } from "@/lib/services";
import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { PageHeader, Section, SectionHeading } from "@/components/ui/Section";

export const metadata = pageMetadata({
  title: "Solar Services",
  description:
    "Solar PV assessment, consultancy, proposal, installation, commissioning and after-sales support for residential, commercial and industrial customers in the Philippines.",
  path: "/services",
});

const audiences = [
  {
    id: "residential",
    title: "Residential",
    body: "Rooftop systems for houses — focused on reducing electricity bills and, with a battery, keeping essential loads running during outages.",
    points: ["Bill and load review", "On-grid or hybrid design", "Battery sizing for backup"],
  },
  {
    id: "commercial",
    title: "Commercial",
    body: "Offices, shops, schools and other establishments with significant daytime consumption.",
    points: ["Load profile review", "Roof and structural check", "Engineered proposal"],
  },
  {
    id: "industrial",
    title: "Industrial",
    body: "Factories, warehouses and larger sites where system design must account for heavy loads and site constraints.",
    points: ["Site assessment", "System design and equipment selection", "Coordinated installation"],
  },
];

export default async function ServicesPage() {
  const settings = await getSettings();
  return (
    <>
      <PageHeader
        eyebrow="Solar services"
        title="Solar PV for homes, businesses and industry"
        intro="Assessment, consultancy, installation and after-sales support — or equipment only, if you have your own installer."
      >
        <div className="flex flex-wrap gap-3">
          <ButtonLink href={quoteHref}>Request a Quote</ButtonLink>
          <ButtonLink href="/packages" variant="secondary">
            View packages
          </ButtonLink>
        </div>
      </PageHeader>

      <Section labelledBy="who-title" id="installation">
        <SectionHeading id="who-title" eyebrow="Who we work with" title="Residential, commercial and industrial" />
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {audiences.map((a) => (
            <section key={a.id} id={a.id} aria-labelledby={`${a.id}-title`} className="rounded-[var(--radius-panel)] border border-steel-200 p-6">
              <h3 id={`${a.id}-title`} className="text-xl font-bold text-steel-950">
                {a.title}
              </h3>
              <p className="mt-2 text-steel-600">{a.body}</p>
              <ul className="mt-4 space-y-1.5">
                {a.points.map((p) => (
                  <li key={p} className="flex items-start gap-2 text-steel-800">
                    <Icon name="check" className="mt-1 size-4 text-gold-800" />
                    {p}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </Section>

      <Section tone="muted" labelledBy="process-title" id="consultancy">
        <SectionHeading
          id="process-title"
          eyebrow="Our process"
          title="Six stages, one accountable team"
          intro={settings.service_area_note ?? undefined}
        />
        <ol className="mt-10 space-y-0 border-l-2 border-steel-300">
          {processSteps.map((step, i) => (
            <li key={step.title} className="relative pb-8 pl-8 last:pb-0">
              <span
                aria-hidden="true"
                className="absolute top-0 -left-[1.05rem] inline-flex size-8 items-center justify-center rounded-full bg-steel-900 font-display text-sm font-bold text-gold-400 tabular"
              >
                {i + 1}
              </span>
              <h3 className="text-xl font-bold text-steel-950">
                <span className="sr-only">Step {i + 1}: </span>
                {step.title}
              </h3>
              <p className="mt-1 max-w-2xl text-steel-700">{step.body}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section labelledBy="types-title" id="system-types">
        <SectionHeading
          id="types-title"
          eyebrow="System types"
          title="On-grid, hybrid or off-grid?"
          intro="The right choice depends on your loads, your grid reliability and whether you need backup power. We confirm suitability during assessment."
        />
        <div className="mt-10 grid gap-px overflow-hidden rounded-[var(--radius-panel)] border border-steel-200 bg-steel-200 lg:grid-cols-3">
          {systemTypes.map((t) => (
            <section key={t.key} aria-labelledby={`type-${t.key}`} className="bg-white p-6 sm:p-8">
              <p className="text-sm font-semibold tracking-wide text-gold-800 uppercase">{t.lead}</p>
              <h3 id={`type-${t.key}`} className="mt-1 text-2xl font-extrabold text-steel-950">
                {t.title}
              </h3>
              <p className="mt-3 text-steel-700">{t.body}</p>
              <p className="mt-4 border-t border-steel-200 pt-4 text-sm text-steel-600">
                <strong className="text-steel-900">Often suits: </strong>
                {t.suits}
              </p>
            </section>
          ))}
        </div>
        <p className="mt-6 max-w-3xl text-sm text-steel-600">
          Savings, backup duration and payback depend on your consumption, tariff, roof and equipment. We do not quote guaranteed savings; your
          proposal will explain the assumptions behind any estimate.
        </p>
      </Section>

      <Section tone="dark" labelledBy="cta-title">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div>
            <h2 id="cta-title" className="text-3xl font-extrabold text-white">
              Ready for an assessment?
            </h2>
            <p className="mt-2 text-steel-300">
              Tell us about your property and electricity use. Prefer to talk? Call{" "}
              <a href={`tel:${settings.phone_e164}`} className="font-semibold text-white underline">
                {settings.phone_display}
              </a>
              .
            </p>
          </div>
          <ButtonLink href={quoteHref} size="lg">
            Request a Quote
          </ButtonLink>
        </div>
        <p className="mt-6 text-sm text-steel-400">
          Only need equipment?{" "}
          <Link href="/products" className="font-semibold text-white underline">
            Browse products
          </Link>
          .
        </p>
      </Section>
    </>
  );
}
