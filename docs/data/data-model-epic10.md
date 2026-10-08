# Data Model, Contract & Verification Plan — Epic 10

**Date**: 2026-10-08 | **Author**: AIRE_DATA_ENGINEER | **Status**: Approved (user, 2026-10-08)
**Inputs**: `docs/requirements.md` (Epic 10), `docs/architecture/design/02-…` (Epic 10 §10.6), `docs/helix/documents/story-3-1-*.md`, `story-4-1-*.md`, `story-4-2-*.md`.
**Final SQL (single source of truth until Stories 10.1/10.2 copy it verbatim into `aura/supabase/migrations/`)**: `docs/data/sql/`
**Verification script**: `docs/data/epic10-verification.sql` (**not yet executed** — see §6)

## 1. Conceptual / logical model (MOD1)
A **User** (Supabase `auth.users`) has at most one **Delivery Address** and places many **Orders**; each Order has one or more **Order Items** (one per catalog item) and a frozen **address snapshot**. Catalog items are not a table (static file), so `order_items.jewellery_item_id` is a plain integer with name/price **snapshots**.

## 2. Physical model — see ER diagram in `02-target-architecture-brownfield.md` §10.6 and the SQL files
| Table | Key / constraints (beyond Helix) | RLS |
|-------|----------------------------------|-----|
| `user_addresses` | PK `id`; `unique(user_id)`; CHECK phone `^[0-9]{10}$`, pincode `^[0-9]{6}$`, text lengths | select/insert/update own (`auth.uid() = user_id`, update also `with check`); no delete policy; `anon` revoked |
| `orders` | PK `id`; CHECK payment_method, status, amounts ≥ 0, snapshot is object, UPI id present ⇔ `upi`, UPI format; index `(user_id, created_at desc)` | select own; insert own **and** `status = 'confirmed'`; no update/delete policy; update/delete/truncate revoked; `anon` revoked |
| `order_items` | PK `id`; FK `order_id` cascade; CHECK item id > 0, name 1–200, price ≥ 0, quantity 1–10; `unique(order_id, jewellery_item_id)` | select/insert only through own order (exists-subquery); update/delete revoked; `anon` revoked |
| `place_order()` | SECURITY INVOKER; execute: `authenticated` only | n/a (inherits caller's RLS) |

Apply order: **0002 → 0003 → 0004**. Rollback order: **0004 → 0003 → 0002**.

## 3. Contract — `public.place_order(p_payment_method text, p_upi_id text, p_items jsonb) returns uuid`
| Input | Rule |
|-------|------|
| `p_payment_method` | `'cod'` or `'upi'` |
| `p_upi_id` | required and matching `^[A-Za-z0-9._-]{2,100}@[A-Za-z]{2,64}$` iff `upi`; must be NULL for `cod` |
| `p_items` | JSON array, 1–40 elements; each `{jewellery_item_id: int 1..999999999, name: string 1–200 trimmed, price: int 0..999999999, quantity: int 1..10}`; no duplicate ids; computed subtotal ≤ 2,147,483,647 |
| Returns | the new `orders.id` (uuid) |
| Errors (message text) | `not_authenticated` (SQLSTATE 28000), `invalid_order` (any rule above), `no_address` (caller has no `user_addresses` row). Table-level CHECK/RLS violations surface as their native SQLSTATEs and are mapped by the app to a generic message. |
| Guarantees | one transaction: order + all items, or nothing; `total = subtotal` (free delivery) computed in SQL; address snapshot copied from the caller's own row; `status = 'confirmed'` |
| Not guaranteed | that `price`/`name` match the catalog (residual risk R1 / AD-D6) |

Backward compatibility (SE1): purely additive; no existing object changes. Future changes to the function go in a new numbered migration using `create or replace` with the same signature.

## 4. Data classification & privacy (PRV1/2/5/12-lite)
| Column(s) | Class | Handling |
|-----------|-------|----------|
| `user_addresses.full_name, phone, address_line1/2, city, state, pincode` | confidential (PII) | RLS own-rows only; never logged; shown only to the owner |
| `orders.address_snapshot` | confidential (PII copy) | same; immutable |
| `orders.upi_id` | confidential (payment identifier; not a credential) | same; shown on the confirmation page to the owner only; never logged |
| `orders.subtotal/total/status/payment_method/created_at`, `order_items.*` | internal | RLS own-rows |
| ids (`id`, `user_id`, `order_id`) | internal | — |
Encryption at rest/in transit: provided by Supabase (platform). Column-level encryption: not applied (no high-sensitivity PAN/SSN). Non-production data must be synthetic (PRV11) — the verification script uses fake users. DPIA: lightweight — address/phone/UPI id are collected for fulfilment only; erasure by account deletion (cascade, AD-D3).

## 5. Migration safety plan
1. Copy SQL files from `docs/data/sql/` into `aura/supabase/migrations/` **verbatim** (Stories 10.1, 10.2); add the rollback files beside them.
2. Apply to a **non-production** Supabase project or branch first (never first to production): 0002, 0003, 0004 in order, each once.
3. Run `epic10-verification.sql` (§6) on that database; require every `PASS` line and the final `ALL EPIC 10 DB TESTS PASSED`; paste the output into the story review doc.
4. Production: only on the user's explicit go-ahead (D8), after a backup / point-in-time marker, applying the same three files once each; then re-run a reduced check (RLS two-user test + one test order, deleted afterwards).
5. Record the applied state per environment in `docs/status.md` (a policy migration must not be applied twice).
6. If anything fails: run the rollbacks in reverse order (data loss warning in each file), fix in a **new** number, never edit an applied file.

## 6. Verification plan (gate)
`docs/data/epic10-verification.sql` covers: own address insert/select (T1); address isolation, cross-user update, unique per user (T2–T3); address CHECKs (T4); anon denied everywhere incl. `place_order` (T5); `no_address` (T6); COD success with server-computed total, snapshot and status (T7); UPI rules (T8); 20+ invalid-cart shapes all → `invalid_order`, never a cast error (T9); atomic rollback on forced failure (T10); orders immutable and forged status rejected (T11); order isolation between users (T12); orders CHECKs (T13); cascade on user delete (T14). The whole script runs in one transaction and rolls back.
**Honest status**: authored without access to a running Postgres (Docker daemon was not running), so it has **not been executed yet**. It must be run (Docker `postgres:15` with the stub block, or a Supabase non-production project) before Story 10.1 is accepted; any SQL or script defect found then is fixed in `docs/data/` first.

## 7. Data quality checks (ongoing, manual — no tooling exists)
Order integrity query to run after the first real orders: orders without items (`0 rows`), `orders.subtotal <> sum(items.price*quantity)` (`0 rows`), items without order (`0 rows`, enforced by FK).
```sql
select o.id from public.orders o left join public.order_items i on i.order_id = o.id where i.id is null;
select o.id from public.orders o join public.order_items i on i.order_id = o.id group by o.id, o.subtotal having sum(i.price * i.quantity) <> o.subtotal;
```

## 8. Defect log
| Date | Found by | Defect | Fix |
|------|----------|--------|-----|
| 2026-10-08 | Story 10.2 API check on the dev project (O2a, O3 bad-UPI) | UPI pattern `{2,256}` exceeds Postgres' regex repetition limit (255) → `2201B invalid regular expression: invalid repetition count(s)`; broke `place_order` for every UPI order **and** the `orders_upi_consistency` CHECK for any non-null `upi_id`. The SQL parser could not catch it (Postgres compiles regexes at run time). | Handle length 2–100 (`^[A-Za-z0-9._-]{2,100}@[A-Za-z]{2,64}$`) in 0003, 0004 and every doc; new guard test `aura/supabase/migrations.test.ts` fails on any repetition count > 255. Fixed in `docs/data/sql/` first, re-copied, dev DB re-applied via rollback + corrected migrations (production never saw the defect). |
