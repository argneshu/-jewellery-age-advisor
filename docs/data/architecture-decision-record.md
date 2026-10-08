# Data Architecture Decision Record — Epic 10

**Date**: 2026-10-08 | **Status**: Approved (user, 2026-10-08) | **Scope**: Supabase Postgres tables `user_addresses`, `orders`, `order_items`, function `place_order`

| ID | Decision | Alternatives considered | Rationale |
|----|----------|-------------------------|-----------|
| AD-D0 | Run a **scoped** `aire-data-design` (discovery, model, contract, verification, privacy, rollback); skip platform phases (pipelines, orchestration, catalog, streaming, cutover). | Full 12-phase workflow | The workflow targets data platforms; this change is three OLTP tables. User chose the scoped option. |
| AD-D1 | Keep Helix SQL as the base; add **only additive tightening** (CHECKs, `status='confirmed'` insert predicate, unique `(order_id, item)`, index, privilege revokes). | Use Helix SQL verbatim | Defense in depth against the public anon key; no behavioural change for the app path. |
| AD-D2 | Atomic write via `place_order()` `SECURITY INVOKER`, empty `search_path`. | 2 client inserts; `SECURITY DEFINER`; service-role key | Atomic; RLS stays authoritative; no new secret. |
| AD-D3 | Keep Helix `on delete cascade` from `auth.users` on all three tables. | `on delete set null` + anonymise; restrict | Matches Helix and right-to-erasure; **but** it deletes order history when an account is deleted. Acceptable only while no real sales/tax records exist. **Revisit before real payments.** |
| AD-D4 | Address stored as a JSON **snapshot** on the order (Helix) in addition to the live `user_addresses` row. | FK to address row | Historical orders must not change when the address is edited. |
| AD-D5 | Money as integer rupees; timestamps `timestamptz` (UTC) (MOD8). | numeric/paise | Consistent with catalog and `formatINR`. |
| AD-D6 | Prices cannot be verified by the DB (catalog is a TS file) — residual risk R1 accepted for COD/UPI-id capture. | Seeded `jewellery_prices` table + drift test | Out of approved scope; required before real payments. |
| AD-D7 | Migrations are numbered plain SQL with paired rollback files, applied once per environment, non-production first; verification script `epic10-verification.sql` is a gate. | Supabase CLI migrations | Matches the repo's existing manual practice (`0001`); no new tooling. |
| AD-D8 | `order_items` index = the `unique (order_id, jewellery_item_id)` constraint (leading column `order_id`); no separate index (supersedes the extra index mentioned in architecture §10.6 M4). | Extra index | Redundant otherwise. |
