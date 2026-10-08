# Story 10.6 — Cart Icon in Header — Review

**Date**: 2026-10-08 | **Helix**: Story 2.2 (doc 5883) | **Status**: ✅ Done (2026-10-08) — automated + headless-browser checks passed; signed-in header check PASSED (user, 2026-10-08)

## What Was Implemented
- `aura/components/cart/CartIconLink.tsx` (new, client): `ShoppingBag` link to `/cart`, 44×44px hit area, focus ring, rose-deep badge (white 12px text), accessible name from the exact count.
- `aura/lib/cart.ts`: pure `cartBadgeText(n)` (`""` / `1`–`9` / `9+`) and `cartLinkLabel(n)` (`View cart` / `View cart, 1 item` / `View cart, N items`); 12 new tests in `lib/cart.test.ts`.
- `aura/components/auth/AuthHeader.tsx`: `<CartIconLink />` added as the first child of the right-hand group; signed-in email hidden below 640px (`hidden … sm:inline`); stays an async Server Component.

## Testing Summary (actual output)
```
npm run test          → Test Files 5 passed (5) | Tests 104 passed (104)   (92 before + 12 new)
npm run test:coverage → lib/ 93.7% stmts | 91% branch ; lib/cart.ts 100% stmts | 94.54% branch
npm run lint / tsc    → clean
npm run build         → ✓ Compiled successfully ; ✓ Generating static pages (50/50)
```
**Real-browser evidence (headless Chrome against the dev server, screenshots reviewed):**
- 375px-wide iframe, guest: cart icon + “Sign in” + “Register” on **one row, no horizontal overflow**.
- Cart seeded via localStorage `[{id:1,q:2},{id:7,q:1}]` → badge **“3”**; seeded `[{id:1,q:10},{id:7,q:3}]` (13 items) → badge **“9+”**; empty cart → no badge. Same at 375px and 900px widths.
- Console on `/results`: React **hydration warnings: none** (this also closes the open Story 10.3 check #1 and AC6). The only console issues (“2 Issues” overlay) are Base UI warnings about `Button render={<Link/>}` (“expected a native <button> because `nativeButton` is true”) from the existing Sign in / Register buttons (Epic 5) — **pre-existing, unrelated to Epic 10** (logged as follow-up).
- Temporary seed page (`public/__tmp-seed.html`) used for the screenshots was **deleted** (`ls public | grep -c __tmp` → 0).

## DoD Evidence
### Gate 1 — Spec Echo
| # | Requirement | Proof |
|---|---|---|
| AC1 | `ShoppingBag` (lucide) in the top-right nav of `AuthHeader` | `CartIconLink.tsx` (`<ShoppingBag size={22}/>`), `AuthHeader.tsx` right group first child; screenshots |
| AC2 | Badge with `totalItems` when items exist; gone when empty | `cartBadgeText` tests (0 → `""`); screenshots (3, 9+, none) |
| AC3 | Caps at “9+” | tests `10→"9+"`, `42→"9+"`; screenshot with 13 items |
| AC4 | Click navigates to `/cart` | `href="/cart"` (404 until Story 10.7 — expected) |
| AC5 | Works for guests and signed-in users | guest verified in browser; **signed-in pending** (below) |
| Step | Client component so AuthHeader keeps its server boundary | `CartIconLink.tsx:1` `"use client"`; `AuthHeader.tsx` still `async` and unchanged otherwise |
| UI/UX | Badge `bg-rose-deep`, white 12px text | `CartIconLink.tsx` badge classes (`bg-rose-deep … text-xs … text-white`) |
| UI/UX | `aria-label="View cart, N items"` (“View cart” at 0) | `cartLinkLabel` tests (0/1/3/27/invalid) |
| UI/UX | 44×44 hit area | `h-11 w-11` on the link |
| UI/UX | Email hidden <640px, Log out stays, no overflow at 375px | `AuthHeader.tsx` `hidden … sm:inline`; 375px screenshot (guest); **signed-in layout pending** |

### Gate 2 — Negative-Space
| Rule | Check | Result |
|---|---|---|
| No mini-cart dropdown (out of scope) | none in component | ✅ |
| Must not change Epic 5–8 logic | `git diff --stat -- lib/recommendation-engine.ts lib/favorites.ts app/api data supabase \| wc -l` | **0** |
| No TODO/FIXME/console | grep | **0** |
| Badge text must not be the only count source for screen readers | badge `aria-hidden`, count carried by link `aria-label` | ✅ |

### Gate 3 — Contract Consistency
`useCart().totalItems` (10.3) → `cartBadgeText(n)` (visual) and `cartLinkLabel(n)` (accessible name): both derived from the same number; the visual cap (“9+”) never leaks into the accessible name (test). Before hydration `totalItems = 0` on server and first client render ⇒ no mismatch (console verified).

## Observations (not changed)
- At 375px the header tagline wraps to ~5 lines because the right group needs the room; layout is correct but tall. Candidate polish for the UI/UX follow-up: shorten/hide the tagline below 640px.
- Pre-existing Base UI `nativeButton` warnings (Sign in / Register) — candidate follow-up (`nativeButton={false}` on `Button render={<Link/>}`).

## Manual check (browser) — RESULT: PASSED (user confirmed 2026-10-08)
Sign in as `usera@test.dev` and open `http://localhost:3000/results?age=34&relationship=wife&occasion=wedding&budget=200000`:
1. Header shows the cart icon, **no email text on a narrow window (<640px)**, and the **Log out** button; on a wide window the email is shown.
2. Click a card → Add to Cart on the product page → the header badge shows **1** immediately; refresh → still **1**.
3. Click the cart icon → goes to `/cart` (a 404 page until Story 10.7 is expected).

## Next Steps
After the check → mark 10.6 ✅ → **10.7 (Cart Page)**.
