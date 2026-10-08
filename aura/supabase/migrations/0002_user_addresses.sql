-- Epic 10, Story 10.1 (Helix 3.1) — user_addresses table + RLS
-- Source: docs/data/data-model-epic10.md. One delivery address per user (upsert on user_id).
-- Run once per environment, in order 0002 -> 0003 -> 0004. Non-production first (see docs/data/data-model-epic10.md).
-- Rollback: 0002_user_addresses_rollback.sql
-- Additive only: nothing existing is altered.

create table public.user_addresses (
  id            uuid        primary key default gen_random_uuid(),
  user_id       uuid        not null references auth.users(id) on delete cascade,
  full_name     text        not null,
  phone         text        not null,
  address_line1 text        not null,
  address_line2 text,
  city          text        not null,
  state         text        not null,
  pincode       text        not null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint user_addresses_user_id_key        unique (user_id),
  constraint user_addresses_phone_format       check (phone ~ '^[0-9]{10}$'),
  constraint user_addresses_pincode_format     check (pincode ~ '^[0-9]{6}$'),
  constraint user_addresses_text_lengths       check (
    length(btrim(full_name))     between 1 and 100 and
    length(btrim(address_line1)) between 1 and 200 and
    (address_line2 is null or length(address_line2) <= 200) and
    length(btrim(city))          between 1 and 100 and
    length(btrim(state))         between 1 and 100
  )
);

alter table public.user_addresses enable row level security;

create policy "Users can view their own address"
  on public.user_addresses for select
  using (auth.uid() = user_id);

create policy "Users can insert their own address"
  on public.user_addresses for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own address"
  on public.user_addresses for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Defense in depth: anonymous (not-logged-in) API callers get no table privileges at all.
revoke all on public.user_addresses from anon;
