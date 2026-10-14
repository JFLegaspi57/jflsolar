"use server";

import { redirect } from "next/navigation";
import { updateTag } from "next/cache";
import { requireStaffAction } from "@/lib/admin/auth";
import { FormParser, dbErrorMessage, slugify, type AdminFormState } from "@/lib/admin/form";
import { CONTENT_TAG } from "@/lib/content/public";
import { failure, invalid, saved } from "./shared";

const SECTIONS = ["about", "why", "home", "services", "legal"] as const;
const KEY_RE = /^[a-z0-9]+([._-][a-z0-9]+)*$/;

export async function saveBlock(prev: AdminFormState, fd: FormData): Promise<AdminFormState> {
  const guard = await requireStaffAction();
  const p = new FormParser(fd);
  if (!guard.ok) return failure(prev, p.values, guard.message);

  const originalKey = String(fd.get("original_key") ?? "");
  const version = String(fd.get("version") ?? "");
  const section = p.choice("section", "Section", SECTIONS, { required: true });
  const title = p.text("title", "Title", { required: true, max: 160 });
  // Existing blocks keep their key (it decides placement); new blocks get one from the title if blank.
  const key = originalKey || p.text("key", "Key", { max: 60 }) || (section && title ? `${section}.${slugify(title).replace(/-/g, "_").slice(0, 40)}` : null);
  if (key && !KEY_RE.test(key)) p.errors.key = "Use lowercase letters and numbers, separated by dots or hyphens (e.g. about.team).";
  const row = {
    key,
    section,
    title,
    subtitle: p.text("subtitle", "Subtitle", { max: 200 }),
    body: p.body("body", "Text", 6000),
    claim_status: p.bool("confirmed") ? "confirmed" : "needs_confirmation",
    review_note: p.text("review_note", "Review note", { max: 1000 }),
    published: p.bool("published"),
    sort_order: p.number("sort_order", "Order", { min: -100000, max: 100000 }) ?? 0,
  };
  if (!p.ok) return invalid(prev, p);

  if (!originalKey) {
    const { error } = await guard.db.from("content_blocks").insert(row);
    if (error) return failure(prev, p.values, error.code === "23505" ? "A block with this key already exists." : dbErrorMessage(error).message);
    updateTag(CONTENT_TAG);
    redirect(`/admin/content/${encodeURIComponent(row.key!)}?notice=created`);
  }
  const { data, error } = await guard.db.from("content_blocks").update(row).eq("key", originalKey).eq("updated_at", version).select("updated_at, key");
  if (error) return failure(prev, p.values, error.code === "23505" ? "A block with this key already exists." : dbErrorMessage(error).message);
  if (!data?.length) return failure(prev, p.values, "Someone else saved this block after you opened it. Reload the page and apply your changes again.");
  updateTag(CONTENT_TAG);
  if (data[0].key !== originalKey) redirect(`/admin/content/${encodeURIComponent(data[0].key)}?notice=saved`);
  return saved(prev, { ...p.values, original_key: data[0].key }, "Saved.", data[0].updated_at);
}

const E164 = /^\+[1-9][0-9]{7,14}$/;

