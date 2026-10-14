import { test } from "node:test";
import assert from "node:assert/strict";
import { addUser, asRole, createDb } from "./harness";

const OWNER = "11111111-1111-4111-8111-111111111111";
const EDITOR = "22222222-2222-4222-8222-222222222222";
const STRANGER = "33333333-3333-4333-8333-333333333333";
const UNCONFIRMED = "44444444-4444-4444-8444-444444444444";
const REVOKED = "55555555-5555-4555-8555-555555555555";

async function setup() {
  const db = await createDb();
  await addUser(db, OWNER, "owner@example.com");
  await addUser(db, EDITOR, "Editor@Example.com"); // case-insensitive match
  await addUser(db, STRANGER, "stranger@gmail.com");
  await addUser(db, UNCONFIRMED, "pending@example.com", false);
  await addUser(db, REVOKED, "revoked@example.com");
  await db.exec(`
    insert into public.staff_members (email, role) values
      ('owner@example.com', 'owner'),
      ('editor@example.com', 'editor'),
      ('pending@example.com', 'editor');
    insert into public.staff_members (email, role, active) values ('revoked@example.com', 'editor', false);
    insert into public.packages (slug, name, package_type, status) values ('secret-draft', 'Secret draft', 'installed_system', 'draft');
    insert into public.packages (slug, name, package_type, status, is_sample) values ('real-package', 'Real package', 'installed_system', 'published', false);
  `);
  return db;
}

const count = async (db: Awaited<ReturnType<typeof createDb>>, sql: string) =>
  Number(((await db.query<{ n: number }>(sql)).rows[0] as { n: number }).n);

test("anonymous visitors see only published packages; samples visible only in preview mode", async () => {
  const db = await setup();
  const slugs = async () =>
    (await asRole(db, "anon", null, () => db.query<{ slug: string }>(`select slug from public.packages order by slug`))).rows.map((r) => r.slug);

  const preview = await slugs();
  assert.ok(!preview.includes("secret-draft"), "draft must be hidden");
  assert.ok(preview.includes("trio-6kw-hybrid-equipment-bundle"), "sample visible in preview mode");

  await db.exec(`update public.deployment_config set content_mode = 'production'`);
  const production = await slugs();
  assert.deepEqual(production, ["real-package"], "production mode hides samples and drafts");
});

test("anonymous visitors cannot read admin-only columns or write content", async () => {
  const db = await setup();
  await assert.rejects(asRole(db, "anon", null, () => db.query(`select admin_notes from public.packages`)), /permission denied/);
  await assert.rejects(asRole(db, "anon", null, () => db.query(`select review_note from public.content_blocks`)), /permission denied/);
  await assert.rejects(
    asRole(db, "anon", null, () => db.query(`insert into public.packages (slug, name, package_type) values ('x-y', 'Hack', 'installed_system')`)),
    /permission denied/,
  );
  await assert.rejects(asRole(db, "anon", null, () => db.query(`update public.site_settings set phone_display = 'hacked'`)), /permission denied/);
  await assert.rejects(asRole(db, "anon", null, () => db.query(`select * from public.staff_members`)), /permission denied/);
});

test("Google sign-in alone grants nothing: non-staff, unconfirmed and revoked users are not staff", async () => {
  const db = await setup();
  for (const user of [STRANGER, UNCONFIRMED, REVOKED]) {
    const isStaff = await asRole(db, "authenticated", user, () => db.query<{ s: boolean }>(`select public.is_staff() as s`));
    assert.equal(isStaff.rows[0].s, false, `user ${user} must not be staff`);
    const visible = await asRole(db, "authenticated", user, () => db.query(`select id from public.packages`));
    assert.equal(visible.rows.length, 0, "non-staff authenticated users get no admin reads");
    const updated = await asRole(db, "authenticated", user, () =>
      db.query(`update public.packages set name = 'Hacked' where slug = 'real-package' returning id`),
    );
    assert.equal(updated.rows.length, 0, "non-staff update must affect no rows");
    await assert.rejects(
      asRole(db, "authenticated", user, () => db.query(`insert into public.packages (slug, name, package_type) values ('h-x', 'Hack', 'installed_system')`)),
      /row-level security/,
    );
  }
});

test("staff editors can manage content including drafts, but not staff membership", async () => {
  const db = await setup();
  const role = await asRole(db, "authenticated", EDITOR, () => db.query<{ r: string }>(`select public.current_staff_role() as r`));
  assert.equal(role.rows[0].r, "editor");

  const drafts = await asRole(db, "authenticated", EDITOR, () => db.query(`select id from public.packages where status = 'draft'`));
  assert.equal(drafts.rows.length, 1);

  await asRole(db, "authenticated", EDITOR, () =>
    db.query(`insert into public.packages (slug, name, package_type) values ('new-draft', 'New draft', 'equipment_bundle')`),
  );
  const updated = await asRole(db, "authenticated", EDITOR, () =>
    db.query<{ updated_by: string }>(`update public.packages set status = 'published' where slug = 'new-draft' returning updated_by`),
  );
  assert.equal(updated.rows[0].updated_by, EDITOR, "updated_by is stamped from auth.uid()");

  await assert.rejects(
    asRole(db, "authenticated", EDITOR, () => db.query(`insert into public.staff_members (email, role) values ('friend@example.com', 'owner')`)),
    /row-level security/,
  );
  const selfPromote = await asRole(db, "authenticated", EDITOR, () =>
    db.query(`update public.staff_members set role = 'owner' where email = 'editor@example.com' returning id`),
  );
  assert.equal(selfPromote.rows.length, 0, "editors cannot promote themselves");
  const stillEditor = await asRole(db, "authenticated", EDITOR, () => db.query<{ r: string }>(`select public.current_staff_role() as r`));
  assert.equal(stillEditor.rows[0].r, "editor");
});

