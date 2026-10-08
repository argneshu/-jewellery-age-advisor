### Story 10.6: Cart Icon in Header

**File**: `docs/plans/stories/epic-10-story-10.6-Cart-Icon-in-Header.md`

**Epic**: 10 - AURA SHOPPING FLOW | **ID**: 10.6 | **Date**: 2026-10-08 | **Jira**: LOCAL | **GitHub**: LOCAL | **BUILDID**: NO-CYCLE
**Helix**: Story 2.2 — solution 1080, document 5883 (local snapshot: `docs/helix/INDEX.md`; the Helix text is the base spec — read it first, it contains the full reference code)
**Wave**: 5
**Requires**: ["10.3"]
**Enables**: []
**Files Touched**:
  - aura/components/cart/CartIconLink.tsx
  - aura/components/auth/AuthHeader.tsx
**Roles Ref**: docs/requirements.md#roles--permissions-matrix — Guest + Authenticated User
**QA Candidate**: Yes — **Observable:** bag icon with count badge in the header on every page.

> **How to read this story.** The Helix story already holds the complete user story, implementation code and Definition of Done (same precedent as Story 7.3, which was implemented straight from Helix). This file records only what the local plan adds: ownership, order, and every **deviation from Helix** (D1–D9 in `docs/requirements.md`, architecture §10, patterns §E10). Where this file and Helix differ, **this file wins**.

#### 👤 User Reference

**Description**: Always show the cart icon and how many items are in it.

**Acceptance Criteria**:
- [ ] `ShoppingBag` icon links to `/cart` for guests and signed-in users.
- [ ] Rose badge shows `totalItems`; hidden at 0; “9+” above 9.
- [ ] `AuthHeader` remains an async Server Component; icon is a small client component.
- [ ] Header does not overflow at ≤375px width.

#### 🤖 AI Agent Reference

**Deviations from Helix (apply these)**:
- None (Helix story followed as written).

**UI/UX (from `docs/ui-ux/ui-ux-spec.md`, approved 2026-10-08)**:
- Badge: `bg-rose-deep` with white **12px** text; link `aria-label="View cart, N items"` (or “View cart” at 0); 44×44 hit area; below 640px hide the email text in `AuthHeader` (Log out stays); verify no overflow at 375px.

**RBAC Enforcement**:
No role-differentiated access — single actor.

**System responses + error cases**:
| Trigger | Response | Side-effect |
|---|---|---|
| Cart empty | no badge | — |

**Prerequisites**: Epic 10 requirements/architecture/patterns/data design approved; previous stories in `Requires` done; development (non-production) Supabase project in use (see plan prerequisite P0).

**Implementation Steps**:
1. Create `CartIconLink.tsx` per Helix 2.2.
2. Add it as the first child of the right-hand button group in `AuthHeader.tsx`.
3. Check at 375px width and with 0/1/9/10+ items.

**Test Requirements**:
- Manual badge states (0, 1, 9, 10); signed-in and signed-out header; mobile width.
- Existing tests green.
- Quality gates: `npm run test` (all existing tests + new ones green), `npm run lint`, `npx tsc --noEmit`, `npm run build` clean; paste the actual command output into `docs/stories-implemented/story-10.6-review.md`.

**Out of Scope**:
- Mini-cart dropdown.

**Completion Evidence**: _(filled when done — test output, curl/SQL output, review doc path)_
