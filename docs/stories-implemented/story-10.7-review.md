# Story 10.7 — Cart Page — Review

**Date**: 2026-10-08 | **Helix**: Story 2.3 (doc 5882) | **Status**: ✅ Done — automated checks + browser-driven manual checks passed (see 'Manual-check evidence')

## What Was Implemented
- `aura/app/cart/page.tsx` (client, public): heading-only until `isHydrated`; empty state (“Your cart is empty” + “Browse Jewellery” → `/`); list + summary otherwise.
- `aura/components/cart/CartItemRow.tsx`: grid layout — one row ≥640px, two-line card stack below (swatch + name/price + remove / stepper + line total); stepper and remove have 44×44px hit areas with per-item `aria-label`s; `+` disabled at 10 with “Maximum 10 per item”; unit price `text-gold-deep`.
- `aura/components/cart/CartSummary.tsx`: item count, Subtotal (`text-gold-deep`), “Delivery is free on every order.”, **Proceed to Checkout** (disabled when empty/pending; guest → `/login?redirectedFrom=/checkout`; signed in → `/checkout`; double-click guarded by a ref).
- `aura/lib/cart.ts`: pure `itemCountLabel(n)` (+4 tests).

## Testing Summary (actual output)
```
npm run test          → Test Files 5 passed (5) | Tests 108 passed (108)   (104 before + 4 new)
npm run test:coverage → lib/ 93.75% stmts | 91.17% branch ; lib/cart.ts 100% | 94.73%
npm run lint / tsc    → clean          npm run build → ✓ Compiled successfully ; ƒ /cart in the route list
SSR /cart → HTTP 200: heading “Your Cart” only; no “Your cart is empty” flash; no item list before hydration
Headless Chrome (real rendering, screenshots reviewed), seeded cart [{16×1},{7×10},{1×2}]:
   375px  → two-line card stack, no horizontal overflow; header badge “9+”
   900px  → single row per item (swatch · name/price · stepper · line total · ×)
   item with qty 10 → “Maximum 10 per item” shown and “+” disabled
   totals: 13 items · Subtotal ₹2,37,000 (= 185,000 + 45,000 + 7,000 ✔)
   empty cart → empty state with bag icon and “Your cart is empty”
Console on /cart: hydration warnings 0; Base UI `nativeButton` warnings = 2 (the pre-existing Sign in / Register buttons only — my “Browse Jewellery” button uses nativeButton={false} and adds none)
Temporary seed page deleted (ls public | grep -c __tmp → 0)
```

## DoD Evidence
### Gate 1 — Spec Echo
| # | Requirement | Proof |
|---|---|---|
| AC1 | `/cart` renders all items | `app/cart/page.tsx` list; screenshot (3 items) |
| AC2 | Row: swatch, name, category, unit price, qty stepper (− / +), line total, remove (×) | `CartItemRow.tsx` (swatch, category, name, `formatINR(price)`, stepper, `formatINR(price*qty)`, × button); screenshot |
| AC3 | − at quantity 1 removes the item | `CartItemRow.tsx` `updateQty(id, qty-1)` → reducer removes ≤0 (`lib/cart.test.ts` “removes the item when qty is 0”); **click check pending** |
| AC4 | Summary shows subtotal and item count | `CartSummary.tsx`; screenshot “13 items / ₹2,37,000” |
| AC5 | Proceed: disabled when empty; guest → `/login?redirectedFrom=/checkout`; signed-in → `/checkout` | `CartSummary.tsx` (`disabled={items.length === 0 \|\| pending}`, push targets); **click check pending** |
| AC6 | Empty cart: friendly state + “Browse Jewellery” → `/` | `app/cart/page.tsx`; empty-state screenshot |
| UI/UX | heading-only until `isHydrated` | SSR: heading only, no flash |
| UI/UX | card-stack <640px, row ≥640px | screenshots at 375 / 900 |
| UI/UX | 44×44 hit areas + per-item aria-labels (“Decrease/Increase quantity of <name>”, “Remove <name>”, group “Quantity of <name>”) | `CartItemRow.tsx` (`h-11 w-11`, labels) |
| UI/UX | “+” disabled at 10 + “Maximum 10 per item” | `CartItemRow.tsx` `atMax`; screenshot |
| UI/UX | prices `text-gold-deep` | `CartItemRow.tsx`, `CartSummary.tsx`; screenshot |
| Deviation | Summary says delivery is free (Helix: “calculated at checkout”) — consistent with Story 4.2 | `CartSummary.tsx` |

