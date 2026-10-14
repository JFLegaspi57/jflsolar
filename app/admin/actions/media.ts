"use server";

import { randomUUID } from "node:crypto";
import { updateTag } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireStaffAction } from "@/lib/admin/auth";
import { FormParser, dbErrorMessage, type AdminFormState } from "@/lib/admin/form";
import { processImage, readPdf } from "@/lib/admin/images";
import { CONTENT_TAG } from "@/lib/content/public";
import { MEDIA_BUCKET } from "@/lib/media";
import { UUID_RE, failure } from "./shared";

export type MediaOwner =
  | { kind: "package"; id: string }
  | { kind: "product"; id: string }
  | { kind: "project"; id: string }
  | { kind: "block"; key: string };

const ownerColumn = { package: "package_id", product: "product_id", project: "project_id", block: "content_block_key" } as const;
const ownerFolder = { package: "packages", product: "products", project: "projects", block: "blocks" } as const;

function ownerValid(o: MediaOwner) {
  return o.kind === "block" ? /^[a-z0-9]+([._-][a-z0-9]+)*$/.test(o.key) : UUID_RE.test(o.id);
}
const ownerValue = (o: MediaOwner) => (o.kind === "block" ? o.key : o.id);

function ok(prev: AdminFormState, message: string): AdminFormState {
  return { status: "saved", message, errors: {}, values: null, attempt: prev.attempt + 1 };
}

async function uploadVariants(db: SupabaseClient, key: string, variants: { width: number; data: Buffer }[]) {
  const uploaded: string[] = [];
  for (const v of variants) {
    const path = `${key}/${v.width}.webp`;
    const { error } = await db.storage.from(MEDIA_BUCKET).upload(path, v.data, { contentType: "image/webp", upsert: false, cacheControl: "300" });
    if (error) {
      if (uploaded.length) await db.storage.from(MEDIA_BUCKET).remove(uploaded);
      return { error: "The image could not be stored. Please try again." };
    }
    uploaded.push(path);
  }
  return { paths: uploaded };
}

const filesOf = (m: { storage_key: string; widths: number[]; kind: string }) =>
  m.kind === "datasheet" ? [`${m.storage_key}/datasheet.pdf`] : m.widths.map((w) => `${m.storage_key}/${w}.webp`);

/** Upload a new image for a package/product/project/content block. */
export async function uploadImage(owner: MediaOwner, prev: AdminFormState, fd: FormData): Promise<AdminFormState> {
  const p = new FormParser(fd);
  const guard = await requireStaffAction();
  if (!guard.ok) return failure(prev, p.values, guard.message);
  if (!ownerValid(owner)) return failure(prev, p.values, "Invalid item.");

  const alt = p.text("alt", "Alternative text", { required: true, max: 300, min: 3 });
  const caption = p.text("caption", "Caption", { max: 300 });
  const file = fd.get("file");
  if (!(file instanceof File) || file.size === 0) p.errors.file = "Choose an image to upload.";
  if (!p.ok) return failure(prev, p.values, "Please fix the highlighted fields.", p.errors);

  const img = await processImage(file as File);
  if ("error" in img) return failure(prev, p.values, img.error, { file: img.error });

  const col = ownerColumn[owner.kind];
  const { data: existing } = await guard.db.from("media_assets").select("sort_order, is_cover").eq(col, ownerValue(owner)).eq("kind", "image");
  const assetId = randomUUID();
  const folderId = owner.kind === "block" ? randomUUID() : owner.id;
  const key = `${ownerFolder[owner.kind]}/${folderId}/${assetId}`;

  const up = await uploadVariants(guard.db, key, img.variants);
  if ("error" in up) return failure(prev, p.values, up.error ?? "Upload failed.");

  const { error } = await guard.db.from("media_assets").insert({
    id: assetId,
    kind: "image",
    storage_key: key,
    [col]: ownerValue(owner),
    alt,
    caption,
    file_name: (file as File).name.slice(0, 200),
    widths: img.variants.map((v) => v.width),
    width: img.width,
    height: img.height,
    bytes: img.bytes,
    is_cover: owner.kind !== "block" && !(existing ?? []).some((m) => m.is_cover),
    sort_order: Math.max(0, ...(existing ?? []).map((m) => m.sort_order as number)) + 10,
  });
  if (error) {
    await guard.db.storage.from(MEDIA_BUCKET).remove(up.paths);
    return failure(prev, p.values, dbErrorMessage(error).message);
  }
  updateTag(CONTENT_TAG);
  return ok(prev, "Image uploaded.");
}

