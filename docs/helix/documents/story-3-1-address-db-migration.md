---
helix_id: "5878"
title: "Story 3.1 — Address DB Migration"
solution_id: "1080"
synced_at: "2026-10-08"
helix_metadata: { artifact_type: "story", visibility: "team", lifecycle_state: "CURRENT", version: 1, parent_registry_id: 5877, created_by: "Argneshu Gupta", created_at: "2026-10-08T10:15:00.417499+00:00", updated_by: null, updated_at: "2026-10-08T10:15:00.417499+00:00" }
---

# Story 3.1 — Address DB Migration

**Epic:** Aura Shopping Flow
**Feature:** Address Management
**Points:** 1
**Status:** TO DO
**Depends On:** —

---

## User Story

> As a developer, I need a `user_addresses` table in Supabase with proper RLS so the address form can save and retrieve delivery addresses securely.

---

## Acceptance Criteria

- [ ] `user_addresses` table created with all required columns
- [ ] RLS enabled — users can only read/insert/update their own address
- [ ] `unique (user_id)` constraint enforces one address per user (enables upsert)
- [ ] Migration file follows naming convention: `0002_user_addresses.sql`
- [ ] `types/address.ts` created with `UserAddress` interface
- [ ] Migration manually run in Supabase SQL editor

---

## Files to Create

```
-jewellery-age-advisor/aura/supabase/migrations/0002_user_addresses.sql
-jewellery-age-advisor/aura/types/address.ts
```

---

## Migration SQL

```sql
-- supabase/migrations/0002_user_addresses.sql
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
  unique (user_id)
);

alter table public.user_addresses enable row level security;

create policy "Users can view their own address"
  on public.user_addresses for select using (auth.uid() = user_id);

create policy "Users can insert their own address"
  on public.user_addresses for insert with check (auth.uid() = user_id);

create policy "Users can update their own address"
  on public.user_addresses for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

## TypeScript Type

```ts
// types/address.ts
export interface UserAddress {
  id: string;
  userId: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
}
```

---

## How to Run

1. Open Supabase → **SQL Editor**
2. Paste and click **Run**
3. Verify `user_addresses` appears in **Table Editor** with RLS shield icon

---

## Definition of Done

- [ ] Migration file created and run in Supabase
- [ ] Table and RLS policies confirmed active
- [ ] `types/address.ts` created
- [ ] No column conflicts with existing tables

---

## Referenced Paths

### High Relevance
- `-jewellery-age-advisor/aura/supabase/migrations/0001_favorites.sql` - Migration and RLS convention to follow

### Low Relevance
- `-jewellery-age-advisor/aura/lib/supabase/server.ts` - Will query this table in Story 3.2
