---
helix_id: "5884"
title: "Story 4.1 — Orders DB Migration"
solution_id: "1080"
synced_at: "2026-10-08"
helix_metadata: { artifact_type: "story", visibility: "team", lifecycle_state: "CURRENT", version: 1, parent_registry_id: 5877, created_by: "Argneshu Gupta", created_at: "2026-10-08T10:15:00.712774+00:00", updated_by: null, updated_at: "2026-10-08T10:15:00.712774+00:00" }
---

# Story 4.1 — Orders DB Migration

**Epic:** Aura Shopping Flow
**Feature:** Secure Checkout
**Points:** 1
**Status:** TO DO
**Depends On:** —

---

## User Story

> As a developer, I need `orders` and `order_items` tables in Supabase with proper RLS so the checkout page can save completed orders securely.

---

## Acceptance Criteria

- [ ] `orders` table: id, user_id, address_snapshot (JSONB), payment_method (cod/upi CHECK), upi_id, subtotal, total, status (CHECK), created_at
- [ ] `order_items` table: id, order_id (FK → orders), jewellery_item_id, name, price, quantity
- [ ] RLS enabled on both tables
- [ ] CHECK constraints on `payment_method` and `status`
- [ ] Migration file: `0003_orders.sql`

---

## Files to Create

```
-jewellery-age-advisor/aura/supabase/migrations/0003_orders.sql
```

---

## Migration SQL

```sql
-- supabase/migrations/0003_orders.sql

create table public.orders (
  id               uuid        primary key default gen_random_uuid(),
  user_id          uuid        not null references auth.users(id) on delete cascade,
  address_snapshot jsonb       not null,
  payment_method   text        not null check (payment_method in ('cod', 'upi')),
  upi_id           text,
  subtotal         integer     not null,
  total            integer     not null,
  status           text        not null default 'confirmed'
                               check (status in ('confirmed','processing','shipped','delivered','cancelled')),
  created_at       timestamptz not null default now()
);

alter table public.orders enable row level security;

create policy "Users can view their own orders"
  on public.orders for select using (auth.uid() = user_id);

create policy "Users can insert their own orders"
  on public.orders for insert with check (auth.uid() = user_id);

create table public.order_items (
  id                 uuid    primary key default gen_random_uuid(),
  order_id           uuid    not null references public.orders(id) on delete cascade,
  jewellery_item_id  integer not null,
  name               text    not null,
  price              integer not null,
  quantity           integer not null default 1 check (quantity > 0)
);

alter table public.order_items enable row level security;

create policy "Users can view their own order items"
  on public.order_items for select
  using (exists (select 1 from public.orders o where o.id = order_items.order_id and o.user_id = auth.uid()));

create policy "Users can insert their own order items"
  on public.order_items for insert
  with check (exists (select 1 from public.orders o where o.id = order_items.order_id and o.user_id = auth.uid()));
```

---

## Why `address_snapshot` is JSONB

Stored as a snapshot at order time — if the user later updates their address, historical orders still show the address used when placing them. A FK would reflect the updated address incorrectly.

---

## How to Run

1. Supabase → **SQL Editor** → paste → **Run**
2. Verify both tables appear in Table Editor with RLS shield icons

---

## Definition of Done

- [ ] `0003_orders.sql` created
- [ ] Migration run successfully in Supabase
- [ ] Both tables visible with correct columns and RLS active
- [ ] CHECK constraints verified

---

## Referenced Paths

### High Relevance
- `-jewellery-age-advisor/aura/supabase/migrations/0001_favorites.sql` - Migration and RLS convention

### Low Relevance
- `-jewellery-age-advisor/aura/lib/supabase/server.ts` - Will query these tables in Story 4.2