/** Replace an image file, keeping its alt text, caption, order and cover flag. */
export async function replaceImage(assetId: string, prev: AdminFormState, fd: FormData): Promise<AdminFormState> {
  const guard = await requireStaffAction();
  if (!guard.ok) return failure(prev, null, guard.message);
  if (!UUID_RE.test(assetId)) return failure(prev, null, "Invalid image.");
  const { data: asset } = await guard.db.from("media_assets").select("storage_key, widths, kind").eq("id", assetId).maybeSingle();
  if (!asset || asset.kind !== "image") return failure(prev, null, "Image not found.");

  const img = await processImage(fd.get("file") as File);
  if ("error" in img) return failure(prev, null, img.error, { file: img.error });

  // New storage key so CDN caches of the old file are not reused.
  const [folder, owner] = (asset.storage_key as string).split("/");
  const key = `${folder}/${owner}/${randomUUID()}`;
  const up = await uploadVariants(guard.db, key, img.variants);
  if ("error" in up) return failure(prev, null, up.error ?? "Upload failed.");

  // Conditional on the key we read: a concurrent replacement makes this a no-op.
  const { data: updated, error } = await guard.db
    .from("media_assets")
    .update({ storage_key: key, widths: img.variants.map((v) => v.width), width: img.width, height: img.height, bytes: img.bytes, file_name: (fd.get("file") as File).name.slice(0, 200) })
    .eq("id", assetId)
    .eq("storage_key", asset.storage_key)
    .select("id");
  if (error || !updated?.length) {
    await guard.db.storage.from(MEDIA_BUCKET).remove(up.paths);
    return failure(prev, null, error ? dbErrorMessage(error).message : "This image was changed by someone else. Reload the page and try again.");
  }
  const { error: cleanupError } = await guard.db.storage.from(MEDIA_BUCKET).remove(filesOf(asset as { storage_key: string; widths: number[]; kind: string }));
  if (cleanupError) console.error("[admin] old image files not removed:", asset.storage_key, cleanupError.message);
  updateTag(CONTENT_TAG);
  return ok(prev, "Image replaced.");
}

export async function updateImageText(assetId: string, prev: AdminFormState, fd: FormData): Promise<AdminFormState> {
  const p = new FormParser(fd);
  const guard = await requireStaffAction();
  if (!guard.ok) return failure(prev, p.values, guard.message);
  if (!UUID_RE.test(assetId)) return failure(prev, p.values, "Invalid image.");
  const alt = p.text("alt", "Alternative text", { required: true, max: 300, min: 3 });
  const caption = p.text("caption", "Caption", { max: 300 });
  if (!p.ok) return failure(prev, p.values, "Please fix the highlighted fields.", p.errors);
  const { error } = await guard.db.from("media_assets").update({ alt, caption }).eq("id", assetId);
  if (error) return failure(prev, p.values, dbErrorMessage(error).message);
  updateTag(CONTENT_TAG);
  return { status: "saved", message: "Text saved.", errors: {}, values: p.values, attempt: prev.attempt + 1 };
}

type ImageOp = "cover" | "up" | "down" | "delete";

