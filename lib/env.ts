// Public (non-secret) configuration. Safe to import anywhere.
// Secrets live in lib/env.server.ts.

export type SiteEnv = "preview" | "production";

export const siteEnv: SiteEnv = process.env.SITE_ENV === "production" ? "production" : "preview";
export const isProductionSite = siteEnv === "production";

export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/+$/, "");

export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
// Supabase's newer "publishable" key, or the legacy anon key — both are public.
export const supabasePublicKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const isSupabaseConfigured = Boolean(supabaseUrl && supabasePublicKey);
