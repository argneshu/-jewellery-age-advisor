### Story 10.7: Cart Page

**File**: `docs/plans/stories/epic-10-story-10.7-Cart-Page.md`

**Epic**: 10 - AURA SHOPPING FLOW | **ID**: 10.7 | **Date**: 2026-10-08 | **Jira**: LOCAL | **GitHub**: LOCAL | **BUILDID**: NO-CYCLE
**Helix**: Story 2.3 — solution 1080, document 5882 (local snapshot: `docs/helix/INDEX.md`; the Helix text is the base spec — read it first, it contains the full reference code)
**Wave**: 5
**Requires**: ["10.3"]
**Enables**: []
**Files Touched**:
  - aura/app/cart/page.tsx
  - aura/components/cart/CartItemRow.tsx
  - aura/components/cart/CartSummary.tsx
**Roles Ref**: docs/requirements.md#roles--permissions-matrix — Guest + Authenticated User (public page)
**QA Candidate**: Yes — **Observable:** full cart page; guests are sent to login at checkout.

> **How to read this story.** The Helix story already holds the complete user story, implementation code and Definition of Done (same precedent as Story 7.3, which was implemented straight from Helix). This file records only what the local plan adds: ownership, order, and every **deviation from Helix** (D1–D9 in `docs/requirements.md`, architecture §10, patterns §E10). Where this file and Helix differ, **this file wins**.

#### 👤 User Reference

**Description**: Let shoppers review their cart, change quantities, remove items and continue to checkout.

**Acceptance Criteria**:
- [ ] `/cart` lists every item with swatch, category, name, unit price, quantity stepper, line total, remove.
- [ ] − at quantity 1 removes the item; + stops at 10.
- [ ] Summary shows item count and subtotal; empty cart shows a friendly state with “Browse Jewellery” → `/`.
- [ ] The page waits for `isHydrated` before showing the empty state (no flash).
- [ ] Proceed to Checkout is disabled when empty; guests → `/login?redirectedFrom=/checkout`; signed-in users → `/checkout`.

#### 🤖 AI Agent Reference

**Deviations from Helix (apply these)**:
- [ADDED] hydration wait; quantity cap 10 (D1).

**UI/UX (from `docs/ui-ux/ui-ux-spec.md`, approved 2026-10-08)**:
- Two-line card-stack rows below 640px (swatch+name+remove / stepper+line total), single row from 640px; stepper and remove ≥44×44 hit areas with `aria-label` “Decrease/Increase quantity of <name>” and “Remove <name>”; when qty is 10 disable + and show “Maximum 10 per item”; prices `text-gold-deep`; render only the heading until `isHydrated`.

**RBAC Enforcement**:
| Persona | Behaviour |
|---|---|
| Guest | can view/edit cart; checkout click → login |
| Authenticated User | checkout click → `/checkout` |

**System responses + error cases**:
| Trigger | Response | Side-effect |
|---|---|---|
| Checkout click as guest | redirect to login | — |

**Prerequisites**: Epic 10 requirements/architecture/patterns/data design approved; previous stories in `Requires` done; development (non-production) Supabase project in use (see plan prerequisite P0).

**Implementation Steps**:
1. Create the three files per Helix 2.3.
2. Use `isHydrated` to avoid the empty-state flash.
3. Manual test as guest and signed-in.

**Test Requirements**:
- Manual: add 2 items, change qty, remove, empty state, guest vs signed-in checkout click; refresh keeps cart.
- Existing tests green.
- Quality gates: `npm run test` (all existing tests + new ones green), `npm run lint`, `npx tsc --noEmit`, `npm run build` clean; paste the actual command output into `docs/stories-implemented/story-10.7-review.md`.

**Out of Scope**:
- Coupons, delivery estimate, saved-for-later.

**Completion Evidence**: _(filled when done — test output, curl/SQL output, review doc path)_
