-- Admin integrity fixes (Codex review M3).
-- 1. Serialise owner changes so concurrent transactions cannot remove the last owner.
-- 2. Transactional media cover / reorder and record reorder (single statement each,
--    SECURITY INVOKER so RLS still applies to the caller).

create or replace function public.protect_last_owner()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  remaining int;
begin
  if (tg_op = 'DELETE' and old.role = 'owner' and old.active)
     or (tg_op = 'UPDATE' and old.role = 'owner' and old.active and (new.role <> 'owner' or not new.active)) then
    -- One owner change at a time; the count below then sees every committed change.
    perform pg_advisory_xact_lock(hashtext('public.staff_members.owners'));
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

-- Make one image the cover for its parent (clears the previous cover atomically).
create or replace function public.media_set_cover(p_asset uuid)
returns void
language plpgsql security invoker set search_path = ''
as $$
declare
  m public.media_assets;
begin
  if not public.is_staff() then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  select * into m from public.media_assets where id = p_asset and kind = 'image' for update;
  if not found then
    raise exception 'image not found' using errcode = 'P0002';
  end if;
  update public.media_assets set is_cover = false
  where is_cover and id <> m.id
    and package_id is not distinct from m.package_id
    and product_id is not distinct from m.product_id
    and project_id is not distinct from m.project_id
    and content_block_key is not distinct from m.content_block_key;
  update public.media_assets set is_cover = true where id = m.id;
end;
$$;

-- Move an image one place earlier (-1) or later (+1) among its siblings.
create or replace function public.media_move(p_asset uuid, p_direction int)
returns void
language plpgsql security invoker set search_path = ''
as $$
declare
  m public.media_assets;
  ids uuid[];
  i int;
  j int;
begin
  if not public.is_staff() then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  select * into m from public.media_assets where id = p_asset for update;
  if not found then
    raise exception 'image not found' using errcode = 'P0002';
  end if;
  select array_agg(id order by sort_order, created_at) into ids
  from public.media_assets
  where kind = m.kind
    and package_id is not distinct from m.package_id
    and product_id is not distinct from m.product_id
    and project_id is not distinct from m.project_id
    and content_block_key is not distinct from m.content_block_key;
  i := array_position(ids, m.id);
  j := i + sign(p_direction)::int;
  if j < 1 or j > cardinality(ids) then
    return;
  end if;
  ids[i] := ids[j];
  ids[j] := m.id;
  update public.media_assets a set sort_order = x.ord * 10
  from unnest(ids) with ordinality as x(id, ord)
  where a.id = x.id and a.sort_order <> x.ord * 10;
end;
$$;

-- Move a package/product/project/category one place among non-archived rows.
create or replace function public.record_move(p_table text, p_id uuid, p_direction int)
returns void
language plpgsql security invoker set search_path = ''
as $$
declare
  ids uuid[];
  i int;
  j int;
  tmp uuid;
begin
  if not public.is_staff() then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if p_table not in ('packages', 'products', 'projects', 'product_categories') then
    raise exception 'invalid table' using errcode = '22023';
  end if;
  -- Serialise reorders of the same table.
  perform pg_advisory_xact_lock(hashtext('public.record_move.' || p_table));
  execute format('select array_agg(id order by sort_order, created_at) from public.%I where status <> ''archived''', p_table) into ids;
  i := array_position(ids, p_id);
  if i is null then
    raise exception 'record not found' using errcode = 'P0002';
  end if;
  j := i + sign(p_direction)::int;
  if j < 1 or j > cardinality(ids) then
    return;
  end if;
  tmp := ids[i];
  ids[i] := ids[j];
  ids[j] := tmp;
  execute format(
    'update public.%I t set sort_order = x.ord * 10 from unnest($1) with ordinality as x(id, ord) where t.id = x.id and t.sort_order <> x.ord * 10',
    p_table
  ) using ids;
end;
$$;

revoke all on function public.media_set_cover(uuid) from public, anon;
revoke all on function public.media_move(uuid, int) from public, anon;
revoke all on function public.record_move(text, uuid, int) from public, anon;
grant execute on function public.media_set_cover(uuid) to authenticated;
grant execute on function public.media_move(uuid, int) to authenticated;
grant execute on function public.record_move(text, uuid, int) to authenticated;
