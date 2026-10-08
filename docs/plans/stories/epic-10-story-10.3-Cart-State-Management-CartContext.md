### Story 10.3: Cart State Management (CartContext)

**File**: `docs/plans/stories/epic-10-story-10.3-Cart-State-Management-CartContext.md`

**Epic**: 10 - AURA SHOPPING FLOW | **ID**: 10.3 | **Date**: 2026-10-08 | **Jira**: LOCAL | **GitHub**: LOCAL | **BUILDID**: NO-CYCLE
**Helix**: Story 2.1 — solution 1080, document 5886 (local snapshot: `docs/helix/INDEX.md`; the Helix text is the base spec — read it first, it contains the full reference code)
**Wave**: 4
**Requires**: []
**Enables**: ["10.5", "10.6", "10.7", "10.9"]
**Files Touched**:
  - aura/lib/cart.ts
  - aura/lib/cart.test.ts
  - aura/context/CartContext.tsx
  - aura/app/layout.tsx
  - aura/app/globals.css
**Roles Ref**: docs/requirements.md#roles--permissions-matrix — Guest + Authenticated User (cart is browser-local)
**QA Candidate**: Yes — **Observable:** items added stay after refresh/navigation. **Mechanism:** `aura_cart` in localStorage via `CartProvider`.

> **How to read this story.** The Helix story already holds the complete user story, implementation code and Definition of Done (same precedent as Story 7.3, which was implemented straight from Helix). This file records only what the local plan adds: ownership, order, and every **deviation from Helix** (D1–D9 in `docs/requirements.md`, architecture §10, patterns §E10). Where this file and Helix differ, **this file wins**.

#### 👤 User Reference

**Description**: Give the whole app a shopping cart that survives page changes and refreshes, without needing an account.

**Acceptance Criteria**:
- [ ] `useCart()` exposes `items, addItem, removeItem, updateQty, clearCart, totalItems, totalPrice, isHydrated`.
- [ ] Adding an existing item increments quantity (max 10); `updateQty(id, ≤0)` removes; unknown ids ignored.
- [ ] Cart hydrates from `aura_cart` once on mount; persistence does **not** write before hydration; malformed/tampered storage → empty cart; prices/names rebuilt from the catalog.
- [ ] All localStorage access in try/catch.
- [ ] `CartProvider` wraps `<AuthHeader/>` and `{children}` in `app/layout.tsx`; `useCart()` outside the provider throws `"useCart must be used within a CartProvider"`.
- [ ] No hydration mismatch warning in the console on any existing page.

#### 🤖 AI Agent Reference

**Deviations from Helix (apply these)**:
- [CORRECTED] Helix's two-effect persistence overwrites storage with `[]` before hydration and loses the cart under React StrictMode — replaced by an `isHydrated` gate (architecture AD-1).
- [ADDED] quantity cap 10; defensive parse that rebuilds from `JEWELLERY_ITEMS`; reducer + parser are pure functions in `lib/cart.ts`.

**UI/UX (from `docs/ui-ux/ui-ux-spec.md`, approved 2026-10-08)**:
- Add the two accessibility tokens to `aura/app/globals.css` (`--aura-gold-deep: #8a6a1f`, `--aura-rose-deep: #9d5560` + `@theme` mappings `--color-gold-deep`, `--color-rose-deep`) — foundation for all later screens. No existing token changes.

**RBAC Enforcement**:
No role-differentiated access — single actor (browser-local state).

**System responses + error cases**:
| Trigger | Response | Side-effect |
|---|---|---|
| Corrupt localStorage | empty cart | none |
| localStorage unavailable | in-memory cart works, not persisted | none |

**Prerequisites**: Epic 10 requirements/architecture/patterns/data design approved; previous stories in `Requires` done; development (non-production) Supabase project in use (see plan prerequisite P0).

**Implementation Steps**:
1. TDD: write `lib/cart.test.ts` first (reducer + `parseStoredCart` + `cartTotals`), watch it fail.
2. Implement `lib/cart.ts` (`CartItem`, `MAX_QTY`, `cartReducer`, `parseStoredCart`, `serializeCart`, `cartTotals`).
3. Implement `context/CartContext.tsx` per architecture §10.7 (HYDRATE sets `isHydrated`; persist effect returns while `!isHydrated`).
4. Wrap providers in `app/layout.tsx`.
5. Manual: set `aura_cart` by hand, refresh in dev (StrictMode) — cart must survive; set garbage — app still loads.

**Test Requirements**:
- add new / add existing / cap at 10 / remove / update qty / qty 0 and negative removes / clear / unknown id ignored / HYDRATE replaces.
- parseStoredCart: null, invalid JSON, non-array, element not object, unknown id, duplicate ids merged+capped, quantity 0/11/1.5/'2', forged price replaced by catalog price.
- cartTotals matches manual sums.
- Coverage ≥85% on `lib/cart.ts` (`npm run test:coverage`).
- Quality gates: `npm run test` (all existing tests + new ones green), `npm run lint`, `npx tsc --noEmit`, `npm run build` clean; paste the actual command output into `docs/stories-implemented/story-10.3-review.md`.

**Out of Scope**:
- Cross-tab sync, merge on login, server-side cart, stock.

**Completion Evidence**: _(filled when done — test output, curl/SQL output, review doc path)_
