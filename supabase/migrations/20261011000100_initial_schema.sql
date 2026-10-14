-- JFL Solar — initial schema
-- Content tables, staff allowlist, deployment mode, media, inquiry rate limits,
-- Row Level Security and Storage policies. See DECISIONS.md D2–D6.

-- ---------------------------------------------------------------------------
-- Deployment mode (preview | production). No write policy: change it with SQL
-- as the project owner only. Production mode hides samples and unconfirmed
-- claims from anonymous readers at the database level.
-- ---------------------------------------------------------------------------
create table public.deployment_config (
  id smallint primary key default 1 check (id = 1),
  content_mode text not null default 'preview' check (content_mode in ('preview', 'production')),
  updated_at timestamptz not null default now()
);
insert into public.deployment_config (id) values (1);

create or replace function public.is_production_mode()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select coalesce((select content_mode = 'production' from public.deployment_config where id = 1), false)
$$;

-- ---------------------------------------------------------------------------
-- Staff allowlist
-- ---------------------------------------------------------------------------
create table public.staff_members (
  id uuid primary key default gen_random_uuid(),
  email text not null unique
    check (email = lower(btrim(email)) and email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' and length(email) <= 254),
  role text not null default 'editor' check (role in ('owner', 'editor')),
  active boolean not null default true,
  display_name text check (display_name is null or length(display_name) <= 120),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid
);

-- Role of the signed-in user, or null. Requires a confirmed email that matches
-- an active allowlist row. security definer: reads auth.users safely.
create or replace function public.current_staff_role()
returns text
language sql stable security definer set search_path = ''
as $$
  select s.role
  from public.staff_members s
  join auth.users u on lower(u.email) = s.email
  where u.id = auth.uid()
    and u.email_confirmed_at is not null
    and s.active
  limit 1
$$;

create or replace function public.is_staff()
returns boolean
language sql stable security definer set search_path = ''
as $$ select public.current_staff_role() is not null $$;

create or replace function public.is_owner()
returns boolean
language sql stable security definer set search_path = ''
as $$ select public.current_staff_role() = 'owner' $$;

-- Never leave the site without an active owner.
create or replace function public.protect_last_owner()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  remaining int;
begin
  if (tg_op = 'DELETE' and old.role = 'owner' and old.active)
     or (tg_op = 'UPDATE' and old.role = 'owner' and old.active and (new.role <> 'owner' or not new.active)) then
    select count(*) into remaining
    from public.staff_members
    where role = 'owner' and active and id <> old.id;
    if remaining = 0 then
      raise exception 'Cannot remove or demote the last active owner' using errcode = 'P0001';
    end if;
  end if;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger staff_members_protect_last_owner
  before update or delete on public.staff_members
  for each row execute function public.protect_last_owner();

-- ---------------------------------------------------------------------------
-- Shared helpers
-- ---------------------------------------------------------------------------
create or replace function public.touch_updated()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  if to_jsonb(new) ? 'updated_by' then
    new.updated_by = auth.uid();
  end if;
  return new;
end;
$$;

create trigger staff_members_touch before update on public.staff_members
  for each row execute function public.touch_updated();

-- Slug: lowercase words separated by single hyphens, 1–80 chars.
create domain public.slug_text as text
  check (value ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(value) <= 80);

-- ---------------------------------------------------------------------------
-- Site settings (public contact details — never secrets)
-- ---------------------------------------------------------------------------
create table public.site_settings (
  id smallint primary key default 1 check (id = 1),
  phone_display text not null check (length(phone_display) between 3 and 40),
  phone_e164 text not null check (phone_e164 ~ '^\+[1-9][0-9]{7,14}$'),
  messaging_display text check (messaging_display is null or length(messaging_display) <= 40),
  whatsapp_e164 text check (whatsapp_e164 is null or whatsapp_e164 ~ '^\+[1-9][0-9]{7,14}$'),
  whatsapp_enabled boolean not null default false,
  viber_e164 text check (viber_e164 is null or viber_e164 ~ '^\+[1-9][0-9]{7,14}$'),
  viber_enabled boolean not null default false,
  facebook_url text check (facebook_url is null or facebook_url ~ '^https://(www\.|m\.)?facebook\.com/[A-Za-z0-9._/-]+$'),
  facebook_enabled boolean not null default false,
  messenger_url text check (messenger_url is null or messenger_url ~ '^https://(m\.me|www\.messenger\.com)/[A-Za-z0-9._/-]+$'),
  messenger_enabled boolean not null default false,
  public_email text check (public_email is null or (public_email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' and length(public_email) <= 254)),
  office_address text not null check (length(office_address) <= 300),
  warehouse_address text check (warehouse_address is null or length(warehouse_address) <= 300),
  service_area text not null check (length(service_area) <= 300),
  service_area_note text check (service_area_note is null or length(service_area_note) <= 1000),
  business_hours text check (business_hours is null or length(business_hours) <= 300),
  general_warranty text check (general_warranty is null or length(general_warranty) <= 4000),
  updated_at timestamptz not null default now(),
  updated_by uuid,
  check (not whatsapp_enabled or whatsapp_e164 is not null),
  check (not viber_enabled or viber_e164 is not null),
  check (not facebook_enabled or facebook_url is not null),
  check (not messenger_enabled or messenger_url is not null)
);
create trigger site_settings_touch before update on public.site_settings
  for each row execute function public.touch_updated();

-- ---------------------------------------------------------------------------
-- Editable copy blocks (About, mission, vision, founder, why-choose-us, ...)
-- ---------------------------------------------------------------------------
create table public.content_blocks (
  key text primary key check (key ~ '^[a-z0-9]+([._-][a-z0-9]+)*$' and length(key) <= 60),
  section text not null check (section in ('about', 'why', 'home', 'services', 'legal')),
  title text not null check (length(title) between 1 and 160),
  subtitle text check (subtitle is null or length(subtitle) <= 200),
  body text not null default '' check (length(body) <= 6000),
  claim_status text not null default 'needs_confirmation' check (claim_status in ('confirmed', 'needs_confirmation')),
  review_note text check (review_note is null or length(review_note) <= 1000),
  published boolean not null default true,
  sort_order integer not null default 0,
  updated_at timestamptz not null default now(),
  updated_by uuid
);
create trigger content_blocks_touch before update on public.content_blocks
  for each row execute function public.touch_updated();

-- ---------------------------------------------------------------------------
-- Product categories
-- ---------------------------------------------------------------------------
create table public.product_categories (
  id uuid primary key default gen_random_uuid(),
  slug public.slug_text not null unique,
  name text not null check (length(name) between 1 and 80),
  description text check (description is null or length(description) <= 400),
  status text not null default 'published' check (status in ('draft', 'published', 'archived')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid
);
create trigger product_categories_touch before update on public.product_categories
  for each row execute function public.touch_updated();

-- ---------------------------------------------------------------------------
-- Packages
-- ---------------------------------------------------------------------------
create table public.packages (
  id uuid primary key default gen_random_uuid(),
  slug public.slug_text not null unique,
  sku text unique check (sku is null or sku ~ '^[A-Z0-9][A-Z0-9-]{1,39}$'),
  name text not null check (length(name) between 2 and 120),
  summary text not null default '' check (length(summary) <= 300),
  description text not null default '' check (length(description) <= 6000),
  package_type text not null check (package_type in ('installed_system', 'equipment_bundle')),
  system_type text check (system_type in ('on_grid', 'hybrid', 'off_grid')),
  inverter_kw numeric(8, 2) check (inverter_kw is null or inverter_kw > 0),
  array_kwp numeric(8, 2) check (array_kwp is null or array_kwp > 0),
  battery_kwh numeric(8, 2) check (battery_kwh is null or battery_kwh > 0),
  components jsonb not null default '[]'::jsonb check (jsonb_typeof(components) = 'array'),
  inclusions text[] not null default '{}',
  exclusions text[] not null default '{}',
  pricing_mode text not null default 'quote' check (pricing_mode in ('fixed', 'starting', 'quote')),
  price_php numeric(12, 2) check (price_php is null or price_php >= 0),
  price_basis text check (price_basis is null or length(price_basis) <= 200),
  price_is_sample boolean not null default false,
  currency text not null default 'PHP' check (currency = 'PHP'),
  installation_terms text check (installation_terms is null or length(installation_terms) <= 1000),
  fulfillment text not null default 'to_be_confirmed'
    check (fulfillment in ('installed', 'pickup', 'delivery', 'pickup_or_delivery', 'to_be_confirmed')),
  fulfillment_notes text check (fulfillment_notes is null or length(fulfillment_notes) <= 600),
  promo_label text check (promo_label is null or length(promo_label) <= 80),
  promo_start date,
  promo_end date,
  hide_when_expired boolean not null default false,
  warranty_terms text check (warranty_terms is null or length(warranty_terms) <= 2000),
  admin_notes text check (admin_notes is null or length(admin_notes) <= 2000),
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  featured boolean not null default false,
  sort_order integer not null default 0,
  is_sample boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid,
  check ((pricing_mode = 'quote' and price_php is null) or (pricing_mode in ('fixed', 'starting') and price_php is not null)),
  check (promo_start is null or promo_end is null or promo_end >= promo_start),
  check (cardinality(inclusions) <= 40 and cardinality(exclusions) <= 40)
);
create index packages_public_idx on public.packages (status, sort_order);
create trigger packages_touch before update on public.packages
  for each row execute function public.touch_updated();

-- ---------------------------------------------------------------------------
-- Products
-- ---------------------------------------------------------------------------
create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug public.slug_text not null unique,
  sku text unique check (sku is null or sku ~ '^[A-Z0-9][A-Z0-9-]{1,39}$'),
  name text not null check (length(name) between 2 and 140),
  brand text check (brand is null or length(brand) <= 60),
  model text check (model is null or length(model) <= 80),
  category_id uuid not null references public.product_categories (id) on delete restrict,
  summary text not null default '' check (length(summary) <= 300),
  description text not null default '' check (length(description) <= 6000),
  specs jsonb not null default '[]'::jsonb check (jsonb_typeof(specs) = 'array'),
  pricing_mode text not null default 'quote' check (pricing_mode in ('fixed', 'starting', 'quote')),
  price_php numeric(12, 2) check (price_php is null or price_php >= 0),
  price_basis text check (price_basis is null or length(price_basis) <= 200),
  price_is_sample boolean not null default false,
  currency text not null default 'PHP' check (currency = 'PHP'),
  availability text not null default 'on_request'
    check (availability in ('available', 'on_request', 'preorder', 'unavailable')),
  warranty_terms text check (warranty_terms is null or length(warranty_terms) <= 2000),
  admin_notes text check (admin_notes is null or length(admin_notes) <= 2000),
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  featured boolean not null default false,
  sort_order integer not null default 0,
  is_sample boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid,
  check ((pricing_mode = 'quote' and price_php is null) or (pricing_mode in ('fixed', 'starting') and price_php is not null))
);
create index products_public_idx on public.products (status, category_id, sort_order);
create trigger products_touch before update on public.products
  for each row execute function public.touch_updated();

-- ---------------------------------------------------------------------------
-- Projects
-- ---------------------------------------------------------------------------
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  slug public.slug_text not null unique,
  title text not null check (length(title) between 2 and 140),
  location text check (location is null or length(location) <= 120),
  project_type text not null check (project_type in ('residential', 'commercial', 'industrial')),
  system_size_kwp numeric(8, 2) check (system_size_kwp is null or system_size_kwp > 0),
  system_size_confirmed boolean not null default false,
  scope text check (scope is null or length(scope) <= 600),
  summary text not null default '' check (length(summary) <= 300),
  description text not null default '' check (length(description) <= 6000),
  admin_notes text check (admin_notes is null or length(admin_notes) <= 2000),
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  featured boolean not null default false,
  sort_order integer not null default 0,
  is_sample boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid
);
create index projects_public_idx on public.projects (status, sort_order);
create trigger projects_touch before update on public.projects
  for each row execute function public.touch_updated();

-- ---------------------------------------------------------------------------
-- Media (images and datasheets). Files live in the private `media` bucket under
-- `<storage_key>/<variant>`; this row is the authority for public visibility.
-- ---------------------------------------------------------------------------
create table public.media_assets (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('image', 'datasheet')),
  storage_key text not null unique check (storage_key ~ '^[a-z]+/[0-9a-f-]{36}/[0-9a-f-]{36}$'),
  package_id uuid references public.packages (id) on delete cascade,
  product_id uuid references public.products (id) on delete cascade,
  project_id uuid references public.projects (id) on delete cascade,
  content_block_key text references public.content_blocks (key) on delete cascade on update cascade,
  alt text not null default '' check (length(alt) <= 300),
  caption text check (caption is null or length(caption) <= 300),
  file_name text check (file_name is null or length(file_name) <= 200),
  widths integer[] not null default '{}',
  width integer check (width is null or width > 0),
  height integer check (height is null or height > 0),
  bytes integer check (bytes is null or bytes > 0),
  is_cover boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid,
  check (num_nonnulls(package_id, product_id, project_id, content_block_key) = 1),
  check (kind = 'image' or product_id is not null),
  check (kind <> 'image' or length(btrim(alt)) > 0)
);
create unique index media_one_cover_per_package on public.media_assets (package_id) where is_cover;
create unique index media_one_cover_per_product on public.media_assets (product_id) where is_cover;
create unique index media_one_cover_per_project on public.media_assets (project_id) where is_cover;
create unique index media_one_datasheet_per_product on public.media_assets (product_id) where kind = 'datasheet';
create index media_parent_idx on public.media_assets (package_id, product_id, project_id, content_block_key);
create trigger media_assets_touch before update on public.media_assets
  for each row execute function public.touch_updated();

-- ---------------------------------------------------------------------------
-- Public visibility rules (single source of truth for RLS + storage)
-- ---------------------------------------------------------------------------
create or replace function public.record_is_public(p_status text, p_is_sample boolean)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select p_status = 'published' and (not p_is_sample or not public.is_production_mode())
$$;

create or replace function public.block_is_public(p_published boolean, p_claim_status text)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select p_published and (p_claim_status = 'confirmed' or not public.is_production_mode())
$$;

create or replace function public.media_is_public(m public.media_assets)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select case
    when m.package_id is not null then exists (
      select 1 from public.packages p where p.id = m.package_id and public.record_is_public(p.status, p.is_sample))
    when m.product_id is not null then exists (
      select 1 from public.products p where p.id = m.product_id and public.record_is_public(p.status, p.is_sample))
    when m.project_id is not null then exists (
      select 1 from public.projects p where p.id = m.project_id and public.record_is_public(p.status, p.is_sample))
    when m.content_block_key is not null then exists (
      select 1 from public.content_blocks b where b.key = m.content_block_key and public.block_is_public(b.published, b.claim_status))
    else false
  end
$$;

-- Storage object path `<storage_key>/<file>` -> is it publicly readable?
create or replace function public.media_object_is_public(object_name text)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.media_assets m
    where object_name like m.storage_key || '/%'
      and public.media_is_public(m)
  )
