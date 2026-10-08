# Enhancement Request & Impact Report — ENHANCEMENT-1

Date: 2026-10-09
Author: PRODUCT_OWNER & ARCHITECT
Status: IMPLEMENTED (Story 10.7a, 2026-10-09)

## 1. Title

Show product photos on cart and checkout screens

## 2. What Needs to Change

Replace the colored gradient swatch that stands in for the product picture with the real product photo on the cart page (each cart row) and on the Secure Checkout page (each line in Order Summary). Items without a photo keep the gradient. The photo, its fallback and its alt text must come from one shared piece of code, so cards, the product page, cart and checkout all behave the same.

## 3. Current Behaviour

All 40 catalog items now have real photos (Pexels, see `public/images/jewellery/CREDITS.md`). They appear on the results and favorites cards and on the product page. The cart page (`CartItemRow`) and the Secure Checkout page (`CheckoutClient`) still show a plain category-colored gradient where the picture should be, because they were built when images were switched off. The same gradient-vs-photo logic is currently copied inside `JewelleryCard` and `ProductDetail`.

## 4. Desired Behaviour

Cart rows and checkout order-summary lines show the item's photo in the same square slot (cart: current swatch size; checkout: 40×40, cropped to fill), with a descriptive alt text. If an item has no photo or the file fails to load, the category gradient is shown instead, with no broken-image icon and no layout shift.

## 5. Why (Business or UX Value)

Shoppers decide to buy from the picture. Losing it at the cart and at checkout makes the order look unfinished and makes it harder to confirm they are buying the right piece, which hurts trust at the moment of payment.

## 6. Acceptance Criteria

- [ ] Every cart row shows the product photo (gradient only if the item has no photo or the image fails to load).
- [ ] Every Order Summary line on `/checkout` shows the product photo in a 40×40 rounded square.
- [ ] Photo-vs-gradient logic lives in one shared component used by the card, product page, cart and checkout; behaviour on the card and product page is unchanged.
- [ ] No layout shift or horizontal overflow at 375px on `/cart` and `/checkout`; images have meaningful alt text; existing tests plus new ones pass, and `tsc`, lint and build are clean.

## 7. Out of Scope

- Order confirmation page thumbnails, the favorites page, the header cart icon, and any change to the photos themselves or to cart/checkout logic (prices, quantities, ordering).

---

## Codebase Impact Scan (Architect)

### Affected Files

| Path | Component / Function | Change Required |
| ---- | -------------------- | --------------- |
| `aura/components/ProductImage.tsx` (new) | `ProductImage` client component | Single place for "photo if `hasRealPhoto(id)` and it loads, else category gradient": renders `next/image` (`fill`, `object-cover`, `sizes` prop, optional `priority`) inside a `relative overflow-hidden` box; `onError` falls back to the gradient. Alt text from `imageAlt`; gradient fallback is `aria-hidden`. |
| `aura/components/cart/CartItemRow.tsx` | `CartItemRow` (swatch `div`, line 21-25) | Replace the gradient `div` with `<ProductImage>` keeping the same 4rem square slot and grid classes (`col-start-1 row-start-1 h-16 w-16 shrink-0 rounded-lg sm:col-auto sm:row-auto`). `CartItem` already carries `imagePath`/`imageAlt` (rebuilt from the catalog on load, `lib/cart.ts`). |
| `aura/app/checkout/CheckoutClient.tsx` | Order Summary list (lines 96-101) | Replace the gradient `div` with `<ProductImage>` in the 40x40 `rounded-lg` slot; drop the unused `gradientForCategory` import. |
| `aura/components/recommendations/JewelleryCard.tsx` | image block (lines 41-58) | Refactor to use `<ProductImage>`; output must be unchanged (remove local `imageFailed` state + `hasRealPhoto` + `Image` usage). |
| `aura/app/product/[id]/ProductDetail.tsx` | image block | Refactor to use `<ProductImage priority sizes=...>`; unchanged output. |

### Detected Story Linkage

- **Related-Story**: epic-10-story-10.7 (Cart Page)
- **Sub-Story-ID**: 10.7a
- **Evidence**: `docs/plans/stories/epic-10-story-10.7-Cart-Page.md` lists `CartItemRow.tsx` (the primary change); the checkout swatch belongs to Story 10.10 and the card/detail refactor to Stories 10.4/10.5, but 10.7 is the closest single match and no `10.7[a-z]` story exists yet.

### Tests Affected

| Path | Coverage notes |
| ---- | -------------- |
| `aura/lib/product-images.test.ts` | Already covers `hasRealPhoto` and that every listed file exists/is credited; unchanged. |
| `aura/lib/cart.test.ts` | Covers that cart lines are rebuilt from the catalog incl. `imagePath`/`imageAlt`; unchanged. |
| (none) | The repo has no component test harness (see plan risks). UI behaviour is verified with a browser run (Playwright script) plus the existing unit tests; no new unit-testable logic is introduced. |

### Risks

- **Shared component regression** — `JewelleryCard` and `ProductDetail` are on the main user path (Epic 7 favorites, 10.4/10.5). Mitigation: move code without changing output; re-run the browser check on `/results`, `/favorites`, `/product/<id>`.
- **Layout shift / overflow at 375px in the cart grid** — Mitigation: keep the existing fixed-size slot classes; `fill` image inside a sized box; verify no horizontal scroll.
- **Download weight** — thumbnails would otherwise fetch 800px files. Mitigation: pass a small `sizes` ("4rem" / "2.5rem") so `next/image` serves small variants.
- **Broken or missing file** — Mitigation: `onError` falls back to the gradient; behaviour already proven on the card.

### Suggested Approach

Extract the photo-or-gradient block from `JewelleryCard` into `components/ProductImage.tsx` (client component using `hasRealPhoto` and `next/image`), switch `JewelleryCard` and `ProductDetail` to it with no visible change, then use it in `CartItemRow` (64px) and the `CheckoutClient` order summary (40px). Verify in a real browser (cart and checkout at 1000px and 375px, plus `/results` and a product page for regression), then run the full test, lint, `tsc` and build gates.

