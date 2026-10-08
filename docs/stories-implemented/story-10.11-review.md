# Story 10.11 — Order Confirmation Page — Review

**Date**: 2026-10-08 | **Helix**: Story 4.3 (doc 5888) | **Status**: 🟡 Implemented — automated + guest curl checks passed; **signed-in checks and the 12-step smoke test pending the user** (below)

## What Was Implemented
- `aura/lib/checkout.ts` (+): `isUuid`, `shortOrderId` (pure).
- `aura/app/order-confirmation/[id]/page.tsx`: server page — `isUuid` check → 404; guest → `/login?redirectedFrom=/order-confirmation/<id>`; `.maybeSingle()` on `orders` + `order_items` (RLS = own rows only); null → 404; query error → Next error boundary. Shows success icon, `#SHORTID`, items (qty, line price), Grand Total (`text-gold-deep`), payment (“Cash on Delivery” / “UPI — <id>”), delivery address from the snapshot, “Estimated delivery: 5–7 business days”, Continue Shopping → `/`. Payment | Delivering-to side by side ≥640px.
- `aura/app/order-confirmation/[id]/FocusHeading.tsx`: moves focus to the `<h1>` on load.

## Testing Summary (actual output)
```
TDD red: vitest lib/checkout.test.ts before implementing → 10 failed ("isUuid is not a function")
npm run test            → Test Files 8 passed (8) | Tests 249 passed (249)
coverage lib/checkout.ts → Statements 100% (107/107) | Branches 100% (90/90) | Functions 100% (15/15) | Lines 100% (80/80)
npx tsc --noEmit / npm run lint → clean
npm run build           → ✓ Compiled successfully; ƒ /order-confirmation/[id]
curl guest: /order-confirmation/<uuid> -> 307 /login?redirectedFrom=%2Forder-confirmation%2F<uuid>
            /order-confirmation/not-a-uuid -> 307 login (proxy guards first; signed-in → 404 via isUuid)
            /cart -> 200
TODO/FIXME/console.log → 0 ; earlier-epic files diff → 0
```

## DoD Evidence
| AC | Proof |
|---|---|
| Login required; non-UUID / unknown / other user's id → 404 | proxy + page; `isUuid` tests; RLS; **signed-in + cross-user check pending** |
| Page contents (icon, short id, items, total, payment incl. UPI id, address, ETA, Continue Shopping) | `page.tsx`; **visual check pending** |
| 12-step happy path; cart badge gone, `/cart` empty after | **pending** |

**Negative-space**: no order history, invoice/PDF or cancel. **Contract**: columns read (`payment_method`, `upi_id`, `total`, `address_snapshot.{full_name,address_line1,address_line2,city,state,pincode}`, `order_items.{id,name,price,quantity}`) match migrations 0002–0004 and `toAddressRow` snapshot keys (snapshot is `to_jsonb(user_addresses)`, snake_case).

## Pending manual checks (dev, ~5 minutes)
1. Signed in as the account that placed order `655c3713-9c63-4f33-9771-15c171e73199`: open `/order-confirmation/655c3713-9c63-4f33-9771-15c171e73199` → confirmation page with the right items/total/address.
2. Place a fresh order end-to-end (cart → checkout → COD) → you land here automatically; header cart badge gone; `/cart` empty. Repeat with UPI → “UPI — <your id>”.
3. Cross-user: sign in as a second account, open the first account's order URL → 404.
4. Junk id: `/order-confirmation/abc` signed in → 404. Private window (guest) → login.
5. Check at 375px width: sections stack, no horizontal scroll.

## Next Steps
After checks → mark 10.11 ✅ (and 10.10, 10.7) → Epic 10 complete → `aire-qa-validate` for Epic 10.
