### Story 10.5: Product Detail Page

**File**: `docs/plans/stories/epic-10-story-10.5-Product-Detail-Page.md`

**Epic**: 10 - AURA SHOPPING FLOW | **ID**: 10.5 | **Date**: 2026-10-08 | **Jira**: LOCAL | **GitHub**: LOCAL | **BUILDID**: NO-CYCLE
**Helix**: Story 1.2 — solution 1080, document 5879 (local snapshot: `docs/helix/INDEX.md`; the Helix text is the base spec — read it first, it contains the full reference code)
**Wave**: 5
**Requires**: ["10.3", "10.4"]
**Enables**: ["10.7"]
**Files Touched**:
  - aura/app/product/[id]/page.tsx
  - aura/app/product/[id]/ProductDetail.tsx
**Roles Ref**: docs/requirements.md#roles--permissions-matrix — Guest + Authenticated User (public page)
**QA Candidate**: Yes — **Observable:** a product page with Add to Cart and a favorite heart. **Mechanism:** static pages for all 40 items + `useCart().addItem`.

> **How to read this story.** The Helix story already holds the complete user story, implementation code and Definition of Done (same precedent as Story 7.3, which was implemented straight from Helix). This file records only what the local plan adds: ownership, order, and every **deviation from Helix** (D1–D9 in `docs/requirements.md`, architecture §10, patterns §E10). Where this file and Helix differ, **this file wins**.

#### 👤 User Reference

**Description**: Show a full page for each piece of jewellery with an Add to Cart button.

**Acceptance Criteria**:
- [ ] `/product/1`…`/product/40` render; `/product/999` and `/product/abc` return 404 (`dynamicParams = false` + `generateStaticParams` for the 40 catalog ids).
- [ ] Shows gradient swatch, category, name, INR price, style chip, age range, tag chips.
- [ ] Add to Cart calls `addItem`, then shows “Added to cart ✓” + “View Cart →” (`/cart`).
- [ ] Favorite heart present using `useFavorite` (same behaviour as the card).
- [ ] Back uses `router.back()`; when there is no in-app history it goes to `/`.
- [ ] `npm run build` statically generates 40 product pages.

#### 🤖 AI Agent Reference

**Deviations from Helix (apply these)**:
- [CORRECTED] 37 → 40 items.
- [ADDED] favorite heart (AC existed in Helix, missing from its code); back-fallback to `/`.

**UI/UX (from `docs/ui-ux/ui-ux-spec.md`, approved 2026-10-08)**:
- Price/age/links use `text-gold-deep` (not `text-gold`); two columns ≥768, single column below with full-width Add to Cart; “Added to cart ✓” in an `aria-live="polite"` region (`role="status"`); back control ≥44px.

**RBAC Enforcement**:
Public route — no role-differentiated access.

**System responses + error cases**:
| Trigger | Response | Side-effect |
|---|---|---|
| Unknown id | 404 | — |
| Add to Cart | confirmation shown | cart updated + persisted |

**Prerequisites**: Epic 10 requirements/architecture/patterns/data design approved; previous stories in `Requires` done; development (non-production) Supabase project in use (see plan prerequisite P0).

**Implementation Steps**:
1. Create `page.tsx` (Server Component, `dynamicParams = false`, `generateStaticParams`, `notFound()` guard).
2. Create `ProductDetail.tsx` per Helix 1.2 + heart via `useFavorite` + back fallback.
3. Build and curl 1..40 (200) and 999/abc (404); paste output.

**Test Requirements**:
- curl loop status codes; `next build` page count.
- Manual: add to cart → badge (after 10.6) / localStorage `aura_cart`; heart toggles; back button.
- Coverage N/A (no pure logic) — documented.
- Quality gates: `npm run test` (all existing tests + new ones green), `npm run lint`, `npx tsc --noEmit`, `npm run build` clean; paste the actual command output into `docs/stories-implemented/story-10.5-review.md`.

**Out of Scope**:
- Image gallery, reviews, stock, quantity picker.

**Completion Evidence**: _(filled when done — test output, curl/SQL output, review doc path)_
