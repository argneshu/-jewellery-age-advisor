# Story 10.3 — Cart State Management (CartContext) — Review

**Date**: 2026-10-08 | **Helix**: Story 2.1 (doc 5886) | **Status**: ✅ Done (2026-10-08) — automated gates passed; manual check 2 confirmed by the user; check 1 (console hydration warning) verified later in headless Chrome during Story 10.6: no hydration warnings

## What Was Implemented
- `aura/lib/cart.ts` (new, pure): `CartItem`, `MAX_QTY=10`, `CART_STORAGE_KEY="aura_cart"`, `cartReducer`, `parseStoredCart`, `serializeCart`, `cartTotals`, `initialCartState`.
- `aura/context/CartContext.tsx` (new): `CartProvider`, `useCart()` with `isHydrated`; hydrates once, persists only after hydration.
- `aura/app/layout.tsx`: `<CartProvider>` wraps `<AuthHeader/>` + `{children}`.
- `aura/app/globals.css`: tokens `--aura-gold-deep #8a6a1f`, `--aura-rose-deep #9d5560` + `@theme` colours (UI/UX spec; no existing token changed).
- `aura/lib/cart.test.ts` (new, 46 tests). Also earlier this session: `@vitest/coverage-v8` + `test:coverage` script (approved dev dependency).

## Files Changed
`aura/lib/cart.ts`, `aura/lib/cart.test.ts`, `aura/context/CartContext.tsx`, `aura/app/layout.tsx`, `aura/app/globals.css` (+ `package.json`, `package-lock.json`, `vitest.config.mts` for coverage tooling).

## Patterns Applied
Pure logic in `lib/` + co-located Vitest (patterns §E10.9); no new runtime dependency; Next.js context-provider pattern verified against `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md` ("Context providers"); breadcrumb comments for every Helix deviation.

## Testing Summary (actual output)
```
npm run test           → Test Files 3 passed (3) | Tests 62 passed (62)   (16 pre-existing + 46 new)
npm run test:coverage  → lib/cart.ts  100% stmts | 93.02% branch | 100% funcs | 100% lines  (uncovered branches: lines 72, 93, 134 = defensive `??`/null-guards)
npm run lint           → no output (0 errors, 0 warnings)
npx tsc --noEmit       → no output (clean)
npm run build          → ✓ Generating static pages (10/10); routes /, /results, /login, /favorites, /register, /api/favorites, /auth/callback built
curl http://localhost:3000/ /results /login → 200; /favorites → 307 /login?redirectedFrom=%2Ffavorites (Epic 5 behaviour unchanged); no "must be used within" / error text in HTML
```
Coverage ≥85% target met for the new module (100% / 93%).

## DoD Evidence
### Gate 1 — Spec Echo
| # | Requirement (AC / Step / constraint) | Proof |
|---|---|---|
| AC1 | `useCart()` exposes `items, addItem, removeItem, updateQty, clearCart, totalItems, totalPrice, isHydrated` | `context/CartContext.tsx:30-39` (interface), `:78-90` (value) |
| AC2a | Existing item → quantity increments (cap 10), no duplicates | `lib/cart.ts:66-77`; tests "increments quantity…", "never exceeds MAX_QTY" ✅ |
| AC2b | `updateQty(id, ≤0)` removes | `lib/cart.ts:87-89`; test `it.each([0,-1,-100])` ✅ |
| AC2c | Unknown ids ignored | `lib/cart.ts:65` (ADD) and `:85` (UPDATE); tests "ignores an item whose id is not in the catalog", "ignores a quantity update for an item not in the cart" ✅ |
| AC3a | Hydrates from `aura_cart` once on mount | `context/CartContext.tsx:56-58` (effect with `[]` deps) |
| AC3b | Persistence does **not** write before hydration | `context/CartContext.tsx:61` (`if (!state.isHydrated) return;`); state flag `lib/cart.ts:41,62` |
| AC3c | Malformed/tampered storage → empty cart; prices/names rebuilt from catalog | `lib/cart.ts:111-137`; tests: invalid JSON, non-array, non-objects, unknown/non-integer ids, bad quantities, forged price/name ✅ |
| AC4 | All localStorage access in try/catch | `context/CartContext.tsx:45-49` (read), `:62-66` (write); JSON.parse guarded `lib/cart.ts:114-118` |
| AC5a | `CartProvider` wraps `<AuthHeader/>` and `{children}` | `app/layout.tsx:30-33` |
| AC5b | `useCart()` outside provider throws exact message | `context/CartContext.tsx:96` (no component test harness per D5; string verified by grep) |
| AC6 | No hydration-mismatch warning on any existing page | Design: first server and client render both use `initialCartState` (empty); no browser-only value is read during render. **Console check pending (browser)** — see below |
| Step 1 | TDD: tests written first and watched fail | `vitest run lib/cart.test.ts` → "Test Files 1 failed … no tests" before `lib/cart.ts` existed; then 46 pass |
| Step 2 | `lib/cart.ts` exports (`CartItem`, `MAX_QTY`, `cartReducer`, `parseStoredCart`, `serializeCart`, `cartTotals`) | `lib/cart.ts:14-15,59,111,139,143` |
| Step 3 | `CartContext.tsx` per architecture §10.7 (HYDRATE sets `isHydrated`; persist effect returns while `!isHydrated`) | `context/CartContext.tsx:56-67`, `lib/cart.ts:61-62` |
| Step 4 | Wrap providers in `app/layout.tsx` | `app/layout.tsx:4,30-33` |
| Step 5 | Manual refresh test (StrictMode) / garbage in storage | **Pending (browser)** — see below |
| UI/UX | Tokens `gold-deep`, `rose-deep` added, no existing token changed | `app/globals.css:19,22,74,77`; `git diff` shows additions only |
| Quality | ≥85% coverage on `lib/cart.ts`; lint 0; tsc clean; build clean | outputs above |
| Deviation notes | Helix two-effect bug replaced; cap 10; catalog-rebuilt lines; only `{id, quantity}` persisted (ADDED) | breadcrumb comments `lib/cart.ts:5-12`, `context/CartContext.tsx:23-29` |

