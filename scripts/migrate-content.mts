// Copies all website content (settings, content blocks, categories, packages,
// products, projects, staff allowlist, photo/datasheet records) and the
// referenced files in the `media` storage bucket from one Supabase project to
// another — used for the handover from the prototype to JFL Solar's own project.
//
// The target must already have the schema (supabase/migrations/*) and must be
// EMPTY (do not run seed.sql on it). Sign-in accounts are not copied: staff
// access is by email, so people simply sign in with Google again.
//
// Keys are read ONLY from `.env.migrate.local` (git-ignored), never from the
// shell environment or the command line:
//   FROM_SUPABASE_URL=https://<old-ref>.supabase.co
//   FROM_SUPABASE_SECRET_KEY=<old secret / service_role key>
//   TO_SUPABASE_URL=https://<new-ref>.supabase.co
//   TO_SUPABASE_SECRET_KEY=<new secret / service_role key>
//
//   npm run migrate:content                       # dry run: shows what would be copied
//   npm run migrate:content -- --apply            # copies into an empty target
//   npm run migrate:content -- --apply --resume   # finishes a copy that stopped part-way
//
// --resume accepts a non-empty target only if every row already there matches
// a source row exactly (i.e. it is a partial copy of this source). It then
// re-uploads the files and inserts only the missing rows.
import { existsSync, readFileSync } from "node:fs";
import { parseEnv } from "node:util";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const ENV_FILE = ".env.migrate.local";
if (!existsSync(ENV_FILE)) {
  console.error(`Create ${ENV_FILE} first (see the header of scripts/migrate-content.mts).`);
  process.exit(1);
}
const config = parseEnv(readFileSync(ENV_FILE, "utf8"));
const env = (name: string) => {
  const v = config[name]?.trim();
  if (!v) {
    console.error(`Missing ${name} in ${ENV_FILE}.`);
    process.exit(1);
  }
  return v;
};
const apply = process.argv.includes("--apply");
const resume = process.argv.includes("--resume");
const fromUrl = env("FROM_SUPABASE_URL");
const toUrl = env("TO_SUPABASE_URL");
const norm = (u: string) => u.replace(/\/$/, "").toLowerCase();
if (norm(fromUrl) === norm(toUrl)) {
  console.error("FROM and TO are the same project — nothing to do.");
  process.exit(1);
}
const opts = { auth: { persistSession: false } };
const from = createClient(fromUrl, env("FROM_SUPABASE_SECRET_KEY"), opts);
const to = createClient(toUrl, env("TO_SUPABASE_SECRET_KEY"), opts);
const BUCKET = "media";

// Parents before children (foreign keys). deployment_config and the inquiry
// rate-limit log are deliberately not copied.
const TABLES = [
  { name: "site_settings", key: "id" },
  { name: "content_blocks", key: "key" },
  { name: "product_categories", key: "id" },
  { name: "packages", key: "id" },
  { name: "products", key: "id" },
  { name: "projects", key: "id" },
  { name: "staff_members", key: "id" },
  { name: "media_assets", key: "id" },
] as const;

async function countRows(db: SupabaseClient, table: string) {
  const { count, error } = await db.from(table).select("*", { count: "exact", head: true });
  if (error || count === null) throw new Error(`count ${table}: ${error?.message ?? "no count"}`);
  return count;
}

// Pages by the number of rows actually returned, so a server-side row limit
// below the requested page size cannot silently truncate the copy.
async function readAll(db: SupabaseClient, table: string, key: string, columns = "*") {
  const expected = await countRows(db, table);
  const rows: Record<string, unknown>[] = [];
  while (rows.length < expected) {
    const { data, error } = await db.from(table).select(columns).order(key).range(rows.length, rows.length + 999);
    if (error) throw new Error(`${table}: ${error.message}`);
    if (!data?.length) break;
    rows.push(...(data as unknown as Record<string, unknown>[]));
  }
  if (rows.length !== expected) throw new Error(`${table}: read ${rows.length} rows but the table has ${expected}.`);
  return rows;
}

// Order-independent JSON of a row, for comparing source and target copies.
const stable = (r: Record<string, unknown>) => JSON.stringify(Object.keys(r).sort().map((k) => [k, r[k]]));

const filesOf = (m: Record<string, unknown>) =>
  m.kind === "datasheet" ? [`${m.storage_key}/datasheet.pdf`] : (m.widths as number[]).map((w) => `${m.storage_key}/${w}.webp`);