/** Cover / reorder / delete. Returns a short result message for the UI. */
export async function imageOperation(assetId: string, op: ImageOp, prev: AdminFormState): Promise<AdminFormState> {
  const guard = await requireStaffAction();
  if (!guard.ok) return failure(prev, null, guard.message);
  if (!UUID_RE.test(assetId)) return failure(prev, null, "Invalid image.");
  const { data: asset } = await guard.db.from("media_assets").select("*").eq("id", assetId).maybeSingle();
  if (!asset) return failure(prev, null, "Image not found.");

  const col = (["package_id", "product_id", "project_id", "content_block_key"] as const).find((c) => asset[c] !== null)!;
  const { data: siblings } = await guard.db.from("media_assets").select("id, sort_order, is_cover").eq(col, asset[col]).eq("kind", "image").order("sort_order");
  const list = siblings ?? [];

  if (op === "cover" || op === "up" || op === "down") {
    const { error } =
      op === "cover"
        ? await guard.db.rpc("media_set_cover", { p_asset: assetId })
        : await guard.db.rpc("media_move", { p_asset: assetId, p_direction: op === "up" ? -1 : 1 });
    if (error) return failure(prev, null, dbErrorMessage(error).message);
    updateTag(CONTENT_TAG);
    return ok(prev, op === "cover" ? "Cover image updated." : "Order updated.");
  }

  // delete: remove the row first (nothing then references the files), then the files.
  const { data: removed, error } = await guard.db.from("media_assets").delete().eq("id", assetId).select("id");
  if (error) return failure(prev, null, dbErrorMessage(error).message);
  if (!removed?.length) return failure(prev, null, "This image was already removed.");
  const { error: storageError } = await guard.db.storage.from(MEDIA_BUCKET).remove(filesOf(asset));
  if (storageError) console.error("[admin] image files not removed:", asset.storage_key, storageError.message);
  if (asset.is_cover) {
    const next = list.find((m) => m.id !== assetId);
    if (next) {
      const { error: coverError } = await guard.db.rpc("media_set_cover", { p_asset: next.id });
      if (coverError) return failure(prev, null, "Image deleted, but a new cover could not be set. Choose one manually.");
    }
  }
  updateTag(CONTENT_TAG);
  return ok(prev, "Image deleted.");
}

/** Upload or replace a product datasheet (PDF). */
export async function uploadDatasheet(productId: string, prev: AdminFormState, fd: FormData): Promise<AdminFormState> {
  const guard = await requireStaffAction();
  if (!guard.ok) return failure(prev, null, guard.message);
  if (!UUID_RE.test(productId)) return failure(prev, null, "Invalid product.");
  const file = fd.get("file") as File;
  const pdf = await readPdf(file);
  if ("error" in pdf) return failure(prev, null, pdf.error, { file: pdf.error });

  const { data: old } = await guard.db.from("media_assets").select("id, storage_key, widths, kind").eq("product_id", productId).eq("kind", "datasheet").maybeSingle();
  const assetId = randomUUID();
  const key = `products/${productId}/${assetId}`;
  const { error: upErr } = await guard.db.storage.from(MEDIA_BUCKET).upload(`${key}/datasheet.pdf`, pdf, { contentType: "application/pdf", upsert: false });
  if (upErr) return failure(prev, null, "The datasheet could not be stored. Please try again.");

  // Replace by updating the existing row (conditional on its current key), so the
  // working datasheet is never lost if the database write fails.
  const { data: written, error } = old
    ? await guard.db
        .from("media_assets")
        .update({ storage_key: key, file_name: file.name.slice(0, 200), bytes: pdf.length })
        .eq("id", old.id)
        .eq("storage_key", old.storage_key)
        .select("id")
    : await guard.db
        .from("media_assets")
        .insert({ id: assetId, kind: "datasheet", storage_key: key, product_id: productId, alt: "", file_name: file.name.slice(0, 200), bytes: pdf.length })
        .select("id");
  if (error || !written?.length) {
    await guard.db.storage.from(MEDIA_BUCKET).remove([`${key}/datasheet.pdf`]);
    return failure(prev, null, error ? dbErrorMessage(error).message : "The datasheet was changed by someone else. Reload and try again.");
  }
  if (old) {
    const { error: cleanupError } = await guard.db.storage.from(MEDIA_BUCKET).remove(filesOf(old));
    if (cleanupError) console.error("[admin] old datasheet not removed:", old.storage_key, cleanupError.message);
  }
  updateTag(CONTENT_TAG);
  return ok(prev, old ? "Datasheet replaced." : "Datasheet uploaded.");
}
