import { getPublicSnapshot } from "@/lib/content/public";
import { pageMetadata } from "@/lib/seo";
import { quoteHref } from "@/lib/site";
import type { ContentBlock, MediaAsset } from "@/lib/types";
import { ButtonLink } from "@/components/ui/Button";
import { MediaImage } from "@/components/ui/Media";
import { PageHeader, Section, SectionHeading } from "@/components/ui/Section";
import { ClaimMarker, Paragraphs } from "@/components/content/Blocks";
import { Addresses } from "@/components/contact/ContactRoutes";

export const metadata = pageMetadata({
  title: "About JFL Solar",
  description: "JFL Solar provides solar PV installation, consultancy and equipment distribution in the Philippines. Our mission, vision and approach.",
  path: "/about",
});

export default async function AboutPage() {
  const { blocks, settings, blockImages } = await getPublicSnapshot();
  const get = (key: string) => blocks.find((b) => b.key === key);
  const intro = get("about.intro");
  const history = get("about.history");
  const mission = get("about.mission");
  const vision = get("about.vision");
  const founder = get("about.founder");
  const why = blocks.filter((b) => b.section === "why");
  const founderPhoto = founder ? blockImages[founder.key]?.[0] : undefined;
  // Any other "about" blocks staff add appear after the standard ones.
  const known = new Set(["about.intro", "about.history", "about.mission", "about.vision", "about.founder"]);
  const extra = blocks.filter((b) => b.section === "about" && !known.has(b.key));

  return (
    <>
      <PageHeader eyebrow="About us" title={intro?.title ?? "About JFL Solar"} intro={settings.service_area} />

      <Section labelledBy="story-title">
        <div className="grid gap-10 lg:grid-cols-2">
          {intro && (
            <div>
              <h2 id="story-title" className="sr-only">
                Who we are
              </h2>
              {blockImages[intro.key]?.[0] && (
                <div className="mb-6 aspect-[16/9] overflow-hidden rounded-[var(--radius-panel)] bg-steel-100">
                  <MediaImage asset={blockImages[intro.key][0]} sizes="(min-width: 1024px) 560px, 100vw" />
                </div>
              )}
              <Paragraphs text={intro.body} className="text-lg text-steel-700" />
            </div>
          )}
          {history && <BlockPanel block={history} image={blockImages[history.key]?.[0]} />}
        </div>
      </Section>

      {(mission || vision) && (
        <Section tone="dark" labelledBy="mv-title">
          <h2 id="mv-title" className="sr-only">
            Mission and vision
          </h2>
          <div className="grid gap-10 md:grid-cols-2">
            {[mission, vision].filter((b): b is ContentBlock => Boolean(b)).map((b) => (
              <figure key={b.key}>
                {blockImages[b.key]?.[0] && (
                  <div className="mb-5 aspect-[16/9] overflow-hidden rounded-[var(--radius-panel)] bg-steel-900">
                    <MediaImage asset={blockImages[b.key][0]} sizes="(min-width: 768px) 560px, 100vw" />
                  </div>
                )}
                <figcaption className="flex flex-wrap items-center gap-3 text-sm font-semibold tracking-wide text-gold-400 uppercase">
                  <span className="rule-gold" aria-hidden="true" />
                  {b.title}
                  <ClaimMarker block={b} />
                </figcaption>
                <blockquote className="mt-4 font-display text-xl leading-snug font-semibold text-white sm:text-2xl">{b.body}</blockquote>
              </figure>
            ))}
          </div>
        </Section>
      )}

      {founder && (
        <Section labelledBy="founder-title">
          <div className="grid items-start gap-8 md:grid-cols-[14rem_1fr]">
            <div className="aspect-square w-40 overflow-hidden rounded-[var(--radius-panel)] bg-steel-900 md:w-full">
              {founderPhoto ? (
                <MediaImage asset={founderPhoto} sizes="224px" />
              ) : (
                <div role="img" aria-label="Founder photo pending" className="flex h-full items-center justify-center font-display text-5xl font-extrabold text-gold-500">
                  {founder.title
                    .split(/\s+/)
                    .map((w) => w[0])
                    .join("")
                    .slice(0, 3)}
                </div>
              )}
            </div>
            <div>
              <p className="flex flex-wrap items-center gap-3 text-sm font-semibold tracking-wide text-gold-800 uppercase">
                <span className="rule-gold" aria-hidden="true" /> Founder
                <ClaimMarker block={founder} />
              </p>
              <h2 id="founder-title" className="mt-3 text-3xl font-extrabold text-steel-950">
                {founder.title}
              </h2>
              {founder.subtitle && <p className="mt-1 font-semibold text-steel-600">{founder.subtitle}</p>}
              <Paragraphs text={founder.body} className="mt-4 max-w-2xl text-lg text-steel-700" />
            </div>
          </div>
        </Section>
      )}

      {why.length > 0 && (
        <Section tone="muted" labelledBy="why-title">
          <SectionHeading id="why-title" eyebrow="Why choose us" title="Quality, warranty assistance and support" />
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {why.map((b) => (
              <BlockPanel key={b.key} block={b} image={blockImages[b.key]?.[0]} />
            ))}
          </div>
        </Section>
      )}

      {extra.length > 0 && (
        <Section labelledBy="more-title">
          <h2 id="more-title" className="sr-only">
            More about us
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            {extra.map((b) => (
              <BlockPanel key={b.key} block={b} image={blockImages[b.key]?.[0]} />
            ))}
          </div>
        </Section>
      )}

      <Section labelledBy="warranty-title">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <SectionHeading id="warranty-title" eyebrow="Warranty" title="Warranty information" />
            <p className="mt-4 text-steel-700">{settings.general_warranty || "Warranty terms to be confirmed."}</p>
          </div>
          <div>
            <h2 className="mb-4 text-xl font-bold text-steel-950">Where to find us</h2>
            <Addresses settings={settings} />
            <ButtonLink href={quoteHref} className="mt-6">
              Request a Quote
            </ButtonLink>
          </div>
        </div>
      </Section>
    </>
  );
}

function BlockPanel({ block, image }: { block: ContentBlock; image?: MediaAsset }) {
  return (
    <section aria-labelledby={`b-${block.key}`} className="overflow-hidden rounded-[var(--radius-panel)] border border-steel-200 bg-white p-6">
      {image && (
        <div className="-mx-6 -mt-6 mb-5 aspect-[16/9] bg-steel-100">
          <MediaImage asset={image} sizes="(min-width: 768px) 560px, 100vw" />
        </div>
      )}
      {block.subtitle && block.section === "why" && <p className="text-xs font-semibold tracking-wide text-gold-800 uppercase">{block.subtitle}</p>}
      <h3 id={`b-${block.key}`} className="mt-1 flex flex-wrap items-center gap-2 text-xl font-bold text-steel-950">
        {block.title} <ClaimMarker block={block} />
      </h3>
      <Paragraphs text={block.body} className="mt-2 text-steel-700" />
    </section>
  );
}
