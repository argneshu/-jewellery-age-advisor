### Story 10.2: Orders DB Migration

**File**: `docs/plans/stories/epic-10-story-10.2-Orders-DB-Migration-and-place_order.md`

**Epic**: 10 - AURA SHOPPING FLOW | **ID**: 10.2 | **Date**: 2026-10-08 | **Jira**: LOCAL | **GitHub**: LOCAL | **BUILDID**: NO-CYCLE
**Helix**: Story 4.1 — solution 1080, document 5884 (local snapshot: `docs/helix/INDEX.md`; the Helix text is the base spec — read it first, it contains the full reference code)
**Wave**: 4
**Requires**: []
**Enables**: ["10.10"]
**Files Touched**:
  - aura/supabase/migrations/0003_orders.sql
  - aura/supabase/migrations/0003_orders_rollback.sql
  - aura/supabase/migrations/0004_place_order_fn.sql
  - aura/supabase/migrations/0004_place_order_fn_rollback.sql
**Roles Ref**: docs/requirements.md#roles--permissions-matrix — Authenticated User (own orders only); Guest denied
**QA Candidate**: No — database only; verified by the SQL script.

> **How to read this story.** The Helix story already holds the complete user story, implementation code and Definition of Done (same precedent as Story 7.3, which was implemented straight from Helix). This file records only what the local plan adds: ownership, order, and every **deviation from Helix** (D1–D9 in `docs/requirements.md`, architecture §10, patterns §E10). Where this file and Helix differ, **this file wins**.

#### 👤 User Reference

**Description**: Create the order tables and the single database function that saves an order and its items together, so an order can never exist without its items.

**Acceptance Criteria**:
- [ ] `orders` and `order_items` exist exactly as in `docs/data/sql/0003_orders.sql` (RLS: select own, insert own with `status='confirmed'`; no update/delete).
- [ ] `public.place_order(text, text, jsonb)` exists exactly as in `0004_place_order_fn.sql`: `SECURITY INVOKER`, empty `search_path`, executable by `authenticated` only.
- [ ] All 14 tests in `docs/data/epic10-verification.sql` print PASS and the script ends with `ALL EPIC 10 DB TESTS PASSED`.
- [ ] Files in `aura/supabase/migrations/` are byte-identical to `docs/data/sql/`; applied to the **development** project only.

#### 🤖 AI Agent Reference

**Deviations from Helix (apply these)**:
- [ADDED] `place_order` function (D3, atomic write); CHECKs; `status='confirmed'` insert predicate; unique `(order_id, jewellery_item_id)`; privilege revokes (AD-D1, AD-D8).

**RBAC Enforcement**:
| Persona | Permission | Enforcement |
|---|---|---|
| Authenticated User | `order:create-own`, `order:read-own` | RLS + `place_order` uses `auth.uid()` |
| Guest | none | `anon` revoked; function not executable by anon |

**System responses + error cases**:
| Trigger | Response | Side-effect |
|---|---|---|
| place_order, valid cart + address | order id returned | order + items stored together |
| place_order, no address | error `no_address` | nothing stored |
| place_order, invalid cart | error `invalid_order` | nothing stored |
| Failure after order insert | error | order rolled back |

**Prerequisites**: Epic 10 requirements/architecture/patterns/data design approved; previous stories in `Requires` done; development (non-production) Supabase project in use (see plan prerequisite P0).

**Implementation Steps**:
1. Prerequisite: 10.1 applied in the same dev project.
2. Copy the four SQL files into `aura/supabase/migrations/` unchanged.
3. Apply `0003` then `0004`, each once, in the dev SQL editor.
4. Run the full `docs/data/epic10-verification.sql`; paste the complete output (14 PASS lines + final line) into the review doc. If any SQL/script defect appears, fix it in `docs/data/` **first**, re-copy, and re-run (on a fresh dev database if a policy was already created).
5. Record 'applied to dev' (not prod) in `docs/status.md`.

**Test Requirements**:
- SQL tests T1–T14 (RLS isolation, anon denied, `no_address`, COD + UPI success with server-computed total, 20+ invalid carts → `invalid_order`, atomic rollback, orders immutable, forged status rejected, CHECKs, cascade).
- Existing Vitest suite unchanged and green.
- Quality gates: `npm run test` (all existing tests + new ones green), `npm run lint`, `npx tsc --noEmit`, `npm run build` clean; paste the actual command output into `docs/stories-implemented/story-10.2-review.md`.

**Out of Scope**:
- Calling `place_order` from the app (10.10).
- Database-side price verification (residual risk R1).
- Production apply.

**Completion Evidence**: _(filled when done — test output, curl/SQL output, review doc path)_
