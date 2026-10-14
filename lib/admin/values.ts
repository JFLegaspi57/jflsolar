import type { ContentBlock, Package, Product, Project, SiteSettings } from "../types";

const s = (v: unknown) => (v === null || v === undefined ? "" : String(v));
const b = (v: boolean | null | undefined) => (v ? "on" : "");

export function packageValues(p?: Package): Record<string, string> {
  if (!p) return { package_type: "installed_system", pricing_mode: "quote", fulfillment: "to_be_confirmed", system_type: "" };
  return {
    name: p.name,
    slug: p.slug,
    sku: s(p.sku),
    summary: p.summary,
    description: p.description,
    package_type: p.package_type,
    system_type: s(p.system_type),
    inverter_kw: s(p.inverter_kw),
    array_kwp: s(p.array_kwp),
    battery_kwh: s(p.battery_kwh),
    components: p.components.map((c) => [c.label, c.detail, c.quantity].filter(Boolean).join(" | ")).join("\n"),
    inclusions: p.inclusions.join("\n"),
    exclusions: p.exclusions.join("\n"),
    pricing_mode: p.pricing_mode,
    price_php: s(p.price_php),
    price_basis: s(p.price_basis),
    price_is_sample: b(p.price_is_sample),
    installation_terms: s(p.installation_terms),
    fulfillment: p.fulfillment,
    fulfillment_notes: s(p.fulfillment_notes),
    promo_label: s(p.promo_label),
    promo_start: s(p.promo_start),
    promo_end: s(p.promo_end),
    hide_when_expired: b(p.hide_when_expired),
    warranty_terms: s(p.warranty_terms),
    admin_notes: s(p.admin_notes),
    featured: b(p.featured),
    is_sample: b(p.is_sample),
  };
}

export function productValues(p?: Product): Record<string, string> {
  if (!p) return { pricing_mode: "quote", availability: "on_request" };
  return {
    name: p.name,
    slug: p.slug,
    sku: s(p.sku),
    brand: s(p.brand),
    model: s(p.model),
    category_id: p.category_id,
    summary: p.summary,
    description: p.description,
    specs: p.specs.map((x) => `${x.label}: ${x.value}`).join("\n"),
    pricing_mode: p.pricing_mode,
    price_php: s(p.price_php),
    price_basis: s(p.price_basis),
    price_is_sample: b(p.price_is_sample),
    availability: p.availability,
    warranty_terms: s(p.warranty_terms),
    admin_notes: s(p.admin_notes),
    featured: b(p.featured),
    is_sample: b(p.is_sample),
  };
}

export function projectValues(p?: Project): Record<string, string> {
  if (!p) return { project_type: "residential" };
  return {
    title: p.title,
    slug: p.slug,
    location: s(p.location),
    project_type: p.project_type,
    system_size_kwp: s(p.system_size_kwp),
    system_size_confirmed: b(p.system_size_confirmed),
    scope: s(p.scope),
    summary: p.summary,
    description: p.description,
    admin_notes: s(p.admin_notes),
    featured: b(p.featured),
    is_sample: b(p.is_sample),
  };
}

export function blockValues(x?: ContentBlock): Record<string, string> {
  if (!x) return { section: "about", published: "on", sort_order: "100" };
  return {
    key: x.key,
    original_key: x.key,
    section: x.section,
    title: x.title,
    subtitle: s(x.subtitle),
    body: x.body,
    confirmed: b(x.claim_status === "confirmed"),
    review_note: s(x.review_note),
    published: b(x.published),
    sort_order: s(x.sort_order),
  };
}

export function settingsValues(x: SiteSettings): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(x)) out[k] = typeof v === "boolean" ? b(v) : s(v);
  return out;
}
