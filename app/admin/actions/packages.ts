"use server";

import { redirect } from "next/navigation";
import { updateTag } from "next/cache";
import { requireStaffAction } from "@/lib/admin/auth";
import { FormParser, dbErrorMessage, type AdminFormState } from "@/lib/admin/form";
import { CONTENT_TAG } from "@/lib/content/public";
import { failure, guardedUpdate, invalid, nextSortOrder, readIntent, saved, savedMessage, statusFor } from "./shared";

const PACKAGE_TYPES = ["installed_system", "equipment_bundle"] as const;
const SYSTEM_TYPES = ["on_grid", "hybrid", "off_grid"] as const;
const PRICING = ["fixed", "starting", "quote"] as const;
const FULFILLMENT = ["installed", "pickup", "delivery", "pickup_or_delivery", "to_be_confirmed"] as const;

export async function savePackage(prev: AdminFormState, fd: FormData): Promise<AdminFormState> {
  const guard = await requireStaffAction();
  const p = new FormParser(fd);
  if (!guard.ok) return failure(prev, p.values, guard.message);

  const id = String(fd.get("id") ?? "");
  const version = String(fd.get("version") ?? "");
  const currentStatus = id ? String(fd.get("current_status") ?? "draft") : null;
  const intent = readIntent(fd);

  const name = p.text("name", "Name", { required: true, min: 2, max: 120 });
  const pricingMode = p.choice("pricing_mode", "Pricing mode", PRICING, { required: true });
  let price = p.number("price_php", "Price", { min: 0, max: 100_000_000 });
  if ((pricingMode === "fixed" || pricingMode === "starting") && price === null && !p.errors.price_php) {
    p.errors.price_php = "Enter a price for fixed or starting-price mode, or choose “Request a quotation”.";
  }
  if (pricingMode === "quote") price = null;
  const promoStart = p.date("promo_start", "Promotion start");
  const promoEnd = p.date("promo_end", "Promotion end");
  if (promoStart && promoEnd && promoEnd < promoStart) p.errors.promo_end = "Promotion end must be on or after the start date.";

  const row = {
    name,
    slug: p.slug("slug", name),
    sku: p.sku("sku"),
    summary: p.body("summary", "Summary", 300),
    description: p.body("description", "Description", 6000),
    package_type: p.choice("package_type", "Package type", PACKAGE_TYPES, { required: true }),
    system_type: p.choice("system_type", "System type", SYSTEM_TYPES),
    inverter_kw: p.number("inverter_kw", "Inverter capacity", { max: 100000, positive: true }),
    array_kwp: p.number("array_kwp", "Array capacity", { max: 100000, positive: true }),
    battery_kwh: p.number("battery_kwh", "Battery capacity", { max: 100000, positive: true }),
    components: p.components("components"),
    inclusions: p.lines("inclusions", "Inclusions", { maxItems: 40, maxLen: 200 }),
    exclusions: p.lines("exclusions", "Exclusions", { maxItems: 40, maxLen: 200 }),
    pricing_mode: pricingMode,
    price_php: price,
    price_basis: p.text("price_basis", "Price basis", { max: 200 }),
    price_is_sample: p.bool("price_is_sample"),
    installation_terms: p.text("installation_terms", "Installation terms", { max: 1000 }),
    fulfillment: p.choice("fulfillment", "Pickup/delivery", FULFILLMENT, { required: true }),
    fulfillment_notes: p.text("fulfillment_notes", "Pickup/delivery notes", { max: 600 }),
    promo_label: p.text("promo_label", "Promotion label", { max: 80 }),
    promo_start: promoStart,
    promo_end: promoEnd,
    hide_when_expired: p.bool("hide_when_expired"),
    warranty_terms: p.text("warranty_terms", "Warranty terms", { max: 2000 }),
    admin_notes: p.text("admin_notes", "Internal notes", { max: 2000 }),
    featured: p.bool("featured"),
    is_sample: p.bool("is_sample"),
    ...(statusFor(intent, currentStatus) ? { status: statusFor(intent, currentStatus) } : {}),
  };
  if (!p.ok) return invalid(prev, p);

  if (!id) {
    const { data, error } = await guard.db
      .from("packages")
      .insert({ ...row, sort_order: await nextSortOrder(guard.db, "packages") })
      .select("id")
      .single();
    if (error) {
      const e = dbErrorMessage(error);
      return failure(prev, p.values, e.message, e.field ? { [e.field]: e.message } : {});
    }
    updateTag(CONTENT_TAG);
    redirect(`/admin/packages/${data.id}?notice=${intent === "publish" ? "published" : "created"}`);
  }

  const res = await guardedUpdate(guard.db, "packages", id, version, row);
  if (!res.ok) return failure(prev, p.values, res.message, res.field ? { [res.field]: res.message } : {});
  updateTag(CONTENT_TAG);
  return saved(prev, { ...p.values, current_status: (row.status as string | undefined) ?? currentStatus ?? "draft" }, savedMessage(intent, false), res.version);
}
