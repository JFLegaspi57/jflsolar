// Domain types. Field names mirror the Postgres columns (snake_case) so rows
// pass through without mapping. See supabase/migrations/.

export type Status = "draft" | "published" | "archived";
export type PricingMode = "fixed" | "starting" | "quote";
export type PackageType = "installed_system" | "equipment_bundle";
export type SystemType = "on_grid" | "hybrid" | "off_grid";
export type Fulfillment = "installed" | "pickup" | "delivery" | "pickup_or_delivery" | "to_be_confirmed";
export type Availability = "available" | "on_request" | "preorder" | "unavailable";
export type ProjectType = "residential" | "commercial" | "industrial";
export type ClaimStatus = "confirmed" | "needs_confirmation";
export type ContentSection = "about" | "why" | "home" | "services" | "legal";
export type PromoState = "none" | "upcoming" | "active" | "ended";

export interface SpecItem {
  label: string;
  value: string;
}

export interface PackageComponent {
  label: string; // e.g. "Hybrid inverter"
  detail: string; // e.g. "GoodWe GW6000-ES-C10, 6 kW"
  quantity?: string | null; // e.g. "10 pcs"
}

export interface MediaAsset {
  id: string;
  kind: "image" | "datasheet";
  storage_key: string;
  package_id: string | null;
  product_id: string | null;
  project_id: string | null;
  content_block_key: string | null;
  alt: string;
  caption: string | null;
  file_name: string | null;
  widths: number[];
  width: number | null;
  height: number | null;
  bytes: number | null;
  is_cover: boolean;
  sort_order: number;
}

export interface SiteSettings {
  phone_display: string;
  phone_e164: string;
  messaging_display: string | null;
  whatsapp_e164: string | null;
  whatsapp_enabled: boolean;
  viber_e164: string | null;
  viber_enabled: boolean;
  facebook_url: string | null;
  facebook_enabled: boolean;
  messenger_url: string | null;
  messenger_enabled: boolean;
  public_email: string | null;
  office_address: string;
  warehouse_address: string | null;
  service_area: string;
  service_area_note: string | null;
  business_hours: string | null;
  general_warranty: string | null;
  updated_at?: string;
}

export interface ContentBlock {
  key: string;
  section: ContentSection;
  title: string;
  subtitle: string | null;
  body: string;
  claim_status: ClaimStatus;
  review_note?: string | null; // staff only
  published: boolean;
  sort_order: number;
  updated_at?: string;
}

export interface ProductCategory {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  status: Status;
  sort_order: number;
}

interface Priced {
  pricing_mode: PricingMode;
  price_php: number | null;
  price_basis: string | null;
  price_is_sample: boolean;
}

export interface Package extends Priced {
  id: string;
  slug: string;
  sku: string | null;
  name: string;
  summary: string;
  description: string;
  package_type: PackageType;
  system_type: SystemType | null;
  inverter_kw: number | null;
  array_kwp: number | null;
  battery_kwh: number | null;
  components: PackageComponent[];
  inclusions: string[];
  exclusions: string[];
  installation_terms: string | null;
  fulfillment: Fulfillment;
  fulfillment_notes: string | null;
  promo_label: string | null;
  promo_start: string | null; // YYYY-MM-DD (Asia/Manila)
  promo_end: string | null;
  hide_when_expired: boolean;
  warranty_terms: string | null;
  admin_notes?: string | null;
  status: Status;
  featured: boolean;
  sort_order: number;
  is_sample: boolean;
  updated_at?: string;
}

export interface Product extends Priced {
  id: string;
  slug: string;
  sku: string | null;
  name: string;
  brand: string | null;
  model: string | null;
  category_id: string;
  summary: string;
  description: string;
  specs: SpecItem[];
  availability: Availability;
  warranty_terms: string | null;
  admin_notes?: string | null;
  status: Status;
  featured: boolean;
  sort_order: number;
  is_sample: boolean;
  updated_at?: string;
}

export interface Project {
  id: string;
  slug: string;
  title: string;
  location: string | null;
  project_type: ProjectType;
  system_size_kwp: number | null;
  system_size_confirmed: boolean;
  scope: string | null;
  summary: string;
  description: string;
  admin_notes?: string | null;
  status: Status;
  featured: boolean;
  sort_order: number;
  is_sample: boolean;
  updated_at?: string;
}

// Public view models (with resolved media / derived state)
export interface PublicPackage extends Package {
  promo_state: PromoState;
  images: MediaAsset[];
}

export interface PublicProduct extends Product {
  category: ProductCategory | null;
  images: MediaAsset[];
  datasheet: MediaAsset | null;
}

export interface PublicProject extends Project {
  photos: MediaAsset[];
  cover: MediaAsset | null;
}
