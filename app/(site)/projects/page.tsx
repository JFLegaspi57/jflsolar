import Link from "next/link";
import { getPublicSnapshot } from "@/lib/content/public";
import { isProductionSite } from "@/lib/env";
import { pageMetadata } from "@/lib/seo";
import { Container, PageHeader } from "@/components/ui/Section";
import { ProjectCard } from "@/components/catalog/ProjectCard";

export const metadata = pageMetadata({
  title: "Projects",
  description: "Solar PV projects by JFL Solar for residential, commercial and industrial clients.",
  path: "/projects",
});

export default async function ProjectsPage() {
  const { projects } = await getPublicSnapshot();
  const hasSamples = projects.some((p) => p.is_sample);
  return (
    <>
      <PageHeader eyebrow="Projects" title="Project gallery" intro="Residential, commercial and industrial solar work." />
      <Container className="py-10 sm:py-14">
        {hasSamples && !isProductionSite && (
          <p role="note" className="mb-8 rounded-[var(--radius-control)] border border-dashed border-steel-400 bg-steel-50 px-4 py-3 text-steel-800">
            <strong>Sample projects.</strong> The entries below demonstrate the gallery layout during the proposal stage. They are not completed JFL Solar
            installations and will be replaced with approved projects before launch.
          </p>
        )}
        {projects.length ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => (
              <ProjectCard key={p.id} project={p} headingLevel="h2" />
            ))}
          </div>
        ) : (
          <div className="rounded-[var(--radius-panel)] border border-dashed border-steel-300 p-10 text-center">
            <p className="text-lg font-semibold text-steel-900">Project photos are on the way.</p>
            <p className="mt-2 text-steel-600">
              Ask us about our work — <Link href="/contact" className="font-semibold underline">get in touch</Link>.
            </p>
          </div>
        )}
      </Container>
    </>
  );
}
