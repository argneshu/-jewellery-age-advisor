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
