// Runs the real migrations + seed inside PGlite (embedded Postgres 17) with a
// minimal stand-in for Supabase's `auth` and `storage` schemas and API roles,
// so RLS and storage policies can be tested without Docker.
import { PGlite } from "@electric-sql/pglite";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const SUPABASE_STUB = `
create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;
grant usage on schema public to anon, authenticated, service_role;

create schema auth;
create table auth.users (
  id uuid primary key,
  email text,
  email_confirmed_at timestamptz
);
create function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;
grant usage on schema auth to anon, authenticated, service_role;
grant execute on function auth.uid() to anon, authenticated, service_role;

create schema storage;
create table storage.buckets (
  id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]
);
create table storage.objects (
  id uuid primary key default gen_random_uuid(), bucket_id text references storage.buckets(id), name text, owner uuid
);
alter table storage.objects enable row level security;
grant usage on schema storage to anon, authenticated, service_role;
grant select, insert, update, delete on storage.objects to anon, authenticated, service_role;
`;

export async function createDb(options: { seed?: boolean } = {}) {
  const db = new PGlite();
  await db.exec(SUPABASE_STUB);
  const dir = "supabase/migrations";
  for (const file of readdirSync(dir).filter((f) => f.endsWith(".sql")).sort()) {
    await db.exec(readFileSync(join(dir, file), "utf8"));
  }
  if (options.seed !== false) {
    await db.exec(readFileSync("supabase/seed.sql", "utf8"));
  }
  return db;
}

export type Role = "anon" | "authenticated" | "service_role";

/** Run `fn` as an API role with the given auth user id (JWT `sub`). */
export async function asRole<T>(db: PGlite, role: Role, sub: string | null, fn: () => Promise<T>): Promise<T> {
  await db.exec(`select set_config('request.jwt.claim.sub', '${sub ?? ""}', false); set role ${role};`);
  try {
    return await fn();
  } finally {
    await db.exec(`reset role; select set_config('request.jwt.claim.sub', '', false);`);
  }
}

export async function addUser(db: PGlite, id: string, email: string, confirmed = true) {
  await db.query(`insert into auth.users (id, email, email_confirmed_at) values ($1, $2, $3)`, [
    id,
    email,
    confirmed ? new Date().toISOString() : null,
  ]);
}
