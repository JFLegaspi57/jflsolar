import { notFound } from "next/navigation";
import { getProjectBySlug, getPublicSnapshot, slugParams } from "@/lib/content/public";
import { pageMetadata } from "@/lib/seo";
import { ProjectDetail } from "@/components/detail/ProjectDetail";

// The whole page comes from cached content, so require complete static output:
// an unlisted slug waits for the full render instead of an App Shell, letting
// notFound() return a real HTTP 404 rather than a 200 soft-404.
export const ensureStatic = "navigation";

export async function generateStaticParams() {
  return slugParams((await getPublicSnapshot()).projects);
}

export async function generateMetadata({ params }: PageProps<"/projects/[slug]">) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) return { title: "Project not found", robots: { index: false } };
  return pageMetadata({ title: project.title, description: project.summary || project.title, path: `/projects/${project.slug}`, noindex: project.is_sample });
}

export default async function ProjectPage({ params }: PageProps<"/projects/[slug]">) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) notFound();
  return <ProjectDetail project={project} />;
}