### Gate 2 — Negative-Space Check
| Rule | Check | Result |
|---|---|---|
| Out of scope: cross-tab sync / server cart / merge on login / Supabase | `grep -rn "addEventListener\|\"storage\"\|supabase\|fetch(" lib/cart.ts context/CartContext.tsx \| wc -l` | **0** |
| No TODO/FIXME/console in delivered code | `grep -rn "TODO\|FIXME\|console\." …` | **0** |
| Must not change Epic 5–7 code / catalog / migrations | `git diff --stat -- lib/recommendation-engine.ts lib/favorites.ts app/api data/jewellery.ts supabase` | **empty** |
| Must not change existing tokens | `git diff app/globals.css` | only `+` lines |
| Must never trust client price | tests "builds a new line from the catalog, ignoring caller-supplied price/name" and "replaces a forged price/name/category" | ✅ |

### Gate 3 — Contract Consistency
| Reducer action (`lib/cart.ts`) | Context method (`CartContext.tsx`) | Helix 2.1 AC list |
|---|---|---|
| `ADD_ITEM` | `addItem(item)` | `addItem()` ✅ |
| `REMOVE_ITEM` | `removeItem(id)` | `removeItem()` ✅ |
| `UPDATE_QTY` | `updateQty(id, qty)` | `updateQty()` ✅ |
| `CLEAR_CART` | `clearCart()` | `clearCart()` ✅ |
| `HYDRATE` | internal (mount effect) | `HYDRATE` action ✅ |
| `cartTotals` | `totalItems`, `totalPrice` | ✅ |
| (added) `isHydrated` | `isHydrated` | required by architecture/UI-UX (not in Helix) ✅ intentional |
Storage contract: `serializeCart` writes `[{id, quantity}]`; `parseStoredCart` accepts that and Helix-style full-item arrays (extra fields ignored) — round-trip test ✅. No silent defaults: unknown ids/quantities are dropped or clamped by tested rules.

## Challenges Encountered
- `AGENTS.md` warns this Next.js version differs from training data → read the bundled docs section on context providers before writing the provider (pattern confirmed).
- Decision: `parseStoredCart` **drops** quantity 0/1.5/"2"/null lines but **clamps** quantity 11 → 10 (a too-big number is a plausible edit; a malformed one is not). Documented in the doc comment and tests.

## Deviations from Plan
- Persist `{id, quantity}` only (plan said keep Helix storage key; format is an implementation detail and avoids stale prices). Helix's manual smoke test (`localStorage.setItem("aura_cart", "[...]")` with full items) still works.

## Manual checks (browser) — RESULT: check 2 PASSED (user pasted `localStorage.getItem("aura_cart")` = `[{"id":1,"quantity":2},{"id":7,"quantity":1}]` after two refreshes in dev/StrictMode); check 1 not explicitly reported — QA to confirm no hydration warning
1. `cd aura && npm run dev`, open `http://localhost:3000/results`, open DevTools → Console. **Expect no hydration-mismatch warning.**
2. Console: `localStorage.setItem("aura_cart", JSON.stringify([{id:1,quantity:2},{id:7,quantity:1}]))` then refresh **twice** (dev mode = StrictMode). **Expect** `localStorage.getItem("aura_cart")` still returns both lines. Then `localStorage.setItem("aura_cart","garbage")`, refresh: app loads normally.
(There is no UI that shows the cart yet — Stories 10.6/10.7 add the icon/page — so check #2 is done through `localStorage.getItem`.)

## Lessons Learned
`lib/` pure-module approach lets the whole cart contract be proven without a DOM harness; the only things left to a browser are hydration/StrictMode behaviours.

## Next Steps
After you confirm the two manual checks → mark 10.3 ✅ and continue with **10.4 (Clickable Jewellery Card)**.
