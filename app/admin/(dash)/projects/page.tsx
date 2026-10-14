import { Suspense } from "react";
import { requireStaffPage } from "@/lib/admin/auth";
import { projectTypeLabel } from "@/lib/labels";
import type { Project } from "@/lib/types";
import { Notice } from "@/components/admin/Notice";
import { NewButton, PageTitle } from "@/components/admin/PageTitle";
import { RecordList } from "@/components/admin/RecordList";

export const metadata = { title: "Projects" };

export default function ProjectsAdmin({ searchParams }: PageProps<"/admin/projects">) {
  return (
    <>
      <PageTitle
        title="Projects"
        intro="Project gallery. Only publish real JFL Solar projects with approved photos. Sample projects are hidden on the production site."
        action={<NewButton href="/admin/projects/new">New project</NewButton>}
      />
      <Suspense fallback={null}>
        <Notice searchParams={searchParams} />
      </Suspense>
      <Suspense fallback={<p role="status">Loading projects…</p>}>
        <List searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function List({ searchParams }: Pick<PageProps<"/admin/projects">, "searchParams">) {
  const archived = (await searchParams).view === "archived";
  const { db } = await requireStaffPage();
  const q = db.from("projects").select("*").order("sort_order").order("created_at");
  const { data, error } = await (archived ? q.eq("status", "archived") : q.neq("status", "archived"));
  if (error) return <p role="alert">Could not load projects.</p>;
  const { data: media } = await db.from("media_assets").select("project_id").not("project_id", "is", null);
  const photoCount = (id: string) => (media ?? []).filter((m) => m.project_id === id).length;
  const rows = ((data ?? []) as Project[]).map((p) => ({
    id: p.id,
    name: p.title,
    status: p.status,
    isSample: p.is_sample,
    featured: p.featured,
    subtitle: [projectTypeLabel[p.project_type], p.location, `${photoCount(p.id)} photo(s)`].filter(Boolean).join(" · "),
  }));
  return <RecordList entity="projects" rows={rows} archived={archived} emptyText="No projects yet." />;
}
