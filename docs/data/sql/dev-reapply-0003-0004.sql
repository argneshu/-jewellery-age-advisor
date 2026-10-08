-- DEV DATABASE ONLY (auradev). One-shot re-apply of 0003 + 0004 after the UPI regex fix (Story 10.2 defect log).
-- Runs in ONE transaction: if anything fails, nothing changes. Deletes the TEST orders created by the first check run.
-- Do NOT run on production: production never received the faulty 0003/0004 and must get the corrected files once, normally.

-- ===== 1/4  rollback 0004 =====
-- Rollback for 0004_place_order_fn.sql. Drops ONLY the function created by 0004. Orders already created are untouched.
drop function if exists public.place_order(text, text, jsonb);
notify pgrst, 'reload schema';

-- ===== 2/4  rollback 0003 =====
-- Rollback for 0003_orders.sql. Drops ONLY objects created by 0003.
-- WARNING: permanently deletes all orders and order items. Run 0004_place_order_fn_rollback.sql first.
-- Never run on production once real orders exist unless a backup/PITR point was taken and the user approved.
drop table if exists public.order_items;
drop table if exists public.orders;

-- ===== 3/4  corrected 0003 =====
-- Epic 10, Story 10.2 (Helix 4.1) — orders + order_items tables + RLS
-- Source: docs/data/data-model-epic10.md. Run after 0002, before 0004. Non-production first.
-- Rollback: 0003_orders_rollback.sql
-- Orders are immutable from the client: SELECT + INSERT policies only (no UPDATE/DELETE policy, and those privileges are revoked).
-- Deviations from Helix 4.1 (all additive tightening): CHECK constraints, status = 'confirmed' on insert, unique (order_id, jewellery_item_id), index.

