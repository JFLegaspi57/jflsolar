import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { isProductionSite, isSupabaseConfigured } from "../env";
import { createPublicClient } from "../supabase/clients";
import { manilaToday, promoState } from "../pricing";
import {
  demoCategories,
  demoContentBlocks,
  demoPackages,
  demoProducts,
  demoProjects,
  demoSettings,
} from "../demo/content";
import type {
  ContentBlock,
  MediaAsset,
  Package,
  Product,
  ProductCategory,
  Project,
  PublicPackage,
  PublicProduct,
  PublicProject,
  SiteSettings,
} from "../types";

export const CONTENT_TAG = "content";

export type DataSource = "database" | "demo";

export interface PublicSnapshot {
  source: DataSource;
  settings: SiteSettings;
  blocks: ContentBlock[];
  categories: ProductCategory[];
  packages: PublicPackage[];
  products: PublicProduct[];
  projects: PublicProject[];
  /** Images attached to visible content blocks, keyed by block key. */
  blockImages: Record<string, MediaAsset[]>;
}

// Column lists match the anonymous column grants in the migration.
const COLS = {
  settings:
    "phone_display, phone_e164, messaging_display, whatsapp_e164, whatsapp_enabled, viber_e164, viber_enabled, facebook_url, facebook_enabled, messenger_url, messenger_enabled, public_email, office_address, warehouse_address, service_area, service_area_note, business_hours, general_warranty, updated_at",
  blocks: "key, section, title, subtitle, body, claim_status, published, sort_order, updated_at",
  categories: "id, slug, name, description, status, sort_order",
  packages:
    "id, slug, sku, name, summary, description, package_type, system_type, inverter_kw, array_kwp, battery_kwh, components, inclusions, exclusions, pricing_mode, price_php, price_basis, price_is_sample, currency, installation_terms, fulfillment, fulfillment_notes, promo_label, promo_start, promo_end, hide_when_expired, warranty_terms, status, featured, sort_order, is_sample, updated_at",
  products:
    "id, slug, sku, name, brand, model, category_id, summary, description, specs, pricing_mode, price_php, price_basis, price_is_sample, currency, availability, warranty_terms, status, featured, sort_order, is_sample, updated_at",
  projects:
    "id, slug, title, location, project_type, system_size_kwp, system_size_confirmed, scope, summary, description, status, featured, sort_order, is_sample, updated_at",
  media:
    "id, kind, storage_key, package_id, product_id, project_id, content_block_key, alt, caption, file_name, widths, width, height, bytes, is_cover, sort_order",
};

const bySort = <T extends { sort_order: number }>(a: T, b: T) => a.sort_order - b.sort_order;

/** Everything the public site may show. Cached; invalidated by admin saves. */
export async function getPublicSnapshot(): Promise<PublicSnapshot> {
  "use cache";
  cacheLife("minutes");
  cacheTag(CONTENT_TAG);

  const raw = isSupabaseConfigured ? await loadFromDatabase() : loadDemo();
  return applyPublicRules(raw, manilaToday());
}

interface RawContent {
  source: DataSource;
  settings: SiteSettings;
  blocks: ContentBlock[];
  categories: ProductCategory[];
  packages: Package[];
  products: Product[];
  projects: Project[];
  media: MediaAsset[];
}

function loadDemo(): RawContent {
  if (isProductionSite) {
    throw new Error(
      "SITE_ENV=production requires Supabase (NEXT_PUBLIC_SUPABASE_URL and a publishable/anon key). Demo content is never served in production.",
    );
  }
  return {
    source: "demo",
    settings: demoSettings,
    blocks: demoContentBlocks.map((b) => ({ ...b, review_note: undefined })),
    categories: demoCategories,
    packages: demoPackages.map((p) => ({ ...p, admin_notes: undefined })),
    products: demoProducts.map((p) => ({ ...p, admin_notes: undefined })),
    projects: demoProjects.map((p) => ({ ...p, admin_notes: undefined })),
    media: [],
  };
}

async function loadFromDatabase(): Promise<RawContent> {
  const db = createPublicClient();
  // Column lists are runtime strings; cast past supabase-js select-string typing.
  const select = (table: string, cols: string) => db.from(table).select(cols as "*");
  const [settings, blocks, categories, packages, products, projects, media] = await Promise.all([
    select("site_settings", COLS.settings).eq("id", 1).maybeSingle(),
    select("content_blocks", COLS.blocks),
    select("product_categories", COLS.categories),
    select("packages", COLS.packages),
    select("products", COLS.products),
    select("projects", COLS.projects),
    select("media_assets", COLS.media),
  ]);
  for (const r of [settings, blocks, categories, packages, products, projects, media]) {
    if (r.error) throw new Error(`Content query failed: ${r.error.message}`);
  }
  if (!settings.data) throw new Error("site_settings row is missing — run supabase/seed.sql or insert settings in the admin.");
  return {
    source: "database",
    settings: settings.data as SiteSettings,
    blocks: (blocks.data ?? []) as ContentBlock[],
    categories: (categories.data ?? []) as ProductCategory[],
    packages: (packages.data ?? []).map(numericPackage),
    products: (products.data ?? []).map(numericPrice) as Product[],
    projects: (projects.data ?? []).map((p) => ({ ...p, system_size_kwp: num(p.system_size_kwp) })) as Project[],
    media: (media.data ?? []) as MediaAsset[],
  };
}