test("owners manage staff, and the last active owner cannot be removed or demoted", async () => {
  const db = await setup();
  await asRole(db, "authenticated", OWNER, () => db.query(`insert into public.staff_members (email, role) values ('new@example.com', 'editor')`));
  assert.equal(await count(db, `select count(*) as n from public.staff_members where email = 'new@example.com'`), 1);

  await assert.rejects(
    asRole(db, "authenticated", OWNER, () => db.query(`update public.staff_members set role = 'editor' where email = 'owner@example.com'`)),
    /last active owner/,
  );
  await assert.rejects(
    asRole(db, "authenticated", OWNER, () => db.query(`delete from public.staff_members where email = 'owner@example.com'`)),
    /last active owner/,
  );
  await assert.rejects(
    asRole(db, "authenticated", OWNER, () => db.query(`insert into public.staff_members (email, role) values ('Bad Email', 'editor')`)),
    /check constraint/,
  );
});

test("deployment mode cannot be changed through the API, even by owners", async () => {
  const db = await setup();
  await assert.rejects(
    asRole(db, "authenticated", OWNER, () => db.query(`update public.deployment_config set content_mode = 'preview'`)),
    /permission denied/,
  );
});

test("content blocks needing confirmation are hidden from the public in production mode", async () => {
  const db = await setup();
  const keys = async () =>
    (await asRole(db, "anon", null, () => db.query<{ key: string }>(`select key from public.content_blocks`))).rows.map((r) => r.key);
  assert.ok((await keys()).includes("why.warranty"));
  await db.exec(`update public.deployment_config set content_mode = 'production'`);
  const prod = await keys();
  assert.ok(!prod.includes("why.warranty"));
  assert.ok(prod.includes("about.intro"), "confirmed blocks stay public");
});

test("storage: anonymous reads only media of public records; only staff can upload or delete", async () => {
  const db = await setup();
  const pkg = (await db.query<{ id: string }>(`select id from public.packages where slug = 'real-package'`)).rows[0].id;
  const draft = (await db.query<{ id: string }>(`select id from public.packages where slug = 'secret-draft'`)).rows[0].id;
  const k1 = `packages/${pkg}/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa`;
  const k2 = `packages/${draft}/bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb`;
  await db.query(
    `insert into public.media_assets (kind, storage_key, package_id, alt) values ('image', $1, $2, 'Public'), ('image', $3, $4, 'Draft')`,
    [k1, pkg, k2, draft],
  );
  await db.query(`insert into storage.objects (bucket_id, name) values ('media', $1), ('media', $2)`, [`${k1}/640.webp`, `${k2}/640.webp`]);

  const anonObjects = await asRole(db, "anon", null, () => db.query<{ name: string }>(`select name from storage.objects`));
  assert.deepEqual(anonObjects.rows.map((r) => r.name), [`${k1}/640.webp`]);
  const anonMedia = await asRole(db, "anon", null, () => db.query(`select id from public.media_assets`));
  assert.equal(anonMedia.rows.length, 1);

  await assert.rejects(
    asRole(db, "anon", null, () => db.query(`insert into storage.objects (bucket_id, name) values ('media', 'packages/x/y.webp')`)),
    /row-level security/,
  );
  await assert.rejects(
    asRole(db, "authenticated", STRANGER, () => db.query(`insert into storage.objects (bucket_id, name) values ('media', 'packages/x/y.webp')`)),
    /row-level security/,
  );
  const strangerDelete = await asRole(db, "authenticated", STRANGER, () => db.query(`delete from storage.objects returning id`));
  assert.equal(strangerDelete.rows.length, 0);

  await asRole(db, "authenticated", EDITOR, () =>
    db.query(`insert into storage.objects (bucket_id, name) values ('media', $1)`, [`${k2}/1280.webp`]),
  );
  const staffObjects = await asRole(db, "authenticated", EDITOR, () => db.query(`select name from storage.objects`));
  assert.equal(staffObjects.rows.length, 3, "staff can see draft media");

  // Unpublishing withdraws public access immediately at the data layer.
  await db.exec(`update public.packages set status = 'draft' where slug = 'real-package'`);
  const afterUnpublish = await asRole(db, "anon", null, () => db.query(`select name from storage.objects`));
  assert.equal(afterUnpublish.rows.length, 0);
});

