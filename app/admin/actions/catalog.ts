"use server";

import { redirect } from "next/navigation";
import { updateTag } from "next/cache";
import { requireStaffAction } from "@/lib/admin/auth";
import { FormParser, dbErrorMessage, type AdminFormState } from "@/lib/admin/form";
import { CONTENT_TAG } from "@/lib/content/public";
import { UUID_RE, failure, guardedUpdate, invalid, nextSortOrder, readIntent, saved, savedMessage, statusFor } from "./shared";

const PRICING = ["fixed", "starting", "quote"] as const;
const AVAILABILITY = ["available", "on_request", "preorder", "unavailable"] as const;
const PROJECT_TYPES = ["residential", "commercial", "industrial"] as const;

async function finish(
  prev: AdminFormState,
  p: FormParser,
  db: Parameters<typeof guardedUpdate>[0],
  table: string,
  path: string,
  fd: FormData,
  row: Record<string, unknown>,
): Promise<AdminFormState> {
  const id = String(fd.get("id") ?? "");
  const version = String(fd.get("version") ?? "");
  const intent = readIntent(fd);
  const currentStatus = id ? String(fd.get("current_status") ?? "draft") : null;
  const status = statusFor(intent, currentStatus);
  if (status) row.status = status;

  if (!id) {
    const { data, error } = await db.from(table).insert({ ...row, sort_order: await nextSortOrder(db, table) }).select("id").single();
    if (error) {
      const e = dbErrorMessage(error);
      return failure(prev, p.values, e.message, e.field ? { [e.field]: e.message } : {});
    }
    updateTag(CONTENT_TAG);
    redirect(`/admin/${path}/${data.id}?notice=${intent === "publish" ? "published" : "created"}`);
  }
  const res = await guardedUpdate(db, table, id, version, row);
  if (!res.ok) return failure(prev, p.values, res.message, res.field ? { [res.field]: res.message } : {});
  updateTag(CONTENT_TAG);
  return saved(prev, { ...p.values, current_status: status ?? currentStatus ?? "draft" }, savedMessage(intent, false), res.version);
}

export async function saveProduct(prev: AdminFormState, fd: FormData): Promise<AdminFormState> {
  const guard = await requireStaffAction();
  const p = new FormParser(fd);
  if (!guard.ok) return failure(prev, p.values, guard.message);

  const name = p.text("name", "Name", { required: true, min: 2, max: 140 });
  const pricingMode = p.choice("pricing_mode", "Pricing mode", PRICING, { required: true });
  let price = p.number("price_php", "Price", { min: 0, max: 100_000_000 });
  if ((pricingMode === "fixed" || pricingMode === "starting") && price === null && !p.errors.price_php) {
    p.errors.price_php = "Enter a price for fixed or starting-price mode, or choose “Request a quotation”.";
  }
  if (pricingMode === "quote") price = null;
  const categoryId = String(fd.get("category_id") ?? "");
  if (!UUID_RE.test(categoryId)) p.errors.category_id = "Choose a category.";

  const row = {
    name,
    slug: p.slug("slug", name),
    sku: p.sku("sku"),
    brand: p.text("brand", "Brand", { max: 60 }),
    model: p.text("model", "Model", { max: 80 }),
    category_id: categoryId,
    summary: p.body("summary", "Summary", 300),
    description: p.body("description", "Description", 6000),
    specs: p.specs("specs"),
    pricing_mode: pricingMode,
    price_php: price,
    price_basis: p.text("price_basis", "Price basis", { max: 200 }),
    price_is_sample: p.bool("price_is_sample"),
    availability: p.choice("availability", "Availability", AVAILABILITY, { required: true }),
    warranty_terms: p.text("warranty_terms", "Warranty terms", { max: 2000 }),
    admin_notes: p.text("admin_notes", "Internal notes", { max: 2000 }),
    featured: p.bool("featured"),
    is_sample: p.bool("is_sample"),
  };
  if (!p.ok) return invalid(prev, p);
  return finish(prev, p, guard.db, "products", "products", fd, row);
}

export async function saveProject(prev: AdminFormState, fd: FormData): Promise<AdminFormState> {
  const guard = await requireStaffAction();
  const p = new FormParser(fd);
  if (!guard.ok) return failure(prev, p.values, guard.message);

  const title = p.text("title", "Title", { required: true, min: 2, max: 140 });
  const size = p.number("system_size_kwp", "System size", { max: 100000, positive: true });
  const sizeConfirmed = p.bool("system_size_confirmed");
  if (sizeConfirmed && size === null && !p.errors.system_size_kwp) p.errors.system_size_kwp = "Enter the confirmed system size, or untick “confirmed”.";

  const row = {
    title,
    slug: p.slug("slug", title),
    location: p.text("location", "Location", { max: 120 }),
    project_type: p.choice("project_type", "Project type", PROJECT_TYPES, { required: true }),
    system_size_kwp: size,
    system_size_confirmed: sizeConfirmed,
    scope: p.text("scope", "Scope", { max: 600 }),
    summary: p.body("summary", "Summary", 300),
    description: p.body("description", "Description", 6000),
    admin_notes: p.text("admin_notes", "Internal notes", { max: 2000 }),
    featured: p.bool("featured"),
    is_sample: p.bool("is_sample"),
  };
  if (!p.ok) return invalid(prev, p);
  return finish(prev, p, guard.db, "projects", "projects", fd, row);
}

export async function saveCategory(prev: AdminFormState, fd: FormData): Promise<AdminFormState> {
  const guard = await requireStaffAction();
  const p = new FormParser(fd);
  if (!guard.ok) return failure(prev, p.values, guard.message);
  const name = p.text("name", "Name", { required: true, max: 80 });
  const row = {
    name,
    slug: p.slug("slug", name),
    description: p.text("description", "Description", { max: 400 }),
  };
  if (!p.ok) return invalid(prev, p);
  return finish(prev, p, guard.db, "product_categories", "categories", fd, row);
}
