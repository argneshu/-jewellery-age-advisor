### Story 10.4: Clickable Jewellery Card

**File**: `docs/plans/stories/epic-10-story-10.4-Clickable-Jewellery-Card.md`

**Epic**: 10 - AURA SHOPPING FLOW | **ID**: 10.4 | **Date**: 2026-10-08 | **Jira**: LOCAL | **GitHub**: LOCAL | **BUILDID**: NO-CYCLE
**Helix**: Story 1.1 — solution 1080, document 5880 (local snapshot: `docs/helix/INDEX.md`; the Helix text is the base spec — read it first, it contains the full reference code)
**Wave**: 4
**Requires**: []
**Enables**: ["10.5"]
**Files Touched**:
  - aura/lib/use-favorite.ts
  - aura/lib/use-favorite.test.ts
  - aura/components/recommendations/JewelleryCard.tsx
**Roles Ref**: docs/requirements.md#roles--permissions-matrix — Guest + Authenticated User
**QA Candidate**: Yes — **Observable:** clicking a card opens `/product/{id}`; the heart still toggles favorites without navigating. **Mechanism:** `Link` wrapper + extracted `useFavorite` hook.

> **How to read this story.** The Helix story already holds the complete user story, implementation code and Definition of Done (same precedent as Story 7.3, which was implemented straight from Helix). This file records only what the local plan adds: ownership, order, and every **deviation from Helix** (D1–D9 in `docs/requirements.md`, architecture §10, patterns §E10). Where this file and Helix differ, **this file wins**.

#### 👤 User Reference

**Description**: Make each jewellery card open its product page when clicked, without breaking the favorite heart.

**Acceptance Criteria**:
- [ ] Entire card is wrapped in `<Link href={`/product/${item.id}`}>`; visuals unchanged (hover shadow allowed).
- [ ] Heart click and keyboard activation do not navigate (`preventDefault` + `stopPropagation`).
- [ ] Works on `/results` and `/favorites`.
- [ ] Favorite state/logic moved verbatim into `useFavorite(itemId)`; **zero behaviour change** to Epic 7 (auth check, `listFavorites`, optimistic toggle with rollback, login redirect preserving `redirectedFrom`).
- [ ] Existing `lib/favorites.test.ts` untouched and green.

#### 🤖 AI Agent Reference

**Deviations from Helix (apply these)**:
- [ADDED] hook extraction so Story 10.5 can reuse the heart (Helix 1.2 requires it but its snippet omits it).
- Helix `Link`-wraps-`Card` followed as written; keyboard/screen-reader behaviour of a button inside a link is checked in QA (architecture §10.13).

**UI/UX (from `docs/ui-ux/ui-ux-spec.md`, approved 2026-10-08)**:
- Heart hit area ≥44×44px below 1024px without changing its visual size; heart never navigates (mouse or keyboard).

**RBAC Enforcement**:
| Persona | Behaviour |
|---|---|
| Guest | heart → `/login?redirectedFrom=<current page>` |
| Authenticated User | heart toggles favorite |

**System responses + error cases**:
| Trigger | Response | Side-effect |
|---|---|---|
| Click card body | navigate to /product/{id} | — |
| Click heart | toggle/redirect, no navigation | favorites API called when signed in |

**Prerequisites**: Epic 10 requirements/architecture/patterns/data design approved; previous stories in `Requires` done; development (non-production) Supabase project in use (see plan prerequisite P0).

**Implementation Steps**:
1. Create `lib/use-favorite.ts` (`"use client"`): move state + effect + `handleToggleFavorite` out of `JewelleryCard`; export pure `buildLoginRedirect(pathname, query)` used by the toggle.
2. Write `lib/use-favorite.test.ts` for `buildLoginRedirect` first (with/without query, encoding).
3. Refactor `JewelleryCard` to use the hook; add the `Link` wrapper and heart event guards.
4. Verify visually/manually on `/results` and `/favorites` (click card, click heart, Tab+Enter on heart).

**Test Requirements**:
- `buildLoginRedirect`: no query → path only; with query → `path?query`; result is URI-encoded when placed in `/login?redirectedFrom=`.
- Regression: all 16 existing tests green.
- Manual: card click navigates (404 until 10.5 — expected); heart does not navigate; signed-in toggle persists; guest heart → `/login?redirectedFrom=…`.
- Quality gates: `npm run test` (all existing tests + new ones green), `npm run lint`, `npx tsc --noEmit`, `npm run build` clean; paste the actual command output into `docs/stories-implemented/story-10.4-review.md`.

**Out of Scope**:
- Product page (10.5); changing favorites API/lib.

**Completion Evidence**: _(filled when done — test output, curl/SQL output, review doc path)_
