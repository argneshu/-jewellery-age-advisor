### Story 10.10: Secure Checkout Page

**File**: `docs/plans/stories/epic-10-story-10.10-Secure-Checkout-Page.md`

**Epic**: 10 - AURA SHOPPING FLOW | **ID**: 10.10 | **Date**: 2026-10-08 | **Jira**: LOCAL | **GitHub**: LOCAL | **BUILDID**: NO-CYCLE
**Helix**: Story 4.2 — solution 1080, document 5881 (local snapshot: `docs/helix/INDEX.md`; the Helix text is the base spec — read it first, it contains the full reference code)
**Wave**: 7
**Requires**: ["10.9", "10.2"]
**Enables**: ["10.11"]
**Files Touched**:
  - aura/lib/checkout.ts
  - aura/lib/checkout.test.ts
  - aura/app/checkout/page.tsx
  - aura/app/checkout/CheckoutClient.tsx
  - aura/app/checkout/actions.ts
**Roles Ref**: docs/requirements.md#roles--permissions-matrix — Authenticated User with saved address
**QA Candidate**: Yes — **Observable:** order summary, address, payment choice, Place Order creates an order.

> **How to read this story.** The Helix story already holds the complete user story, implementation code and Definition of Done (same precedent as Story 7.3, which was implemented straight from Helix). This file records only what the local plan adds: ownership, order, and every **deviation from Helix** (D1–D9 in `docs/requirements.md`, architecture §10, patterns §E10). Where this file and Helix differ, **this file wins**.

#### 👤 User Reference

**Description**: Let a signed-in shopper review the order, pick Cash on Delivery or UPI and place the order safely.

**Acceptance Criteria**:
- [ ] Three sections: Order Summary (lines, qty, totals, Free Delivery, Grand Total), Delivery Address (+ Change link), Payment Method (COD; UPI with required UPI ID).
- [ ] Place Order disabled until a method is chosen (and a valid UPI id); shows “Placing Order…”; double clicks create one order (ref lock + disabled).
- [ ] Empty cart (after hydration) → redirect to `/cart`.
- [ ] `placeOrder(input: unknown)` accepts only `{paymentMethod, upiId?, items:[{id, quantity}]}`; prices/names come from `JEWELLERY_ITEMS`; unknown ids, quantities not integer 1..10, duplicates, empty, >40 lines, bad UPI rejected; calls `rpc('place_order')`.
- [ ] On `{ok:true, orderId}` the client calls `clearCart()` then `router.push('/order-confirmation/{id}')`; on failure the cart is untouched and a safe message appears in a destructive `Alert`.
- [ ] Screen states plainly that the UPI id is recorded and payment is collected on delivery/confirmation (wording finalised here — OPEN-1).
- [ ] No PII/UPI id in logs; no raw DB error text shown.

#### 🤖 AI Agent Reference

**Deviations from Helix (apply these)**:
- [ADDED] D1–D4: server-side pricing, validation, atomic `rpc`, empty-cart guard.
- [CORRECTED] typed `ActionResult`; no JSON.parse of client prices; cart cleared only after success.

**UI/UX (from `docs/ui-ux/ui-ux-spec.md`, approved 2026-10-08)**:
- “Free” delivery in `text-green-700`; totals/prices `text-gold-deep`; payment options as ≥44px radio cards; copy — COD: “Pay when your order arrives.”; UPI: “Your UPI ID is saved with this order. No payment is taken on this page.” (resolves OPEN-1); button/field pending states; destructive `Alert` at top for server errors; render only the heading until `isHydrated`.

**RBAC Enforcement**:
| Persona | Permission | Enforcement |
|---|---|---|
| Authenticated User + address | `order:create-own` | proxy + page guards + action `getUser()` + RLS + `place_order` |
| Guest | denied | redirect to login |

**System responses + error cases**:
| Trigger | Response | Side-effect |
|---|---|---|
| Valid order | order id | order + items stored atomically; cart cleared client-side |
| Invalid cart/UPI | safe message | nothing stored; cart kept |
| No address | message + link | nothing stored |

**Prerequisites**: Epic 10 requirements/architecture/patterns/data design approved; previous stories in `Requires` done; development (non-production) Supabase project in use (see plan prerequisite P0).

**Implementation Steps**:
1. TDD: extend `lib/checkout.test.ts` — `validateUpiId`, `validatePaymentMethod`, `priceOrder` (incl. forged prices ignored), `mapPlaceOrderError`; implement in `lib/checkout.ts`.
2. Replace the guard-only page with the full page (address via `.maybeSingle()`); build `CheckoutClient.tsx` (split `PaymentMethodSection` if >200 lines).
3. Implement `actions.ts` per architecture §10.8.
4. Manual end-to-end with two real dev users: COD order, UPI order, tamper test (send altered prices from devtools — stored total equals catalog math), empty cart redirect, no-address redirect, double-click.

**Test Requirements**:
- priceOrder: valid multi-line; rejects empty/non-array/unknown id/qty 0,11,1.5,'2'/duplicate ids/41 lines/non-object; total equals catalog sum even when input contains `price`/`name` fields.
- UPI: valid (`a.b@bank`), too short, no `@`, spaces, >100 chars before the @, unicode.
- mapPlaceOrderError: `no_address`, `invalid_order`, `not_authenticated`, unknown → generic.
- Coverage ≥85% on `lib/checkout.ts`.
- DB check after a test order: 1 `orders` row, correct `order_items` count, snapshot present (dev project).
- Quality gates: `npm run test` (all existing tests + new ones green), `npm run lint`, `npx tsc --noEmit`, `npm run build` clean; paste the actual command output into `docs/stories-implemented/story-10.10-review.md`.

**Out of Scope**:
- Real payment, order emails, inventory, shipping rules, DB-side price verification (R1).

**Completion Evidence**: 239/239 tests; lib/checkout.ts 100% coverage; tsc/lint/build clean; guest curl 307. Review: `docs/stories-implemented/story-10.10-review.md`. End-to-end order checks pending user.