test("inquiry rate limiting is server-only and enforces client and global limits", async () => {
  const db = await setup();
  const hash = "a".repeat(64);
  await assert.rejects(
    asRole(db, "anon", null, () => db.query(`select public.inquiry_rate_check($1, 5, 600, 80)`, [hash])),
    /permission denied/,
  );
  const call = (h: string, cap = 80) =>
    asRole(db, "service_role", null, () => db.query<{ r: string }>(`select public.inquiry_rate_check($1, 2, 600, $2) as r`, [h, cap]));
  assert.equal((await call(hash)).rows[0].r, "ok");
  assert.equal((await call(hash)).rows[0].r, "ok");
  assert.equal((await call(hash)).rows[0].r, "client_limited");
  assert.equal((await call("b".repeat(64), 2)).rows[0].r, "global_limited");
  await assert.rejects(call("not-a-hash"), /invalid client hash/);
});

test("schema constraints reject invalid content", async () => {
  const db = await setup();
  const bad = [
    `insert into public.packages (slug, name, package_type) values ('Bad Slug', 'x1', 'installed_system')`,
    `insert into public.packages (slug, name, package_type, pricing_mode) values ('fixed-no-price', 'x1', 'installed_system', 'fixed')`,
    `insert into public.packages (slug, name, package_type, pricing_mode, price_php) values ('quote-with-price', 'x1', 'installed_system', 'quote', 5)`,
    `insert into public.packages (slug, name, package_type, promo_start, promo_end) values ('promo-backwards', 'x1', 'installed_system', '2026-10-31', '2026-10-01')`,
    `insert into public.packages (slug, name, package_type) values ('trio-6kw-hybrid-equipment-bundle', 'dup', 'installed_system')`,
    `update public.site_settings set phone_e164 = '0969'`,
    `update public.site_settings set facebook_enabled = true, facebook_url = null`,
    `insert into public.media_assets (kind, storage_key, project_id, alt) values ('datasheet', 'projects/00000000-0000-4000-8000-000000000301/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '00000000-0000-4000-8000-000000000301', 'x')`,
    `insert into public.media_assets (kind, storage_key, project_id, alt) values ('image', 'projects/00000000-0000-4000-8000-000000000301/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaab', '00000000-0000-4000-8000-000000000301', ' ')`,
  ];
  for (const sql of bad) {
    await assert.rejects(db.query(sql), Error, sql);
  }
});

test("admin integrity functions: cover, media reorder and record reorder are staff-only and atomic", async () => {
  const db = await setup();
  const proj = "00000000-0000-4000-8000-000000000301";
  const ids = ["a1", "a2", "a3"].map((s, i) => `aaaaaaa${i}-aaaa-4aaa-8aaa-aaaaaaaaaaaa`);
  for (const [i, id] of ids.entries()) {
    await db.query(
      `insert into public.media_assets (id, kind, storage_key, project_id, alt, sort_order, is_cover) values ($1, 'image', $2, $3, 'Photo', $4, $5)`,
      [id, `projects/${proj}/${id}`, proj, (i + 1) * 10, i === 0],
    );
  }
  await assert.rejects(asRole(db, "authenticated", STRANGER, () => db.query(`select public.media_set_cover($1)`, [ids[2]])), /not allowed/);
  await assert.rejects(asRole(db, "anon", null, () => db.query(`select public.media_set_cover($1)`, [ids[2]])), /permission denied/);

  await asRole(db, "authenticated", EDITOR, () => db.query(`select public.media_set_cover($1)`, [ids[2]]));
  const covers = await db.query<{ id: string }>(`select id from public.media_assets where project_id = $1 and is_cover`, [proj]);
  assert.deepEqual(covers.rows.map((r) => r.id), [ids[2]], "exactly one cover");

  await asRole(db, "authenticated", EDITOR, () => db.query(`select public.media_move($1, -1)`, [ids[2]]));
  const order = await db.query<{ id: string }>(`select id from public.media_assets where project_id = $1 order by sort_order`, [proj]);
  assert.deepEqual(order.rows.map((r) => r.id), [ids[0], ids[2], ids[1]]);

  const before = (await db.query<{ slug: string }>(`select slug from public.packages where status <> 'archived' order by sort_order, created_at`)).rows.map((r) => r.slug);
  const second = (await db.query<{ id: string }>(`select id from public.packages where slug = $1`, [before[1]])).rows[0].id;
  await asRole(db, "authenticated", EDITOR, () => db.query(`select public.record_move('packages', $1, -1)`, [second]));
  const after = (await db.query<{ slug: string }>(`select slug from public.packages where status <> 'archived' order by sort_order`)).rows.map((r) => r.slug);
  assert.deepEqual(after.slice(0, 2), [before[1], before[0]]);
  await assert.rejects(asRole(db, "authenticated", EDITOR, () => db.query(`select public.record_move('staff_members', $1, 1)`, [second])), /invalid table/);
  await assert.rejects(asRole(db, "authenticated", STRANGER, () => db.query(`select public.record_move('packages', $1, 1)`, [second])), /not allowed/);
});