create table public.orders (
  id               uuid        primary key default gen_random_uuid(),
  user_id          uuid        not null references auth.users(id) on delete cascade,
  address_snapshot jsonb       not null,
  payment_method   text        not null,
  upi_id           text,
  subtotal         integer     not null,
  total            integer     not null,
  status           text        not null default 'confirmed',
  created_at       timestamptz not null default now(),
  constraint orders_payment_method_check check (payment_method in ('cod', 'upi')),
  constraint orders_status_check         check (status in ('confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
  constraint orders_amounts_check        check (subtotal >= 0 and total >= 0),
  constraint orders_address_snapshot_obj check (jsonb_typeof(address_snapshot) = 'object'),
  constraint orders_upi_consistency      check (
    (payment_method = 'upi') = (upi_id is not null)
    and (upi_id is null or upi_id ~ '^[A-Za-z0-9._-]{2,100}@[A-Za-z]{2,64}$')
  )
);

create index orders_user_id_created_at_idx on public.orders (user_id, created_at desc);

alter table public.orders enable row level security;

create policy "Users can view their own orders"
  on public.orders for select
  using (auth.uid() = user_id);

-- Helix: only (auth.uid() = user_id). Added: status must be 'confirmed', so a client cannot self-insert a 'delivered' order.
create policy "Users can insert their own orders"
  on public.orders for insert
  with check (auth.uid() = user_id and status = 'confirmed');

create table public.order_items (
  id                uuid    primary key default gen_random_uuid(),
  order_id          uuid    not null references public.orders(id) on delete cascade,
  jewellery_item_id integer not null,
  name              text    not null,
  price             integer not null,
  quantity          integer not null default 1,
  constraint order_items_item_id_check   check (jewellery_item_id > 0),
  constraint order_items_name_check      check (length(btrim(name)) between 1 and 200),
  constraint order_items_price_check     check (price >= 0),
  constraint order_items_quantity_check  check (quantity between 1 and 10),
  -- also serves as the index on order_id (leading column)
  constraint order_items_order_item_key  unique (order_id, jewellery_item_id)
);

alter table public.order_items enable row level security;

create policy "Users can view their own order items"
  on public.order_items for select
  using (exists (select 1 from public.orders o where o.id = order_items.order_id and o.user_id = auth.uid()));

create policy "Users can insert their own order items"
  on public.order_items for insert
  with check (exists (select 1 from public.orders o where o.id = order_items.order_id and o.user_id = auth.uid()));

-- Defense in depth (RLS already denies these because no UPDATE/DELETE policy exists).
revoke all on public.orders, public.order_items from anon;
revoke update, delete, truncate on public.orders, public.order_items from authenticated;

-- ===== 4/4  corrected 0004 =====
-- Epic 10, Story 10.2 (D3) — atomic order creation
-- Source: docs/data/data-model-epic10.md. Run after 0002 and 0003. Non-production first.
-- Rollback: 0004_place_order_fn_rollback.sql
--
-- SECURITY INVOKER: runs with the caller's privileges, so every RLS policy still applies. Never SECURITY DEFINER.
-- search_path is empty: every object below is schema-qualified.
-- The function never trusts a client-supplied total: subtotal is computed here from the validated lines.
-- It cannot verify that unit prices match the catalog (the catalog is a static TypeScript file) — residual risk R1,
-- see docs/architecture/design/02-target-architecture-brownfield.md section 10.6.
--
-- p_items = [{"jewellery_item_id": int, "name": text, "price": int, "quantity": int}, ...]
-- Errors (message text is the contract): not_authenticated | invalid_order | no_address

create or replace function public.place_order(
  p_payment_method text,
  p_upi_id         text,
  p_items          jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user      uuid := auth.uid();
  v_address   public.user_addresses%rowtype;
  v_len       integer;
  v_valid     integer;
  v_distinct  integer;
  v_subtotal  bigint;
  v_order_id  uuid;
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  if p_payment_method is null or p_payment_method not in ('cod', 'upi') then
    raise exception 'invalid_order';
  end if;
  if p_payment_method = 'upi' then
    if p_upi_id is null or p_upi_id !~ '^[A-Za-z0-9._-]{2,100}@[A-Za-z]{2,64}$' then
      raise exception 'invalid_order';
    end if;
  elsif p_upi_id is not null then
    raise exception 'invalid_order';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' then
    raise exception 'invalid_order';
  end if;
  v_len := jsonb_array_length(p_items);
  if v_len < 1 or v_len > 40 then
    raise exception 'invalid_order';
  end if;

  -- Validate every line WITHOUT casting first (a bad value must yield invalid_order, not a cast error).
  select count(*) into v_valid
  from jsonb_array_elements(p_items) as e
  where jsonb_typeof(e) = 'object'
    and jsonb_typeof(e -> 'jewellery_item_id') = 'number' and (e ->> 'jewellery_item_id') ~ '^[1-9][0-9]{0,8}$'
    and jsonb_typeof(e -> 'price')             = 'number' and (e ->> 'price')             ~ '^[0-9]{1,9}$'
    and jsonb_typeof(e -> 'quantity')          = 'number' and (e ->> 'quantity')          ~ '^([1-9]|10)$'
    and jsonb_typeof(e -> 'name')              = 'string' and length(btrim(e ->> 'name')) between 1 and 200;
  if v_valid <> v_len then
    raise exception 'invalid_order';
  end if;

  select count(distinct (e ->> 'jewellery_item_id')::integer) into v_distinct
  from jsonb_array_elements(p_items) as e;
  if v_distinct <> v_len then
    raise exception 'invalid_order';
  end if;

  select sum(((e ->> 'price')::bigint) * ((e ->> 'quantity')::bigint)) into v_subtotal
  from jsonb_array_elements(p_items) as e;
  if v_subtotal is null or v_subtotal > 2147483647 then
    raise exception 'invalid_order';
  end if;

  select * into v_address from public.user_addresses where user_id = v_user;
  if not found then
    raise exception 'no_address';
  end if;

  insert into public.orders (user_id, address_snapshot, payment_method, upi_id, subtotal, total)
  values (v_user, to_jsonb(v_address), p_payment_method, p_upi_id, v_subtotal::integer, v_subtotal::integer)
  returning id into v_order_id;

  insert into public.order_items (order_id, jewellery_item_id, name, price, quantity)
  select v_order_id,
         (e ->> 'jewellery_item_id')::integer,
         btrim(e ->> 'name'),
         (e ->> 'price')::integer,
         (e ->> 'quantity')::integer
  from jsonb_array_elements(p_items) as e;

  return v_order_id;
end;
$$;

-- Functions are executable by PUBLIC by default, and Supabase also grants anon: close both, open only authenticated.
revoke all on function public.place_order(text, text, jsonb) from public;
revoke all on function public.place_order(text, text, jsonb) from anon;
grant execute on function public.place_order(text, text, jsonb) to authenticated;

-- Make the new function visible to the Supabase API immediately.
notify pgrst, 'reload schema';
