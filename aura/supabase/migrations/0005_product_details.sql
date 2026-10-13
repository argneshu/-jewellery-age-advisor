-- Product details table (Epic 10 enhancement): description, highlights and spec fields shown on the
-- product page. One row per catalogue item; product_id matches the id in data/jewellery.ts.
-- Run once per environment, then 0006_product_details_seed.sql. Non-production first.
-- Rollback: 0005_product_details_rollback.sql
-- Additive only: nothing existing is altered.

create table public.product_details (
  product_id        integer     primary key,
  description       text        not null,
  highlights        text[]      not null default '{}',
  material          text,
  purity            text,
  weight_grams      numeric(7,2),
  stone             text,
  dimensions        text,
  care_instructions text,
  updated_at        timestamptz not null default now(),
  constraint product_details_product_id_positive check (product_id > 0),
  constraint product_details_description_length  check (length(btrim(description)) between 1 and 2000),
  constraint product_details_weight_positive     check (weight_grams is null or weight_grams > 0)
);

alter table public.product_details enable row level security;

-- Public catalogue data: anyone (guests included) can read, nobody can write through the API.
-- Edits are made by an admin in the Supabase dashboard / SQL editor (service role bypasses RLS).
create policy "Anyone can read product details"
  on public.product_details for select
  using (true);

revoke insert, update, delete on public.product_details from anon, authenticated;
