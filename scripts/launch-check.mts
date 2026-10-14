// Production launch gate. Usage: npm run launch:check
// Reads .env.local / .env.production.local if present (or the real environment)
// and checks configuration plus live database content. Exits 1 on any FAIL.
import { existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

for (const f of [".env.production.local", ".env.local"]) if (existsSync(f)) process.loadEnvFile(f);
const env = process.env;

type Row = { level: "PASS" | "WARN" | "FAIL"; check: string; detail?: string };
const results: Row[] = [];
const pass = (check: string, detail?: string) => results.push({ level: "PASS", check, detail });
const warn = (check: string, detail?: string) => results.push({ level: "WARN", check, detail });
const fail = (check: string, detail?: string) => results.push({ level: "FAIL", check, detail });
const is = (cond: boolean, check: string, detail?: string, soft = false) => (cond ? pass(check) : soft ? warn(check, detail) : fail(check, detail));

const url = env.NEXT_PUBLIC_SITE_URL ?? "";
is(env.SITE_ENV === "production", "SITE_ENV=production", `currently "${env.SITE_ENV ?? "(unset)"}"`);
is(/^https:\/\/[^/]+$/.test(url) && !/localhost|vercel\.app/.test(url), "NEXT_PUBLIC_SITE_URL is the final https domain", url || "(unset)");
const sbUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const pubKey = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const secret = env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY;
is(Boolean(sbUrl && pubKey), "Supabase URL and publishable key set");
is(Boolean(secret), "Supabase secret/service-role key set (rate limiter)");
is(Boolean(env.RESEND_API_KEY && env.INQUIRY_TO_EMAIL && env.INQUIRY_FROM_EMAIL), "Inquiry delivery configured (Resend key, recipient, sender)");
is((env.INQUIRY_SIGNING_SECRET ?? "").length >= 32, "INQUIRY_SIGNING_SECRET has 32+ characters");

async function database() {
  if (!sbUrl || !secret) return fail("Database checks", "skipped — Supabase URL/secret missing");
  const db = createClient(sbUrl, secret, { auth: { persistSession: false } });
  // Any failed query is a FAIL — never treat an error as "nothing found".
  const must = <T extends { error: { message: string } | null }>(label: string, r: T): T => {
    if (r.error) throw new Error(`${label}: ${r.error.message}`);
    return r;
  };
  const { data: mode } = must("deployment_config", await db.from("deployment_config").select("content_mode").eq("id", 1).maybeSingle());
  is(mode?.content_mode === "production", "Database content_mode = production", `currently "${mode?.content_mode ?? "unknown"}" — run: update public.deployment_config set content_mode = 'production';`);

  for (const table of ["packages", "products", "projects"]) {
    const { count } = must(table, await db.from(table).select("id", { count: "exact", head: true }).eq("status", "published").eq("is_sample", true));
    is(!count, `No published sample ${table}`, `${count} still marked Sample (hidden in production, but replace or archive them)`, true);
  }
  for (const table of ["packages", "products"]) {
    const { count } = must(table, await db.from(table).select("id", { count: "exact", head: true }).eq("status", "published").eq("price_is_sample", true));
    is(!count, `No published ${table} with sample prices`, `${count} published with "sample price" ticked`);
  }
  const { data: blocks } = must("content_blocks", await db.from("content_blocks").select("key").eq("published", true).eq("claim_status", "needs_confirmation"));
  is(!blocks?.length, "All published content blocks confirmed", `awaiting confirmation (hidden in production): ${(blocks ?? []).map((b) => b.key).join(", ")}`, true);

  const { data: s } = must("site_settings", await db.from("site_settings").select("*").eq("id", 1).maybeSingle());
  if (!s) return fail("Site settings row exists");
  is(!/to be confirmed/i.test(s.general_warranty ?? "to be confirmed"), "General warranty text confirmed", "still says 'to be confirmed'", true);
  is(s.facebook_enabled || s.messenger_enabled, "Facebook/Messenger link verified and enabled", "disabled — confirm the page URL in Admin → Settings", true);

  const { count: owners } = must("staff_members", await db.from("staff_members").select("id", { count: "exact", head: true }).eq("role", "owner").eq("active", true));
  is(Boolean(owners), "At least one active owner in staff_members");
  const { count: projects } = must("projects", await db.from("projects").select("id", { count: "exact", head: true }).eq("status", "published").eq("is_sample", false));
  is(Boolean(projects), "At least one real (non-sample) published project", "projects page will show an empty state", true);
}

await database().catch((e) => fail("Database checks", e instanceof Error ? e.message : String(e)));

for (const r of results) console.log(`${r.level.padEnd(4)}  ${r.check}${r.detail && r.level !== "PASS" ? `\n      → ${r.detail}` : ""}`);
const failed = results.filter((r) => r.level === "FAIL").length;
console.log(`\n${failed ? `NOT READY: ${failed} blocking item(s).` : "Ready to launch (review any WARN items)."}`);
process.exitCode = failed ? 1 : 0;
