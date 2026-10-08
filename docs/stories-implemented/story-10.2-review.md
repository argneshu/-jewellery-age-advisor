# Story 10.2 — Orders DB Migration (+ `place_order`) — Review

**Date**: 2026-10-08 | **Helix**: Story 4.1 (doc 5884) | **Status**: ✅ Done (2026-10-08) — corrected migrations applied to the **development** project (auradev) only; API-level checks all PASSED after one defect was found and fixed

## What Was Implemented
- `aura/supabase/migrations/0003_orders.sql`, `0004_place_order_fn.sql` (+ `_rollback` files) — byte-identical to `docs/data/sql/` (`cmp` verified): `orders`, `order_items` (RLS: select own / insert own, `status='confirmed'`; no update/delete; CHECKs; unique `(order_id, jewellery_item_id)`; index) and `public.place_order(text, text, jsonb)` (`SECURITY INVOKER`, empty `search_path`, execute for `authenticated` only).
- `docs/data/verify/api-check-0003-0004-orders.mjs` — ~55-check API verification run by the user (passwords never in chat).
- `aura/supabase/migrations.test.ts` — static guard test over all migrations (new, see defect below).
- `docs/data/sql/dev-reapply-0003-0004.sql` — one-transaction dev-only repair script (rollback 0004 → rollback 0003 → corrected 0003 → corrected 0004).

## Defect found and fixed (honest account)
First run of the API check: **2 FAIL** — `O2a UPI order` and `O3 bad UPI id` → `400 2201B invalid regular expression: invalid repetition count(s)`. Cause: UPI pattern `{2,256}` exceeds Postgres' regex repetition limit (255); it broke `place_order` for every UPI order and the `orders_upi_consistency` CHECK for any non-null `upi_id`. The SQL parser did not catch it (Postgres compiles regexes at run time); the live check did. **Fix**: handle length 2–100 (`^[A-Za-z0-9._-]{2,100}@[A-Za-z]{2,64}$`) in 0003, 0004, requirements D2, data model, and story 10.10's test list; guard test added (red on 0003/0004 before the fix, green after); dev database repaired through rollback + corrected migrations in one transaction. Production never received the faulty files. Logged in `docs/data/data-model-epic10.md` §8.

## Testing Summary (actual output)
```
First API run (before fix):  41 PASS · 2 FAIL (O2a, O3 bad-UPI) · 1 SKIP (O0 no_address)
Guard test: supabase/migrations.test.ts → 2 failures on 0003/0004 (expected '{2,256}'), then after the fix:
npm run test → Test Files 6 passed (6) | Tests 120 passed (120)   (108 before + 12 new guard-test cases)
Parser: all migrations + the combined dev script parse with libpg-query (PostgreSQL 17 grammar)
Second API run (after reapply on auradev): user reports “all passed” (0 failed)
```
Covered by the API run: COD + UPI orders, DB-computed total (5500) / status / address snapshot / items; 23 invalid-cart shapes → `invalid_order`; 40-line cart accepted; anonymous denied (function + tables); cross-user isolation (orders, items, insert-into-other's-order); orders/items immutable (UPDATE/DELETE denied); forged `delivered` status rejected; table CHECKs (UPI consistency, negative subtotal, array snapshot, item quantity 11); unique `(order_id, item)`.
Not in the API run (by design): **atomic rollback on a forced failure** (SQL test T10 in `docs/data/epic10-verification.sql`) — plpgsql functions are single transactions; T10 remains an optional SQL-editor check. `O0 no_address` status in the second run was not reported (first run skipped it).

## DoD Evidence
### Gate 1 — Spec Echo
| # | Requirement | Proof |
|---|---|---|
| AC1 | `orders` with id, user_id, address_snapshot (JSONB), payment_method (cod/upi CHECK), upi_id, subtotal, total, status (CHECK), created_at | `0003_orders.sql`; O1b, O8b–O8d |
| AC2 | `order_items` with id, order_id (FK), jewellery_item_id, name, price, quantity | `0003_orders.sql`; O1c |
| AC3 | RLS enabled on both | policies in `0003`; O5, O6a–c |
| AC4 | CHECKs on payment_method and status | `orders_payment_method_check`, `orders_status_check`; O8a (status), O8b |
| AC5 | Migration file `0003_orders.sql` | `aura/supabase/migrations/` |
| Added | `place_order()` atomic, invoker, grants | `0004`; O1a–O3b, O4 |
| Added | All 14 SQL tests / API equivalents pass | API run (all passed); T10 optional |
### Gate 2 — Negative-Space
| Rule | Check | Result |
|---|---|---|
| Orders immutable from the client | O7a–O7d | ✅ |
| No forged status | O8a | ✅ |
| Anonymous has no access | O4, O5 | ✅ |
| No production change | script refuses `lexujp…`; `.env.local` → auradev | ✅ |
| Regex limit never exceeded again | `supabase/migrations.test.ts` | ✅ |
### Gate 3 — Contract Consistency
`place_order` error messages (`invalid_order`, `no_address`, `not_authenticated`) ↔ planned `mapPlaceOrderError` in `lib/checkout.ts` (Story 10.10); UPI rule in SQL (2–100 @ 2–64) ↔ planned `validateUpiId` (same pattern) ↔ requirements D2 (updated). Item bounds (qty 1–10, ≤ 40 lines, price ≥ 0) identical in SQL, CHECKs and `priceOrder` plan.

## Next Steps
Optional before release: run T10 (atomic rollback) in the SQL editor; run O0 (`no_address`). Next story: **10.8**.
