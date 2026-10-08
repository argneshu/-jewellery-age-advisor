# Story 10.5 — Product Detail Page — Review

**Date**: 2026-10-08 | **Helix**: Story 1.2 (doc 5879) | **Status**: ✅ Done (2026-10-08) — automated gates passed; all 6 browser checks PASSED (user, 2026-10-08)

## What Was Implemented
- `aura/lib/catalog.ts` (new, pure): `getCatalogItem(id)`, `findItemByRouteId(raw)` (only `^[1-9][0-9]{0,8}$` → no `01`, `1.0`, `1e1`, `-1`, spaces). `lib/cart.ts` now reuses `getCatalogItem` (Reusability Check; its 46 tests unchanged and green).
- `aura/app/product/[id]/page.tsx` (Server Component): `dynamicParams = false`, `generateStaticParams` (40 ids), `generateMetadata` (title `"<name> — Aura"`), `notFound()` for anything else.
- `aura/app/product/[id]/ProductDetail.tsx` (client): gradient swatch + heart (shared `useFavorite`), category, name, `text-gold-deep` price, style/age/tag chips (a `<ul>`), Add to Cart (gradient Button), “Added to cart ✓” + “View Cart →” in an `aria-live="polite"` `role="status"` region, Back (≥44px; `router.back()`, falls back to `/` when `history.length ≤ 1`), “Maximum 10 per item” guard when 10 already in the cart.
- Tests: `aura/lib/catalog.test.ts` (26 cases).

## Testing Summary (actual output)
```
npm run test          → Test Files 5 passed (5) | Tests 92 passed (92)   (66 before + 26 new)
npm run test:coverage → lib/ 93.38% stmts | 89.77% branch ; lib/cart.ts 100/93 ; catalog.ts 100%
npm run lint          → 0 errors / 0 warnings          npx tsc --noEmit → clean
npm run build         → ✓ Compiled successfully ; ✓ Generating static pages (50/50)  [was 10/10 → +40 product pages]
                        route list now includes ƒ /product/[id]
HTTP (dev server): /product/1 … /product/40 → 40 × 200, 0 non-200
                   /product/41 /999 /0 /abc /01 /1.0 /1e1 /-1 → all 404
SSR of /product/16: <title>Polki Bridal Necklace Set — Aura</title>; price rendered with text-gold-deep;
   Add to Cart button, heart button (aria-label), Back button, role="status" region present;
   "Added to cart" NOT shown initially; 6 chips; exactly one <h1> ("Aura", from the header) + one <h2> (product name)
```

## DoD Evidence
### Gate 1 — Spec Echo
| # | Requirement | Proof |
|---|---|---|
| AC1 | `/product/[id]` renders for any valid item id | 40/40 HTTP 200 (above); `page.tsx:13-15` |
| AC2 | Unknown id → `notFound()` (404) | `page.tsx:33-35`; 8 malformed/unknown ids → 404 (above); `catalog.test.ts` |
| AC3 | Shows image (gradient fallback), category, name, INR price, style, age range, tags | `ProductDetail.tsx:60-100`; SSR check above |
| AC4 | Prominent “Add to Cart” (gradient, full-width on mobile) | `ProductDetail.tsx:113-116` (`variant="gradient" className="w-full"`) |
| AC5 | Click → `addItem()`, inline “Added to cart ✓” + “View Cart →” `/cart` | `:36-44` (handler), `:120-134`; **browser check pending** |
| AC6 | Favourite heart with same logic as the card | `:24,63-79` via `useFavorite` (same hook as `JewelleryCard`) |
| AC7 | Back via `router.back()` | `:30-36`; fallback to `/` added (UI/UX) |
| AC8 | `generateStaticParams()` exported (all items) | `page.tsx:13`; build 10→50 static pages = +40 (catalog has 40, not 37 — CORRECTED) |
| DoD | No TypeScript errors | `tsc --noEmit` clean |
| UI/UX | `text-gold-deep` prices/links; 2 cols ≥768, 1 col below; full-width button; `role=status`/`aria-live`; back ≥44px | `:87,109,126` / `:57` (`md:grid-cols-2`) / `:113` / `:120` / `:54` (`min-h-11`) |
| Local | “Maximum 10 per item” guard (D1) | `:28,103-112` (`atMax`) — browser check pending |
| Reuse | One catalog lookup shared with the cart | `lib/catalog.ts`; `lib/cart.ts` imports `getCatalogItem` |

### Gate 2 — Negative-Space
| Rule | Check | Result |
|---|---|---|
| Must not touch Epic 5–8 code, API, migrations, catalog data | `git diff --stat -- lib/recommendation-engine.ts lib/favorites.ts app/api data supabase` | empty |
| Only plain integer ids accepted | `catalog.test.ts` (`01`, `1.0`, `1e1`, `-1`, ` 1`, `0x1`, `%31`, …) + HTTP 404 checks | ✅ |
| No quantity picker / image gallery / reviews (out of scope) | none in `ProductDetail.tsx` | ✅ |
| No second `<h1>` on the page | SSR check: 1 h1 (header) + 1 h2 | ✅ |
| No TODO/FIXME/console | grep | 0 |

### Gate 3 — Contract Consistency
`ProductDetail` → `addItem({id,name,category,price,imagePath,imageAlt})` ↔ `CartItemInput` (type-checked) ↔ reducer builds the line **from the catalog**, so the page cannot affect the stored price (10.3 tests). `findItemByRouteId` (route) ↔ `getCatalogItem` (cart) share one map. Hook contract `{isFavorited, toggleFavorite}` ↔ same use as the card.

## Challenges / Decisions
- Helix used `h1` for the product title; the header already renders the page `h1`, and existing pages use `h2` → used `h2` (documented in code).
- Build shows the route as `ƒ` (root layout reads cookies) while 40 pages are still pre-generated (static page count 10→50); Helix's “statically generate” AC is met in the generate sense only.
- Back fallback uses `history.length` (imperfect when a new tab arrived from another site) — acceptable, noted.

## Manual checks (browser) — RESULT: all 6 PASSED (user confirmed 2026-10-08)
1. `/product/16`: gradient swatch, brown-gold price, chips; narrow the window below 768px → single column, full-width button.
2. Click **Add to Cart** → “Added to cart ✓” + “View Cart →” (clicking it gives a 404 until Story 10.7 — expected). Console: `localStorage.getItem("aura_cart")` → `[{"id":16,"quantity":1}]`.
3. Console: `localStorage.setItem("aura_cart", JSON.stringify([{id:16,quantity:10}]))`, refresh → the button is replaced by “Maximum 10 per item — adjust the quantity in your cart.”
4. Heart: as a guest → `/login?redirectedFrom=%2Fproduct%2F16`; signed in → fills and a row appears in auradev `favorites`.
5. Back: from `/results` click a card, press **Back** → returns to results; open `/product/16` directly in a new tab, press **Back** → goes to `/`.
6. `/product/999` shows the 404 page.

## Next Steps
After the checks → mark 10.5 ✅ → **10.6 (Cart Icon in Header)**.
