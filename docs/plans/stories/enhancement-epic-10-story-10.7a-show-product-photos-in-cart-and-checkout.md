---
Epic: 10 - AURA SHOPPING FLOW
ID: 10.7a
Parent-Story: 10.7
Date: 2026-10-09
Jira: LOCAL
GitHub: LOCAL
AzureDevOps: LOCAL
Enhancement: ENHANCEMENT-1
Related-Story: 10.7
---

# Epic 10 / Story 10.7a — Show product photos on cart and checkout screens

> ⚡ Enhancement sub-story of Story 10.7 (Cart Page). See Story 10.7 and Story 10.10 for full epic context.

## Objective

Show the real product photo, instead of the category-colored gradient swatch, on every cart row (`/cart`) and every Order Summary line on the Secure Checkout page (`/checkout`). Photo-or-gradient logic moves into one shared `ProductImage` component that the results/favorites card, the product page, the cart and the checkout all use, so they cannot drift apart. Items without a photo, or whose image fails to load, keep the gradient.

## Acceptance Criteria

- [ ] Every cart row shows the product photo in the existing 64x64 rounded slot (gradient only as fallback), with the item's `imageAlt` as alt text.
- [ ] Every Order Summary line on `/checkout` shows the product photo in a 40x40 rounded slot.
- [ ] One shared `components/ProductImage.tsx` implements photo-vs-gradient (`hasRealPhoto`, `onError` fallback); `JewelleryCard` and `ProductDetail` use it and render exactly as before.
- [ ] No layout shift and no horizontal overflow at 375px on `/cart` and `/checkout`; small `sizes` so thumbnails do not download full-size images.
- [ ] All affected tests pass; no regression in adjacent functionality (`/results`, `/favorites`, `/product/<id>`, cart totals, checkout flow); `npm run test`, `npm run lint`, `npx tsc --noEmit`, `npm run build` clean.

## Must Read (References)

- docs/enhancements/enhancement-1.md (Unified Request & Impact Report)
- docs/plans/stories/epic-10-story-10.7-Cart-Page.md (parent story)
- docs/plans/stories/epic-10-story-10.10-Secure-Checkout-Page.md
- aura/components/recommendations/JewelleryCard.tsx, aura/app/product/[id]/ProductDetail.tsx (current photo-or-gradient code)
- aura/lib/product-images.ts, aura/lib/cart.ts (`CartItem.imagePath/imageAlt`)

## Prerequisites

- Working code checkout; Story 10.7 and 10.10 implemented; all 40 catalog photos in `aura/public/images/jewellery/` (branch `images/real-product-photos-batch-1` merged, or built on it).
- Existing tests pass on baseline (252).

## Implementation Steps

1. Create `aura/components/ProductImage.tsx` ("use client"): props `item: { id; category; imagePath; imageAlt }`, `sizes`, optional `priority` and `className`; renders a `relative overflow-hidden` box; shows `next/image` (`fill`, `object-cover`) when `hasRealPhoto(id)` and not failed, else the `gradientForCategory(category)` background (`aria-hidden`); `onError` switches to the gradient.
2. Refactor `JewelleryCard.tsx` and `ProductDetail.tsx` to use it (drop their local `imageFailed`/`Image`/`hasRealPhoto` code). Output unchanged (heart button stays inside the same positioned box).
3. `CartItemRow.tsx`: replace the swatch `div` with `<ProductImage sizes="4rem" ...>` keeping the same slot classes.
4. `CheckoutClient.tsx`: replace the order-summary swatch with `<ProductImage sizes="2.5rem" ...>`; remove the now-unused `gradientForCategory` import.
5. Verify with a browser run (Playwright): cart and checkout at 1000px and 375px (photo visible, no overflow, no broken image), and `/results`, `/favorites`, `/product/16` regression; paste evidence into `docs/stories-implemented/story-10.7a-review.md`; update `docs/status.md`.

## Test Requirements

- No new pure logic is introduced; `lib/product-images.test.ts` and `lib/cart.test.ts` must stay green. (No component test harness exists — see implementation-plan risks.)
- Browser evidence for the ACs above; full quality gates (`test`, `lint`, `tsc`, `build`) with output pasted.
- Coverage target: >=85% for changed `lib/` files (unchanged here).

## Out of Scope

- Order confirmation page thumbnails, the favorites page, the header cart icon, changes to the photos themselves, and any change to cart or checkout logic (prices, quantities, ordering).
