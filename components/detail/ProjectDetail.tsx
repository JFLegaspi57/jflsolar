import { projectTypeLabel } from "@/lib/labels";
import { isProductionSite } from "@/lib/env";
import { formatCapacity } from "@/lib/pricing";
import { quoteHref } from "@/lib/site";
import { ButtonLink } from "@/components/ui/Button";
import { MediaImage, PlaceholderImage } from "@/components/ui/Media";
import { Container } from "@/components/ui/Section";
import { Breadcrumbs } from "@/components/catalog/Breadcrumbs";
import { Paragraphs } from "@/components/content/Blocks";
import type { PublicProject } from "@/lib/types";

export function ProjectDetail({ project, mediaScope = "public" }: { project: PublicProject; mediaScope?: "public" | "admin" }) {

  const size = project.system_size_confirmed ? formatCapacity(project.system_size_kwp, "kWp") : null;
  const others = project.photos.filter((p) => p.id !== project.cover?.id);

  return (
    <article aria-labelledby="project-title">
      <Container className="py-8 sm:py-10">
        <Breadcrumbs items={[{ href: "/", label: "Home" }, { href: "/projects", label: "Projects" }, { label: project.title }]} />
        {project.is_sample && !isProductionSite && (
          <p role="note" className="mt-6 rounded-[var(--radius-control)] border border-dashed border-steel-400 bg-steel-50 px-4 py-3 text-steel-800">
            <strong>Sample project.</strong> This entry is not a completed JFL Solar installation. It demonstrates how projects will be presented.
          </p>
        )}
        <h1 id="project-title" className="mt-6 max-w-3xl text-3xl font-extrabold text-steel-950 sm:text-4xl">
          {project.title}
        </h1>
        <dl className="mt-5 grid max-w-3xl grid-cols-2 gap-4 border-y border-steel-200 py-4 sm:grid-cols-4">
          <Fact label="Type" value={projectTypeLabel[project.project_type]} />
          <Fact label="Location" value={project.location ?? "—"} />
          <Fact label="System size" value={size ?? "To be confirmed"} />
          <Fact label="Scope" value={project.scope ?? "—"} wide />
        </dl>

        <figure className="mt-8 overflow-hidden rounded-[var(--radius-panel)] border border-steel-200">
          <div className="aspect-[16/9] bg-steel-100">
            {project.cover ? (
              <MediaImage scope={mediaScope} asset={project.cover} sizes="(min-width: 1216px) 1152px, 100vw" priority />
            ) : (
              <PlaceholderImage label={project.is_sample ? "Sample — placeholder image" : "Project photo pending"} />
            )}
          </div>
          {project.cover?.caption && <figcaption className="px-4 py-2 text-sm text-steel-600">{project.cover.caption}</figcaption>}
        </figure>

        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_20rem]">
          <Paragraphs text={project.description || project.summary} className="max-w-2xl text-lg text-steel-700" />
          <aside className="rounded-[var(--radius-panel)] bg-steel-50 p-6">
            <h2 className="text-lg font-bold text-steel-950">Planning something similar?</h2>
            <p className="mt-2 text-steel-600">Tell us about your site and we will recommend a system.</p>
            <ButtonLink href={quoteHref} className="mt-4 w-full">
              Request a Quote
            </ButtonLink>
          </aside>
        </div>

        {others.length > 0 && (
          <section aria-labelledby="gallery-title" className="mt-12">
            <h2 id="gallery-title" className="text-xl font-bold text-steel-950">
              Photos
            </h2>
            <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {others.map((photo) => (
                <li key={photo.id}>
                  <figure className="overflow-hidden rounded-[var(--radius-panel)] border border-steel-200">
                    <div className="aspect-[4/3] bg-steel-100">
                      <MediaImage scope={mediaScope} asset={photo} sizes="(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw" />
                    </div>
                    {photo.caption && <figcaption className="px-3 py-2 text-sm text-steel-600">{photo.caption}</figcaption>}
                  </figure>
                </li>
              ))}
            </ul>
          </section>
        )}
      </Container>
    </article>
  );
}

function Fact({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={wide ? "col-span-2 sm:col-span-1" : ""}>
      <dt className="text-xs font-semibold tracking-wide text-steel-600 uppercase">{label}</dt>
      <dd className="mt-0.5 font-semibold text-steel-900">{value}</dd>
    </div>
  );
}