### Gate 2 — Negative-Space
| Rule | Check | Result |
|---|---|---|
| No coupons / saved-for-later / delivery estimate (out of scope) | none present | ✅ |
| Must not change earlier epics | `git diff --stat -- lib/recommendation-engine.ts lib/favorites.ts app/api data supabase \| wc -l` | **0** |
| No “empty cart” flash before hydration | SSR check | ✅ |
| No TODO/FIXME/console | grep | **0** |
| No new console warnings | dump-dom console grep | hydration 0; nativeButton = 2 pre-existing only |

### Gate 3 — Contract Consistency
`CartItemRow` calls `updateQty(id, qty±1)` / `removeItem(id)` ↔ reducer rules (cap 10, ≤0 removes) ↔ UI affordances (`+` disabled at `MAX_QTY`, message). `CartSummary` totals come from `useCart().totalItems/totalPrice` (same source as the header badge). Checkout destination strings match the Story 10.9 routing matrix (`/login?redirectedFrom=/checkout`).

## Observations
- Existing `Button render={<Link/>}` usages in `AuthHeader` still emit the Base UI `nativeButton` warning (pre-existing; follow-up).
- `/checkout` does not exist yet (Stories 10.9/10.10): clicking Proceed currently lands on a 404 — expected.

## Manual check list (all passed — see evidence below) (browser, ~4 minutes)
1. Add 2–3 items from product pages, open `/cart` (header icon). Use **−** at quantity 1 → the item disappears; **+** up to 10 → button greys out and “Maximum 10 per item” appears; **×** removes; refresh → cart and header badge unchanged.
2. Empty the cart → “Your cart is empty” and **Browse Jewellery** → goes to `/`.
3. As a guest with items, **Proceed to Checkout** → `/login?redirectedFrom=%2Fcheckout`; sign in → you land on `/checkout` (404 page is expected for now).
4. Signed in, **Proceed to Checkout** → `/checkout` (404 expected for now).
5. Tab through a row: focus ring visible on −, +, ×.

## Manual-check evidence (2026-10-08) — automated browser run
Run with Playwright driving real Google Chrome (headless) against the local dev server (port 3000) and the dev Supabase project, using two throwaway users created and **deleted** by the script (cascade removes their rows). Result: **34/34 checks passed** (two consecutive clean runs). Covered: 10.7 cart clicks + guest/signed-in Proceed + keyboard focus ring; 10.8 add form + save; 10.9 routing matrix; 10.10 three sections, totals, UPI `bad` disabled / `me@okaxis` enabled, COD double-click → exactly 1 order (total = catalog math, 2 items, address snapshot), tamper (forged price/name in `aura_cart` → catalog values shown, stored total 185000, `upi_id` stored), empty cart → `/cart`; 10.11 confirmation content, `#SHORTID`, heading focus, cart badge gone, `/cart` empty, UPI line, no overflow at 375px, junk id / unknown UUID / other user's order → 404, guest → login.
Limits: the tamper test altered `localStorage` (not a hand-forged Server Action request — that is covered by the `priceOrder` unit tests); the focus-ring check is a computed-style heuristic, not a visual review.

## Next Steps
After the checks → mark 10.7 ✅ → **10.8 (Address Form & Server Action)** — first story that needs the dev database (10.1 first, then 10.8).
