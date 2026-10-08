# Story 10.7a — Show product photos on cart & checkout — Review

**Date**: 2026-10-09 | **Enhancement**: ENHANCEMENT-1 (`docs/enhancements/enhancement-1.md`) | **Parent**: Story 10.7 | **Status**: ✅ Done — automated gates + real-browser checks passed

## What Was Implemented
- `aura/components/ProductImage.tsx` (new, client): the single "photo or gradient" component. Shows the curated photo (`hasRealPhoto`) via `next/image` (`fill`, `object-cover`, `sizes`, `preload`), falls back to the category gradient if the item has no photo or the file fails to load. Box size comes from the caller's `className`; `children` render inside the box (heart button).
- `CartItemRow.tsx`: gradient swatch → `<ProductImage sizes="4rem">` in the same 64×64 slot/grid classes.
- `CheckoutClient.tsx`: order-summary swatch → `<ProductImage sizes="2.5rem">` in the 40×40 slot.
- `JewelleryCard.tsx`, `ProductDetail.tsx`: refactored to use `ProductImage` (local `imageFailed`/`Image`/`hasRealPhoto` code removed; output unchanged).
- Next.js 16 note (from `node_modules/next/dist/docs/.../image.md`): `priority` is deprecated, so the above-the-fold product image uses `preload`.

## Testing Summary (actual output)
```
npm run test   → Test Files 9 passed (9) | Tests 252 passed (252)   (no new unit-testable logic; lib/product-images + lib/cart tests unchanged)
npm run lint   → clean (0 warnings)      npx tsc --noEmit → clean      npm run build → ✓ Compiled successfully
TODO/FIXME/console.log in ProductImage.tsx → 0
Real Chrome (Playwright) vs dev server + dev Supabase, throwaway user (deleted afterwards), cart = items 16×1, 7×2, 1×1:
  /cart     @1000px  3 rows with a loaded photo, alt = item names; no horizontal overflow
  /cart     @375px   3 rows with a loaded photo; no horizontal overflow
  /checkout @1000px  3 summary lines with a loaded photo; no horizontal overflow
  /checkout @375px   3 summary lines with a loaded photo; no horizontal overflow
  /product/16        photo loaded; heart button is inside the photo box
  /results           6/6 card photos loaded, none broken
  Fallback           with /_next/image blocked → no <img>, gradient shown (no broken-image icon)
  → 12/12 checks passed. Screenshots reviewed (cart-375, checkout-375).
```
Not counted as evidence: the "/results heart does not navigate" script check was written so it cannot fail; heart-vs-card-navigation behaviour is unchanged code moved as-is and was verified in Story 10.4.

## DoD Evidence
| AC | Proof |
|---|---|
| Cart rows show the photo (64×64, alt = `imageAlt`) | `CartItemRow.tsx`; browser run (1000 & 375px) |
| Checkout summary lines show the photo (40×40) | `CheckoutClient.tsx`; browser run |
| One shared component; card/product page unchanged | `ProductImage.tsx`; `JewelleryCard`/`ProductDetail` use it; `/results` and `/product/16` checks |
| No layout shift / overflow at 375px; small `sizes` | `scrollWidth <= innerWidth` checks; `sizes="4rem"` / `"2.5rem"` |
| Tests/lint/tsc/build clean, no regression | outputs above |

**Negative-space**: no change to cart/checkout logic, prices or ordering; order confirmation and favorites page untouched (out of scope); `git diff` touches only the 5 files in the story plus docs.

## Observations
- Cart/checkout thumbnails use `next/image` with tiny `sizes`, so they do not download the 800px originals.
- The order confirmation page still has no item thumbnails (out of scope, could be a follow-up).
