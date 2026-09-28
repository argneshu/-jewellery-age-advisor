-- Epic 2, Story 2.2 — favorites table + RLS
-- Migration Document §3.3. Run this in the Supabase SQL editor (or via `supabase db push`)
-- against your Aura project once it's provisioned.

create table public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  jewellery_item_id integer not null,
  created_at timestamptz not null default now(),
  unique (user_id, jewellery_item_id)
);

alter table public.favorites enable row level security;

create policy "Users can view their own favorites"
  on public.favorites for select
  using (auth.uid() = user_id);

create policy "Users can insert their own favorites"
  on public.favorites for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own favorites"
  on public.favorites for delete
  using (auth.uid() = user_id);
