import { Suspense } from "react";
import { connection } from "next/server";
import { getPublicSnapshot, getSettings } from "@/lib/content/public";
import { isInquiryDeliveryConfigured } from "@/lib/env.server";
import { emptyInquiry, type InquiryValues } from "@/lib/inquiry/schema";
import { issueToken } from "@/lib/inquiry/server";
import { pageMetadata } from "@/lib/seo";
import { Container, PageHeader } from "@/components/ui/Section";
import { Addresses, ContactRoutes } from "@/components/contact/ContactRoutes";
import { InquiryForm } from "@/components/contact/InquiryForm";

export const metadata = pageMetadata({
  title: "Contact and Request a Quote",
  description:
    "Request a quotation for solar installation, consultancy, packages or equipment. Call, message on WhatsApp or Viber, or send an inquiry to JFL Solar.",
  path: "/contact",
});

export default async function ContactPage({ searchParams }: PageProps<"/contact">) {
  const settings = await getSettings();
  return (
    <>
      <PageHeader eyebrow="Contact" title="Request a quote" intro={`${settings.service_area} ${settings.service_area_note ?? ""}`} />
      <Container className="grid gap-12 py-10 sm:py-14 lg:grid-cols-[1.25fr_1fr]">
        <section id="quote" aria-labelledby="quote-title" className="scroll-mt-28">
          <h2 id="quote-title" className="text-2xl font-bold text-steel-950">
            Send an inquiry
          </h2>
          <p className="mt-1 mb-6 text-steel-600">Fields marked required must be filled in. Everything else is optional.</p>
          <Suspense fallback={<p role="status" className="text-steel-600">Loading form…</p>}>
            <QuoteForm searchParams={searchParams} />
          </Suspense>
        </section>

        <aside aria-labelledby="direct-title" className="space-y-8">
          <div>
            <h2 id="direct-title" className="text-2xl font-bold text-steel-950">
              Contact us directly
            </h2>
            <p className="mt-1 mb-5 text-steel-600">Prefer to talk? Call or message us.</p>
            <ContactRoutes settings={settings} />
          </div>
          <div>
            <h2 className="mb-4 text-xl font-bold text-steel-950">Office and warehouse</h2>
            <Addresses settings={settings} />
          </div>
        </aside>
      </Container>
    </>
  );
}

async function QuoteForm({ searchParams }: Pick<PageProps<"/contact">, "searchParams">) {
  await connection(); // per-request form token
  const sp = await searchParams;
  const pick = (k: string) => {
    const raw = sp[k];
    return (Array.isArray(raw) ? raw[0] : raw)?.slice(0, 80) ?? "";
  };
  const { packages, products } = await getPublicSnapshot();
  const initial: InquiryValues = { ...emptyInquiry };

  const pkg = packages.find((p) => p.slug === pick("package"));
  const product = !pkg ? products.find((p) => p.slug === pick("product")) : undefined;
  if (pkg) Object.assign(initial, { item_type: "package", item_slug: pkg.slug, item_name: pkg.name, inquiry_type: "package" });
  else if (product) Object.assign(initial, { item_type: "product", item_slug: product.slug, item_name: product.name, inquiry_type: "equipment" });

  const stale = (pick("package") && !pkg) || (pick("product") && !product);

  return (
    <>
      {stale && (
        <p role="status" className="mb-4 rounded-[var(--radius-control)] border border-[#f0d39a] bg-warn-50 px-4 py-3 text-warn-800">
          The item you selected is no longer available. You can still send us a general inquiry.
        </p>
      )}
      <InquiryForm initialValues={initial} token={issueToken()} demo={!isInquiryDeliveryConfigured} />
    </>
  );
}
