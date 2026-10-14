import { Suspense } from "react";
import { notFound } from "next/navigation";
import { requireStaffPage } from "@/lib/admin/auth";
import { projectValues } from "@/lib/admin/values";
import type { MediaAsset, Project } from "@/lib/types";
import { EditHeader } from "@/components/admin/EditHeader";
import { ImageManager } from "@/components/admin/ImageManager";
import { Notice } from "@/components/admin/Notice";
import { PageTitle } from "@/components/admin/PageTitle";
import { ProjectForm } from "@/components/admin/forms/CatalogForms";
import { ProjectCard } from "@/components/catalog/ProjectCard";

export const metadata = { title: "Edit project" };

export default function EditProject({ params, searchParams }: PageProps<"/admin/projects/[id]">) {
  return (
    <>
      <Suspense fallback={null}>
        <Notice searchParams={searchParams} />
      </Suspense>
      <Suspense fallback={<p role="status">Loading…</p>}>
        <Editor params={params} />
      </Suspense>
    </>
  );
}

async function Editor({ params }: Pick<PageProps<"/admin/projects/[id]">, "params">) {
  const { id } = await params;
  const { db } = await requireStaffPage();
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const [{ data }, { data: media }] = await Promise.all([
    db.from("projects").select("*").eq("id", id).maybeSingle(),
    db.from("media_assets").select("*").eq("project_id", id).order("sort_order"),
  ]);
  if (!data) notFound();
  const project = data as Project;
  const photos = ((media ?? []) as MediaAsset[]).filter((m) => m.kind === "image");

  return (
    <>
      <PageTitle title={project.title} back={{ href: "/admin/projects", label: "All projects" }} />
      <EditHeader previewHref={`/admin/preview/projects/${project.id}`} entity="projects" id={project.id} name={project.title} status={project.status} isSample={project.is_sample} publicHref={`/projects/${project.slug}`}>
        {project.is_sample && (
          <p className="mt-3 text-sm text-steel-700">
            This is a <strong>sample</strong> project for the proposal. Replace the text and photos with an approved JFL Solar project, then untick “Sample”.
          </p>
        )}
      </EditHeader>
      <ProjectForm values={projectValues(project)} id={project.id} version={project.updated_at} status={project.status} />
      <div className="mb-28 space-y-8">
      <details className="rounded-[var(--radius-panel)] border border-steel-200 bg-white p-4">
        <summary className="inline-flex min-h-11 cursor-pointer items-center font-semibold text-steel-900">Preview card (as saved)</summary>
        <div className="mt-3 max-w-sm">
          <ProjectCard mediaScope="admin" project={{ ...project, photos, cover: photos.find((p) => p.is_cover) ?? photos[0] ?? null }} />
        </div>
      </details>
      <div>
        <ImageManager owner={{ kind: "project", id: project.id }} images={photos} title="Project photos" coverLabel="cover photo" />
      </div>
      </div>
    </>
  );
}
