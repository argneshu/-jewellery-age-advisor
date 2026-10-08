# Story 10.10 — Secure Checkout Page — Review

**Date**: 2026-10-08 | **Helix**: Story 4.2 (doc 5881) | **Status**: 🟡 Implemented — automated + guest curl checks passed; **end-to-end order checks pending the user** (below)

## What Was Implemented
- `aura/lib/checkout.ts` (+): `validateUpiId` (same regex as `place_order`), `validatePaymentMethod`, `priceOrder` (prices/names from catalog only), `validatePlaceOrderInput`, `mapPlaceOrderError`, `MAX_ORDER_LINES`.
- `aura/app/checkout/actions.ts`: `placeOrder(input: unknown)` — `getUser()`, server-side validation + pricing, `rpc('place_order')`, typed result, safe messages, only the error code logged.
- `aura/app/checkout/page.tsx`: full server page ("Secure Checkout"), guards from 10.9, address via `.maybeSingle()`.
- `aura/app/checkout/CheckoutClient.tsx`: Order Summary / Delivery Address (+Change) / Payment Method; ref lock + disabled button; "Placing Order…"; empty cart → `/cart` after hydration; cart cleared only after `{ok:true}`; destructive Alert on failure (with "Add address" link for no-address).
- `aura/app/checkout/PaymentMethodSection.tsx`: COD / UPI radio cards (≥44px), UPI field + copy (“Your UPI ID is saved with this order. No payment is taken on this page.”).

## Testing Summary (actual output)
```
TDD red: vitest lib/checkout.test.ts before implementing → 96 tests | 46 failed
npm run test            → Test Files 8 passed (8) | Tests 239 passed (239)
coverage lib/checkout.ts → Statements 100% (104/104) | Branches 100% (90/90) | Functions 100% (13/13) | Lines 100% (77/77)
npx tsc --noEmit / npm run lint → clean
npm run build           → ✓ Compiled successfully; ƒ /checkout, ƒ /checkout/address
curl guest: /checkout -> 307 login ; /checkout/address -> 307 login ; /cart -> 200
TODO/FIXME/console.log in app/checkout, lib/checkout.ts → 0 ; earlier-epic files diff → 0
```

## DoD Evidence
| AC | Proof |
|---|---|
| Three sections incl. totals, Free Delivery, Grand Total, Change link | `CheckoutClient.tsx`; **visual check pending** |
| Place Order disabled until method (+ UPI id); "Placing Order…"; double-click safe | `canPlaceOrder`, `submitLock` ref + `isPending`; **manual check pending** |
| Empty cart → `/cart` after hydration | `useEffect` + `isHydrated`; **manual check pending** |
| `placeOrder` accepts only ids+qty; catalog prices; rejects bad input; calls rpc | `priceOrder`/`validatePlaceOrderInput` tests (forged price/name ignored, unknown id, qty 0/11/1.5/'2', duplicates, 0 and 41 lines, bad UPI) |
| Success → clearCart then push confirmation; failure keeps cart + Alert | `CheckoutClient.tsx`; **manual check pending** |
| UPI wording (OPEN-1) | `PaymentMethodSection.tsx` |
| No PII/UPI in logs; no raw DB text | `actions.ts` logs `error.code` only; `mapPlaceOrderError` tests |

**Negative-space**: no real payment, emails, inventory, DB price check (R1 accepted).
**Contract**: client sends `{paymentMethod, upiId?, items:[{id,quantity}]}` ↔ `validatePlaceOrderInput` ↔ `PricedLine` (`jewellery_item_id,name,price,quantity`) ↔ `place_order(p_items)` field names in migration 0004.

## Pending manual checks (dev account, ~5 minutes; `npm run dev`)
1. Add 2 items to the cart → Proceed to Checkout → three sections show; totals match the cart.
2. COD: select Cash on Delivery → Place Order. Expect redirect to `/order-confirmation/<id>` (404 until Story 10.11 — expected) and the cart badge now empty.
3. SQL: `select id, payment_method, upi_id, total from public.orders order by created_at desc limit 1;` and `select * from public.order_items where order_id = '<id>';` → 1 order, correct item count, `address_snapshot` present.
4. UPI: add items again → choose UPI → button stays disabled while the id is invalid (`bad`, `a@upi`, spaces) and shows an error after you leave the field; enabled for `me@okaxis`, which places the order (`upi_id` stored).
5. Tamper: in devtools set `localStorage.aura_cart` prices to 1 and reload → page shows catalog prices (cart is rebuilt from the catalog); stored `total` equals catalog math.
6. Empty cart: open `/checkout` with an empty cart → bounced to `/cart`. No address (delete your row) → bounced to `/checkout/address`.
7. Double-click Place Order quickly → only one new `orders` row.

## Fix during manual testing
User found Place Order enabled for UPI id `bad`. Cause: `canPlaceOrder` only checked the field was non-empty. Fixed: it now uses `validateUpiId` (same rule as server and `place_order`); inline error shows after blur. Re-run: 239/239 tests, tsc/lint/build clean.

## Next Steps
After checks → mark 10.10 ✅ → **10.11 (Order Confirmation Page)**.