// 1. Read everything from the source.
const data: Record<string, Record<string, unknown>[]> = {};
for (const t of TABLES) data[t.name] = await readAll(from, t.name, t.key);
const files = data.media_assets.flatMap(filesOf);

console.log(`From ${fromUrl}\nTo   ${toUrl}\n`);
for (const t of TABLES) console.log(`  ${t.name.padEnd(20)} ${data[t.name].length} rows`);
console.log(`  ${"media files".padEnd(20)} ${files.length} files`);

// Every referenced file must exist in the source before anything is copied.
const missing: string[] = [];
for (const path of files) {
  const { error } = await from.storage.from(BUCKET).download(path);
  if (error) missing.push(path);
}
if (missing.length) {
  console.error(`\nThese files are referenced but missing in the source bucket:\n  ${missing.join("\n  ")}`);
  process.exit(1);
}
console.log(`  All ${files.length} files are readable.`);

// 2. The target must have the schema, and be empty (or, with --resume, hold
// only rows that also exist in the source).
const { data: target, error: targetError } = await to.from("deployment_config").select("content_mode").maybeSingle();
if (targetError || !target) {
  console.error(`\nTarget has no schema yet (${targetError?.message ?? "deployment_config missing"}). Run the files in supabase/migrations/ first.`);
  process.exit(1);
}
const existing: Record<string, Set<string>> = {};
let partial = false;
for (const t of TABLES) {
  const targetRows = await readAll(to, t.name, t.key);
  const keys = targetRows.map((r) => String(r[t.key]));
  existing[t.name] = new Set(keys);
  if (!keys.length) continue;
  partial = true;
  const sourceRows = new Map(data[t.name].map((r) => [String(r[t.key]), stable(r)]));
  // A row already copied must still match the source exactly; otherwise the
  // source changed between attempts and a resume would leave stale content.
  const foreign = targetRows.filter((r) => sourceRows.get(String(r[t.key])) !== stable(r)).map((r) => String(r[t.key]));
  if (!resume) {
    console.error(`\nTarget table ${t.name} already has ${keys.length} rows. Use a fresh project (do not run seed.sql on it),`);
    console.error("or, if an earlier copy from this same source stopped part-way, add --resume.");
    process.exit(1);
  }
  if (foreign.length) {
    console.error(`\nTarget table ${t.name} has ${foreign.length} rows that are missing from, or differ from, the source (was content edited between attempts?). Use a fresh project.`);
    process.exit(1);
  }
}
console.log(
  partial ? `\nTarget holds part of an earlier copy; missing rows will be added. Content mode: "${target.content_mode}".` : `\nTarget is empty and ready. Its content mode is "${target.content_mode}".`,
);

if (!apply) {
  console.log("\nDry run only — nothing was copied. Run again with --apply to copy.");
  process.exit(0);
}

// 3. Files first, so no record ever points at a missing photo. Re-uploading
// on a resume simply overwrites the identical file.
let copied = 0;
for (const path of files) {
  const { data: blob, error } = await from.storage.from(BUCKET).download(path);
  if (error || !blob) throw new Error(`download ${path}: ${error?.message ?? "no data"}`);
  const contentType = path.endsWith(".pdf") ? "application/pdf" : "image/webp";
  const up = await to.storage.from(BUCKET).upload(path, blob, { contentType, upsert: true, cacheControl: "300" });
  if (up.error) throw new Error(`upload ${path}: ${up.error.message}`);
  if (++copied % 25 === 0) console.log(`  files: ${copied}/${files.length}`);
}
console.log(`Files copied: ${copied}`);

// 4. Rows, parents first. Only rows not already in the target are inserted,
// so no update triggers run and a resumed copy never rewrites anything.
for (const t of TABLES) {
  const rows = data[t.name].filter((r) => !existing[t.name].has(String(r[t.key])));
  for (let i = 0; i < rows.length; i += 500) {
    const { error } = await to.from(t.name).insert(rows.slice(i, i + 500));
    if (error) throw new Error(`insert ${t.name}: ${error.message}. Fix the cause, then run again with --apply --resume.`);
  }
  console.log(`Rows copied: ${t.name} ${rows.length}${existing[t.name].size ? ` (${existing[t.name].size} already there)` : ""}`);
}

// 5. Verify.
let ok = true;
for (const t of TABLES) {
  const count = await countRows(to, t.name);
  if (count !== data[t.name].length) {
    ok = false;
    console.error(`MISMATCH ${t.name}: source ${data[t.name].length}, target ${count}`);
  }
}
console.log(ok ? "\nDone. Every table matches the source." : "\nFinished with mismatches — see above.");
process.exit(ok ? 0 : 1);