// PostgREST returns numeric columns as numbers or strings depending on size.
const num = (v: unknown) => (v === null || v === undefined ? null : Number(v));
const numericPrice = <T extends { price_php: unknown }>(r: T) => ({ ...r, price_php: num(r.price_php) });
const numericPackage = (r: Record<string, unknown>) =>
  ({ ...numericPrice(r as { price_php: unknown }), inverter_kw: num(r.inverter_kw), array_kwp: num(r.array_kwp), battery_kwh: num(r.battery_kwh) }) as Package;

/**
 * Visibility rules, applied in the app as well as in RLS (defence in depth and
 * the only enforcement in demo mode).
 */
export function applyPublicRules(raw: RawContent, today: string): PublicSnapshot {
  const visible = (r: { status: string; is_sample: boolean }) => r.status === "published" && (!isProductionSite || !r.is_sample);
  const mediaFor = (key: "package_id" | "product_id" | "project_id", id: string) =>
    raw.media.filter((m) => m[key] === id).sort(bySort);

  const categories = raw.categories.filter((c) => c.status === "published").sort(bySort);
  const categoryById = new Map(categories.map((c) => [c.id, c]));

  const packages: PublicPackage[] = raw.packages
    .filter(visible)
    .map((p) => ({ ...p, promo_state: promoState(p, today), images: mediaFor("package_id", p.id).filter((m) => m.kind === "image") }))
    .filter((p) => !(p.promo_state === "ended" && p.hide_when_expired))
    .sort(bySort);

  const products: PublicProduct[] = raw.products
    .filter(visible)
    .filter((p) => categoryById.has(p.category_id))
    .map((p) => {
      const media = mediaFor("product_id", p.id);
      return {
        ...p,
        category: categoryById.get(p.category_id) ?? null,
        images: media.filter((m) => m.kind === "image"),
        datasheet: media.find((m) => m.kind === "datasheet") ?? null,
      };
    })
    .sort(bySort);

  const projects: PublicProject[] = raw.projects
    .filter(visible)
    .map((p) => {
      const photos = mediaFor("project_id", p.id).filter((m) => m.kind === "image");
      return { ...p, photos, cover: photos.find((m) => m.is_cover) ?? photos[0] ?? null };
    })
    .sort(bySort);

  const blocks = raw.blocks
    .filter((b) => b.published && (!isProductionSite || b.claim_status === "confirmed"))
    .sort(bySort);

  const visibleKeys = new Set(blocks.map((b) => b.key));
  const blockImages: Record<string, MediaAsset[]> = {};
  for (const m of raw.media.filter((m) => m.kind === "image" && m.content_block_key && visibleKeys.has(m.content_block_key)).sort(bySort)) {
    (blockImages[m.content_block_key!] ??= []).push(m);
  }

  return { source: raw.source, settings: raw.settings, blocks, categories, packages, products, projects, blockImages };
}

// ---------------------------------------------------------------------------
// Convenience selectors
// ---------------------------------------------------------------------------

export async function getSettings() {
  return (await getPublicSnapshot()).settings;
}

export async function getBlocks(section: ContentBlock["section"]) {
  return (await getPublicSnapshot()).blocks.filter((b) => b.section === section);
}

export async function getBlock(key: string) {
  return (await getPublicSnapshot()).blocks.find((b) => b.key === key) ?? null;
}

export async function getPackageBySlug(slug: string) {
  return (await getPublicSnapshot()).packages.find((p) => p.slug === slug) ?? null;
}

export async function getProductBySlug(slug: string) {
  return (await getPublicSnapshot()).products.find((p) => p.slug === slug) ?? null;
}

export async function getProjectBySlug(slug: string) {
  return (await getPublicSnapshot()).projects.find((p) => p.slug === slug) ?? null;
}

/** For generateStaticParams: Cache Components needs at least one entry. */
export function slugParams(items: { slug: string }[]) {
  return items.length ? items.map((i) => ({ slug: i.slug })) : [{ slug: "__none__" }];
}
