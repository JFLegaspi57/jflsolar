import Link from "next/link";
import { projectTypeLabel } from "@/lib/labels";
import { formatCapacity } from "@/lib/pricing";
import { isProductionSite } from "@/lib/env";
import type { PublicProject } from "@/lib/types";
import { SampleBadge } from "@/components/ui/Badge";
import { MediaImage, PlaceholderImage } from "@/components/ui/Media";

export function ProjectCard({ project, headingLevel = "h3", mediaScope = "public" }: { project: PublicProject; headingLevel?: "h2" | "h3"; mediaScope?: "public" | "admin" }) {
  const H = headingLevel;
  const size = project.system_size_confirmed ? formatCapacity(project.system_size_kwp, "kWp") : null;
  return (
    <article className="group relative overflow-hidden rounded-[var(--radius-panel)] border border-steel-200 bg-white">
      <div className="aspect-[3/2] overflow-hidden bg-steel-100">
        {project.cover ? (
          <MediaImage scope={mediaScope} asset={project.cover} sizes="(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw" className="transition-transform duration-300 group-hover:scale-[1.02]" />
        ) : (
          <PlaceholderImage label={project.is_sample ? "Sample — placeholder image" : "Project photo pending"} />
        )}
      </div>
      <div className="p-5">
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold tracking-wide text-steel-600 uppercase">
          <span>{projectTypeLabel[project.project_type]}</span>
          {project.location && <span aria-hidden="true">·</span>}
          {project.location && <span className="normal-case tracking-normal">{project.location}</span>}
          {size && <span aria-hidden="true">·</span>}
          {size && <span className="tabular">{size}</span>}
        </div>
        <H className="mt-2 text-lg font-bold text-steel-950">
          <Link href={`/projects/${project.slug}`} className="after:absolute after:inset-0 hover:underline">
            {project.title}
          </Link>
        </H>
        <p className="mt-1.5 text-[0.95rem] text-steel-600">{project.summary}</p>
        {project.is_sample && !isProductionSite && (
          <div className="mt-3">
            <SampleBadge label="Sample — not a JFL installation" />
          </div>
        )}
      </div>
    </article>
  );
}
