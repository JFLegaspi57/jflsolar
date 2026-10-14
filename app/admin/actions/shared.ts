import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { dbErrorMessage, type AdminFormState, type FormParser } from "@/lib/admin/form";

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export function failure(prev: AdminFormState, values: Record<string, string> | null, message: string, errors: Record<string, string> = {}): AdminFormState {
  return { status: "error", message, errors, values, attempt: prev.attempt + 1, version: undefined };
}

export function invalid(prev: AdminFormState, p: FormParser): AdminFormState {
  return failure(prev, p.values, "Please fix the highlighted fields. Nothing was saved.", p.errors);
}

export function saved(prev: AdminFormState, values: Record<string, string>, message: string, version: string | null): AdminFormState {
  return { status: "saved", message, errors: {}, values: { ...values, version: version ?? "" }, attempt: prev.attempt + 1, version };
}

export type Intent = "save" | "publish" | "unpublish";

export function readIntent(fd: FormData): Intent {
  const v = fd.get("intent");
  return v === "publish" || v === "unpublish" ? v : "save";
}

/**
 * Update with optimistic concurrency: only succeeds if the row still has the
 * `updated_at` the editor loaded. Returns the new version or an error message.
 */
export async function guardedUpdate(
  db: SupabaseClient,
  table: string,
  id: string,
  version: string,
  row: Record<string, unknown>,
): Promise<{ ok: true; version: string } | { ok: false; message: string; field?: string }> {
  if (!UUID_RE.test(id)) return { ok: false, message: "Invalid record id." };
  const { data, error } = await db.from(table).update(row).eq("id", id).eq("updated_at", version).select("updated_at");
  if (error) return { ok: false, ...dbErrorMessage(error) };
  if (!data?.length) {
    const { data: exists } = await db.from(table).select("id").eq("id", id).maybeSingle();
    return exists
      ? { ok: false, message: "Someone else saved this item after you opened it. Copy any changes you need, reload the page, and apply them again." }
      : { ok: false, message: "This item no longer exists." };
  }
  return { ok: true, version: data[0].updated_at as string };
}

export async function nextSortOrder(db: SupabaseClient, table: string) {
  const { data } = await db.from(table).select("sort_order").order("sort_order", { ascending: false }).limit(1);
  return ((data?.[0]?.sort_order as number | undefined) ?? 0) + 10;
}

export function statusFor(intent: Intent, current: string | null): string | undefined {
  if (intent === "publish") return "published";
  if (intent === "unpublish") return "draft";
  return current === null ? "draft" : undefined; // new records start as drafts
}

export function savedMessage(intent: Intent, isNew: boolean) {
  if (intent === "publish") return "Saved and published. The public page is updated.";
  if (intent === "unpublish") return "Saved and unpublished. It is now a draft and hidden from the public site.";
  return isNew ? "Draft created." : "Changes saved.";
}
