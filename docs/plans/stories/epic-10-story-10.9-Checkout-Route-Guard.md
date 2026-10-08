### Story 10.9: Checkout Route Guard

**File**: `docs/plans/stories/epic-10-story-10.9-Checkout-Route-Guard.md`

**Epic**: 10 - AURA SHOPPING FLOW | **ID**: 10.9 | **Date**: 2026-10-08 | **Jira**: LOCAL | **GitHub**: LOCAL | **BUILDID**: NO-CYCLE
**Helix**: Story 3.3 — solution 1080, document 5885 (local snapshot: `docs/helix/INDEX.md`; the Helix text is the base spec — read it first, it contains the full reference code)
**Wave**: 6
**Requires**: ["10.3", "10.8"]
**Enables**: ["10.10"]
**Files Touched**:
  - aura/lib/supabase/route-rules.ts
  - aura/lib/supabase/route-rules.test.ts
  - aura/lib/supabase/middleware.ts
  - aura/app/checkout/page.tsx
**Roles Ref**: docs/requirements.md#roles--permissions-matrix — Authenticated User; Guest redirected
**QA Candidate**: Yes — **Observable:** routing matrix (guest → login; no address → address form; address → checkout).

> **How to read this story.** The Helix story already holds the complete user story, implementation code and Definition of Done (same precedent as Story 7.3, which was implemented straight from Helix). This file records only what the local plan adds: ownership, order, and every **deviation from Helix** (D1–D9 in `docs/requirements.md`, architecture §10, patterns §E10). Where this file and Helix differ, **this file wins**.

#### 👤 User Reference

**Description**: Make sure only signed-in shoppers with a saved address can reach checkout, and send everyone else to the right place.

**Acceptance Criteria**:
- [ ] Routing: logged out → `/login?redirectedFrom=/checkout`; logged in without address → `/checkout/address`; with address → checkout renders.
- [ ] `/checkout` and `/order-confirmation` are protected by the proxy (D6) in addition to in-page checks; `/cart`, `/product/*` stay public.
- [ ] `isProtectedPath` is a pure function; look-alike prefixes (`/checkout-foo`) are not protected; Epic 5 behaviour unchanged (`/favorites`, `/api/favorites`, `/login`, `/register`).
- [ ] `app/checkout/page.tsx` at this point is a **guard-only page** (renders a minimal “Checkout” heading); 10.10 extends the same file.
- [ ] A user with an address is never blocked from `/checkout/address`.

#### 🤖 AI Agent Reference

**Deviations from Helix (apply these)**:
- [CORRECTED] Helix 3.3 vs 4.2 overlap resolved: 3.3 creates the guard-only page, 4.2 extends it.
- [ADDED] proxy protection (D6) via `lib/supabase/route-rules.ts`.

**RBAC Enforcement**:
| Persona | `/checkout` | `/checkout/address` | `/order-confirmation/*` |
|---|---|---|---|
| Guest | → login | → login | → login |
| Auth, no address | → address | form | allowed (own orders) |
| Auth + address | renders | form | allowed |

**System responses + error cases**:
| Trigger | Response | Side-effect |
|---|---|---|
| Guest hits /checkout | 307 to /login?redirectedFrom=/checkout | — |

**Prerequisites**: Epic 10 requirements/architecture/patterns/data design approved; previous stories in `Requires` done; development (non-production) Supabase project in use (see plan prerequisite P0).

**Implementation Steps**:
1. TDD: `route-rules.test.ts` (all protected/public/auth-only cases) then implement `route-rules.ts`.
2. Make `middleware.ts` import it (behaviour for old paths identical).
3. Create the guard-only `app/checkout/page.tsx`.
4. curl checks: 307 for guests on `/checkout`, `/checkout/address`, `/order-confirmation/x`; 200 for `/cart`, `/product/1`; signed-in matrix tested manually.

**Test Requirements**:
- route-rules: each protected prefix and sub-path, exact match, public paths, `/checkout-foo`, `/favoritesX`, auth-only paths.
- Coverage ≥85% (target 100%) on `route-rules.ts`.
- curl output pasted; manual three-state routing matrix.
- Quality gates: `npm run test` (all existing tests + new ones green), `npm run lint`, `npx tsc --noEmit`, `npm run build` clean; paste the actual command output into `docs/stories-implemented/story-10.9-review.md`.

**Out of Scope**:
- Checkout content (10.10).

**Completion Evidence**: 193/193 tests; route-rules.ts 100% coverage; tsc/lint/build clean; guest curl 307s. Review: `docs/stories-implemented/story-10.9-review.md`. Signed-in matrix confirmed by user.