export async function saveSettings(prev: AdminFormState, fd: FormData): Promise<AdminFormState> {
  const guard = await requireStaffAction();
  const p = new FormParser(fd);
  if (!guard.ok) return failure(prev, p.values, guard.message);

  const e164 = (name: string, label: string, required = false) => {
    const v = p.text(name, label, { max: 16, required });
    if (v && !E164.test(v)) p.errors[name] = `${label}: use international format, e.g. +639171234567.`;
    return v;
  };
  const url = (name: string, label: string, re: RegExp, example: string) => {
    const v = p.text(name, label, { max: 300 });
    if (v && !re.test(v)) p.errors[name] = `${label}: enter a full link such as ${example}.`;
    return v;
  };

  const row = {
    phone_display: p.text("phone_display", "Phone (as displayed)", { required: true, max: 40 }),
    phone_e164: e164("phone_e164", "Phone (international)", true),
    messaging_display: p.text("messaging_display", "Messaging number (as displayed)", { max: 40 }),
    whatsapp_e164: e164("whatsapp_e164", "WhatsApp number"),
    whatsapp_enabled: p.bool("whatsapp_enabled"),
    viber_e164: e164("viber_e164", "Viber number"),
    viber_enabled: p.bool("viber_enabled"),
    facebook_url: url("facebook_url", "Facebook page", /^https:\/\/(www\.|m\.)?facebook\.com\/[A-Za-z0-9._/-]+$/, "https://www.facebook.com/yourpage"),
    facebook_enabled: p.bool("facebook_enabled"),
    messenger_url: url("messenger_url", "Messenger link", /^https:\/\/(m\.me|www\.messenger\.com)\/[A-Za-z0-9._/-]+$/, "https://m.me/yourpage"),
    messenger_enabled: p.bool("messenger_enabled"),
    public_email: p.text("public_email", "Public email", { max: 254 }),
    office_address: p.text("office_address", "Office address", { required: true, max: 300 }),
    warehouse_address: p.text("warehouse_address", "Warehouse address", { max: 300 }),
    service_area: p.text("service_area", "Service area", { required: true, max: 300 }),
    service_area_note: p.text("service_area_note", "Service area note", { max: 1000 }),
    business_hours: p.text("business_hours", "Business hours", { max: 300 }),
    general_warranty: p.text("general_warranty", "General warranty information", { max: 4000 }),
  };
  if (row.public_email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(row.public_email)) p.errors.public_email = "Enter a valid email address.";
  for (const [flag, field, label] of [
    ["whatsapp_enabled", "whatsapp_e164", "WhatsApp number"],
    ["viber_enabled", "viber_e164", "Viber number"],
    ["facebook_enabled", "facebook_url", "Facebook link"],
    ["messenger_enabled", "messenger_url", "Messenger link"],
  ] as const) {
    if (row[flag] && !row[field] && !p.errors[field]) p.errors[field] = `Enter the ${label} before turning this button on.`;
  }
  if (!p.ok) return invalid(prev, p);

  const version = String(fd.get("version") ?? "");
  const { data, error } = await guard.db.from("site_settings").update(row).eq("id", 1).eq("updated_at", version).select("updated_at");
  if (error) return failure(prev, p.values, dbErrorMessage(error).message);
  if (!data?.length) return failure(prev, p.values, "Settings were changed by someone else after you opened this page. Reload and try again.");
  updateTag(CONTENT_TAG);
  return saved(prev, p.values, "Settings saved. The public site is updated.", data[0].updated_at);
}

// ---------------------------------------------------------------------------
// Staff (owners only — also enforced by RLS and the last-owner trigger)
// ---------------------------------------------------------------------------
export async function addStaff(prev: AdminFormState, fd: FormData): Promise<AdminFormState> {
  const guard = await requireStaffAction({ owner: true });
  const p = new FormParser(fd);
  if (!guard.ok) return failure(prev, p.values, guard.message);
  const email = (p.text("email", "Email", { required: true, max: 254 }) ?? "").toLowerCase();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) p.errors.email = "Enter a valid email address.";
  const role = p.choice("role", "Role", ["owner", "editor"] as const, { required: true });
  const displayName = p.text("display_name", "Name", { max: 120 });
  if (!p.ok) return invalid(prev, p);
  const { error } = await guard.db.from("staff_members").insert({ email, role, display_name: displayName, created_by: guard.staff.userId });
  if (error) return failure(prev, p.values, error.code === "23505" ? "This email is already on the staff list." : dbErrorMessage(error).message);
  return { status: "saved", message: `${email} added as ${role}. They can now sign in with Google using this address.`, errors: {}, values: null, attempt: prev.attempt + 1 };
}

export async function updateStaff(staffId: string, change: { role?: "owner" | "editor"; active?: boolean; remove?: boolean }) {
  const guard = await requireStaffAction({ owner: true });
  if (!guard.ok) redirect("/admin/staff?error=auth");
  if (!/^[0-9a-f-]{36}$/.test(staffId)) redirect("/admin/staff?error=invalid");
  const q = change.remove
    ? guard.db.from("staff_members").delete().eq("id", staffId).select("id")
    : guard.db
        .from("staff_members")
        .update({ ...(change.role ? { role: change.role } : {}), ...(change.active !== undefined ? { active: change.active } : {}) })
        .eq("id", staffId)
        .select("id");
  const { data, error } = await q;
  if (error) redirect(`/admin/staff?error=${error.code === "P0001" ? "last_owner" : "save_failed"}`);
  if (!data?.length) redirect("/admin/staff?error=save_failed");
  redirect("/admin/staff?notice=staff_updated");
}

export async function deleteBlock(key: string) {
  const guard = await requireStaffAction();
  if (!guard.ok) redirect("/admin/content?error=auth");
  if (!KEY_RE.test(key)) redirect("/admin/content?error=invalid");
  const { data: media } = await guard.db.from("media_assets").select("storage_key, widths").eq("content_block_key", key);
  const files = (media ?? []).flatMap((m) => (m.widths as number[]).map((w) => `${m.storage_key}/${w}.webp`));
  // Delete the row first (media rows cascade); only then remove the files.
  const { data: deleted, error } = await guard.db.from("content_blocks").delete().eq("key", key).select("key");
  if (error || !deleted?.length) redirect("/admin/content?error=save_failed");
  if (files.length) {
    const { error: se } = await guard.db.storage.from("media").remove(files);
    if (se) console.error("[admin] block image files not removed:", key, se.message);
  }
  updateTag(CONTENT_TAG);
  redirect("/admin/content?notice=deleted");
}
