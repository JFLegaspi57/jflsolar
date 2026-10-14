// Out-of-band staff bootstrap (first owner, or recovery). Requires the
// Supabase secret/service-role key in .env.local — never exposed to the app UI.
//   npm run admin:grant -- owner@example.com owner "Display Name"
//   npm run admin:grant -- editor@example.com editor
import { existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

for (const f of [".env.local", ".env.production.local"]) if (existsSync(f)) process.loadEnvFile(f);
const [email, role = "editor", ...name] = process.argv.slice(2);
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || !["owner", "editor"].includes(role)) {
  console.error('Usage: npm run admin:grant -- <email> <owner|editor> ["Display Name"]');
  process.exit(1);
}
if (!url || !key) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY (or SUPABASE_SERVICE_ROLE_KEY) in .env.local first.");
  process.exit(1);
}

const db = createClient(url, key, { auth: { persistSession: false } });
const { error } = await db
  .from("staff_members")
  .upsert({ email: email.toLowerCase(), role, active: true, display_name: name.join(" ") || null }, { onConflict: "email" });
if (error) {
  console.error("Failed:", error.message);
  process.exit(1);
}
console.log(`${email.toLowerCase()} is now an active ${role}. They can sign in at /admin/login with Google using this exact address.`);
