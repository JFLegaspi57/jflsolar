"use server";

import { redirect } from "next/navigation";
import { updateTag } from "next/cache";
import { requireStaffAction } from "@/lib/admin/auth";
import { CONTENT_TAG } from "@/lib/content/public";
import { MEDIA_BUCKET } from "@/lib/media";
import { UUID_RE } from "./shared";

const ENTITIES = {
  packages: { table: "packages", media: "package_id", featured: true },
  products: { table: "products", media: "product_id", featured: true },
  projects: { table: "projects", media: "project_id", featured: true },
  categories: { table: "product_categories", media: null, featured: false },
} as const;

export type Entity = keyof typeof ENTITIES;
type Status = "draft" | "published" | "archived";

function back(entity: Entity, params: Record<string, string>, id?: string): never {
  const qs = new URLSearchParams(params).toString();
  redirect(`/admin/${entity}${id ? `/${id}` : ""}?${qs}`);
}

function check(entity: string, id: string): entity is Entity {
  return entity in ENTITIES && UUID_RE.test(id);
}

/** Publish / unpublish / archive / restore. `returnTo` = "list" | "edit". */
export async function setStatus(entity: Entity, id: string, status: Status, returnTo: "list" | "edit") {
  if (!check(entity, id) || !["draft", "published", "archived"].includes(status)) back("packages" as Entity, { error: "invalid" });
  const guard = await requireStaffAction();
  const target = returnTo === "edit" ? id : undefined;
  if (!guard.ok) back(entity, { error: "auth" }, target);
  const { data, error } = await guard.db.from(ENTITIES[entity].table).update({ status }).eq("id", id).select("id");
  if (error || !data?.length) back(entity, { error: error?.code === "23503" ? "in_use" : "save_failed" }, target);
  updateTag(CONTENT_TAG);
  back(entity, { notice: status }, target);
}

export async function toggleFeatured(entity: Entity, id: string, featured: boolean) {
  if (!check(entity, id) || !ENTITIES[entity].featured) back("packages", { error: "invalid" });
  const guard = await requireStaffAction();
  if (!guard.ok) back(entity, { error: "auth" });
  const { error } = await guard.db.from(ENTITIES[entity].table).update({ featured }).eq("id", id);
  if (error) back(entity, { error: "save_failed" });
  updateTag(CONTENT_TAG);
  back(entity, { notice: featured ? "featured" : "unfeatured" });
}

/** Move one position up/down among non-archived rows (single transaction in Postgres). */
export async function moveRecord(entity: Entity, id: string, direction: "up" | "down") {
  if (!check(entity, id)) back("packages", { error: "invalid" });
  const guard = await requireStaffAction();
  if (!guard.ok) back(entity, { error: "auth" });
  const { error } = await guard.db.rpc("record_move", { p_table: ENTITIES[entity].table, p_id: id, p_direction: direction === "up" ? -1 : 1 });
  if (error) back(entity, { error: "save_failed" });
  updateTag(CONTENT_TAG);
  back(entity, { notice: "reordered" });
}

/**
 * Permanent deletion — only for archived records (two-step: archive, then
 * delete after confirming). Removes stored media files first.
 */
export async function deleteRecord(entity: Entity, id: string) {
  if (!check(entity, id)) back("packages", { error: "invalid" });
  const guard = await requireStaffAction();
  if (!guard.ok) back(entity, { error: "auth" });
  const cfg = ENTITIES[entity];

  // Collect stored files first; media rows are removed by ON DELETE CASCADE.
  const files: string[] = [];
  if (cfg.media) {
    const { data: media } = await guard.db.from("media_assets").select("storage_key, widths, kind").eq(cfg.media, id);
    for (const m of media ?? []) {
      if (m.kind === "datasheet") files.push(`${m.storage_key}/datasheet.pdf`);
      else for (const w of m.widths as number[]) files.push(`${m.storage_key}/${w}.webp`);
    }
  }

  // Atomic: only deletes if the row is STILL archived at this moment.
  const { data: deleted, error } = await guard.db.from(cfg.table).delete().eq("id", id).eq("status", "archived").select("id");
  if (error) back(entity, { error: error.code === "23503" ? "in_use" : "save_failed" }, id);
  if (!deleted?.length) back(entity, { error: "not_archived" }, id);

  if (files.length) {
    const { error: storageError } = await guard.db.storage.from(MEDIA_BUCKET).remove(files);
    // The record is gone; leftover files are unreachable (no media row) — log for cleanup.
    if (storageError) console.error("[admin] media cleanup failed after delete:", entity, id, storageError.message);
  }
  updateTag(CONTENT_TAG);
  back(entity, { notice: "deleted" });
}