$$;

-- ---------------------------------------------------------------------------
-- Inquiry rate limiting (no inquiry content stored; client key is a salted hash)
-- ---------------------------------------------------------------------------
create table public.inquiry_rate_events (
  id bigint generated always as identity primary key,
  client_hash text not null check (client_hash ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null default now()
);
create index inquiry_rate_events_client_idx on public.inquiry_rate_events (client_hash, created_at);
create index inquiry_rate_events_created_idx on public.inquiry_rate_events (created_at);

-- Returns 'ok', 'client_limited' or 'global_limited'. Records the attempt when ok.
create or replace function public.inquiry_rate_check(p_client_hash text, p_client_limit int, p_window_seconds int, p_daily_cap int)
returns text
language plpgsql volatile security definer set search_path = ''
as $$
declare
  recent int;
  today int;
begin
  if p_client_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'invalid client hash' using errcode = '22023';
  end if;
  p_client_limit := least(greatest(p_client_limit, 1), 50);
  p_window_seconds := least(greatest(p_window_seconds, 60), 86400);
  p_daily_cap := least(greatest(p_daily_cap, 1), 1000);

  -- Serialise admissions so concurrent requests cannot both pass the limits.
  -- Transaction-scoped; inquiry volume is low, so one lock is sufficient.
  perform pg_advisory_xact_lock(hashtext('public.inquiry_rate_check'));

  delete from public.inquiry_rate_events where created_at < now() - interval '24 hours';

  select count(*) into recent from public.inquiry_rate_events
  where client_hash = p_client_hash and created_at > now() - make_interval(secs => p_window_seconds);
  if recent >= p_client_limit then
    return 'client_limited';
  end if;

  select count(*) into today from public.inquiry_rate_events
  where created_at > now() - interval '24 hours';
  if today >= p_daily_cap then
    return 'global_limited';
  end if;

  insert into public.inquiry_rate_events (client_hash) values (p_client_hash);
  return 'ok';
end;
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.deployment_config enable row level security;
alter table public.staff_members enable row level security;
alter table public.site_settings enable row level security;
alter table public.content_blocks enable row level security;
alter table public.product_categories enable row level security;
alter table public.packages enable row level security;
alter table public.products enable row level security;
alter table public.projects enable row level security;
alter table public.media_assets enable row level security;
alter table public.inquiry_rate_events enable row level security;

-- Reset Supabase's broad default grants; grant only what each role needs.
revoke all on all tables in schema public from anon, authenticated;
revoke all on all functions in schema public from public, anon, authenticated;

grant execute on function public.is_production_mode() to anon, authenticated;
grant execute on function public.current_staff_role() to authenticated;
grant execute on function public.is_staff() to anon, authenticated;
grant execute on function public.is_owner() to authenticated;
grant execute on function public.record_is_public(text, boolean) to anon, authenticated;
grant execute on function public.block_is_public(boolean, text) to anon, authenticated;
grant execute on function public.media_is_public(public.media_assets) to anon, authenticated;
grant execute on function public.media_object_is_public(text) to anon, authenticated;
-- Rate limiting is called only by the server with the service-role key, so the
-- public cannot inflate the counters (and block real inquiries) via direct RPC.
grant execute on function public.inquiry_rate_check(text, int, int, int) to service_role;

-- deployment_config: readable (the app shows which mode it is in); never writable via API.
grant select on public.deployment_config to anon, authenticated;
create policy deployment_config_read on public.deployment_config for select to anon, authenticated using (true);

-- staff_members: staff can read the list; only owners can change it.
grant select, insert, update, delete on public.staff_members to authenticated;
create policy staff_read on public.staff_members for select to authenticated using (public.is_staff());
create policy staff_insert on public.staff_members for insert to authenticated with check (public.is_owner());
create policy staff_update on public.staff_members for update to authenticated using (public.is_owner()) with check (public.is_owner());
create policy staff_delete on public.staff_members for delete to authenticated using (public.is_owner());

-- site_settings: public read; staff update (row is created by migration/seed only).
grant select on public.site_settings to anon, authenticated;
grant update on public.site_settings to authenticated;
create policy settings_read on public.site_settings for select to anon, authenticated using (true);
create policy settings_update on public.site_settings for update to authenticated using (public.is_staff()) with check (public.is_staff());

-- content_blocks: anon reads public columns of public blocks; staff read/write all.
grant select (key, section, title, subtitle, body, claim_status, published, sort_order, updated_at) on public.content_blocks to anon;
grant select, insert, update, delete on public.content_blocks to authenticated;
create policy blocks_public_read on public.content_blocks for select to anon
  using (public.block_is_public(published, claim_status));
create policy blocks_staff_read on public.content_blocks for select to authenticated
  using (public.is_staff());
create policy blocks_staff_insert on public.content_blocks for insert to authenticated with check (public.is_staff());
create policy blocks_staff_update on public.content_blocks for update to authenticated using (public.is_staff()) with check (public.is_staff());
create policy blocks_staff_delete on public.content_blocks for delete to authenticated using (public.is_staff());

-- product_categories
grant select (id, slug, name, description, status, sort_order) on public.product_categories to anon;
grant select, insert, update, delete on public.product_categories to authenticated;
create policy categories_public_read on public.product_categories for select to anon using (status = 'published');
create policy categories_staff_read on public.product_categories for select to authenticated using (public.is_staff());
create policy categories_staff_insert on public.product_categories for insert to authenticated with check (public.is_staff());
create policy categories_staff_update on public.product_categories for update to authenticated using (public.is_staff()) with check (public.is_staff());
create policy categories_staff_delete on public.product_categories for delete to authenticated using (public.is_staff());

-- packages (admin_notes is never granted to anon)
grant select (id, slug, sku, name, summary, description, package_type, system_type, inverter_kw, array_kwp, battery_kwh,
  components, inclusions, exclusions, pricing_mode, price_php, price_basis, price_is_sample, currency, installation_terms,
  fulfillment, fulfillment_notes, promo_label, promo_start, promo_end, hide_when_expired, warranty_terms, status, featured,
  sort_order, is_sample, updated_at) on public.packages to anon;
grant select, insert, update, delete on public.packages to authenticated;
create policy packages_public_read on public.packages for select to anon using (public.record_is_public(status, is_sample));
create policy packages_staff_read on public.packages for select to authenticated using (public.is_staff());
create policy packages_staff_insert on public.packages for insert to authenticated with check (public.is_staff());
create policy packages_staff_update on public.packages for update to authenticated using (public.is_staff()) with check (public.is_staff());
create policy packages_staff_delete on public.packages for delete to authenticated using (public.is_staff());

-- products
grant select (id, slug, sku, name, brand, model, category_id, summary, description, specs, pricing_mode, price_php,
  price_basis, price_is_sample, currency, availability, warranty_terms, status, featured, sort_order, is_sample, updated_at)
  on public.products to anon;
grant select, insert, update, delete on public.products to authenticated;
create policy products_public_read on public.products for select to anon using (public.record_is_public(status, is_sample));
create policy products_staff_read on public.products for select to authenticated using (public.is_staff());
create policy products_staff_insert on public.products for insert to authenticated with check (public.is_staff());
create policy products_staff_update on public.products for update to authenticated using (public.is_staff()) with check (public.is_staff());
create policy products_staff_delete on public.products for delete to authenticated using (public.is_staff());

-- projects
grant select (id, slug, title, location, project_type, system_size_kwp, system_size_confirmed, scope, summary, description,
  status, featured, sort_order, is_sample, updated_at) on public.projects to anon;
grant select, insert, update, delete on public.projects to authenticated;
create policy projects_public_read on public.projects for select to anon using (public.record_is_public(status, is_sample));
create policy projects_staff_read on public.projects for select to authenticated using (public.is_staff());
create policy projects_staff_insert on public.projects for insert to authenticated with check (public.is_staff());
create policy projects_staff_update on public.projects for update to authenticated using (public.is_staff()) with check (public.is_staff());
create policy projects_staff_delete on public.projects for delete to authenticated using (public.is_staff());

-- media_assets
grant select (id, kind, storage_key, package_id, product_id, project_id, content_block_key, alt, caption, file_name, widths,
  width, height, bytes, is_cover, sort_order) on public.media_assets to anon;
grant select, insert, update, delete on public.media_assets to authenticated;
create policy media_public_read on public.media_assets for select to anon using (public.media_is_public(media_assets));
create policy media_staff_read on public.media_assets for select to authenticated using (public.is_staff());
create policy media_staff_insert on public.media_assets for insert to authenticated with check (public.is_staff());
create policy media_staff_update on public.media_assets for update to authenticated using (public.is_staff()) with check (public.is_staff());
create policy media_staff_delete on public.media_assets for delete to authenticated using (public.is_staff());

-- inquiry_rate_events: no direct table access at all (function only).

-- ---------------------------------------------------------------------------
-- Storage: private bucket + policies
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', false, 5242880, array['image/webp', 'application/pdf'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy media_objects_read on storage.objects for select to anon, authenticated
  using (bucket_id = 'media' and (public.is_staff() or public.media_object_is_public(name)));
create policy media_objects_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and public.is_staff());
create policy media_objects_update on storage.objects for update to authenticated
  using (bucket_id = 'media' and public.is_staff()) with check (bucket_id = 'media' and public.is_staff());
create policy media_objects_delete on storage.objects for delete to authenticated
  using (bucket_id = 'media' and public.is_staff());
