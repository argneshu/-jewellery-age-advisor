---
helix_id: "5877"
title: "Epic: Aura Shopping Flow — Product Detail, Cart, Address & Checkout.md"
solution_id: "1080"
synced_at: "2026-10-08"
helix_metadata: { artifact_type: "epic", visibility: "team", lifecycle_state: "CURRENT", version: 5, created_by: "Argneshu Gupta", created_at: "2026-10-08T10:04:52.574045+00:00", updated_by: "Argneshu Gupta", updated_at: "2026-10-08T10:28:10.258274+00:00" }
---

# Epic: Aura Shopping Flow

## Product Detail → Cart → Address → Secure Checkout

**Created:** 2026-10-08
**For:** Argneshu
**Status:** TO DO
**Total Stories:** 11
**Estimated Points:** 25

---

## Business Value

Transform Aura from a **jewellery recommendation tool** into a **complete e-commerce shopping experience**. Users currently discover jewellery but have no way to purchase it. This epic closes that gap by adding a full transactional flow — product browsing → cart → address capture → payment selection → order confirmation.

---

## User Journey

```
[Results / Favourites Grid]
        ↓  click card
[Product Detail Page]  ←  Feature 1
        ↓  Add to Cart
[Cart Page]            ←  Feature 2
        ↓  Proceed to Checkout
   [Auth check]
        ↓ (not logged in → /login)
   [Address check]
        ↓ (no address → /checkout/address)
[Address Form]         ←  Feature 3
        ↓  Save & Continue
[Secure Checkout]      ←  Feature 4
        ↓  Place Order (COD or UPI)
[Order Confirmation]
```

---

## Tech Context

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 + Aura design tokens |
| UI Primitives | shadcn/ui via Base UI |
| Backend/Auth/DB | Supabase (Postgres + Row Level Security) |
| State | React Context + useReducer + localStorage |
| Data | Static `JEWELLERY_ITEMS` catalog in `data/jewellery.ts` |

---

## Story Index

| # | Story | Feature | Points | Depends On |
|---|---|---|---|---|
| 1.1 | Clickable Jewellery Card | Product Detail | 1 | — |
| 1.2 | Product Detail Page | Product Detail | 3 | 1.1, 2.1 |
| 2.1 | Cart State Management (CartContext) | Cart | 3 | — |
| 2.2 | Cart Icon in Header | Cart | 1 | 2.1 |
| 2.3 | Cart Page | Cart | 3 | 2.1 |
| 3.1 | Address DB Migration | Address | 1 | — |
| 3.2 | Address Form & Server Action | Address | 3 | 3.1 |
| 3.3 | Checkout Route Guard | Address | 2 | 2.1, 3.2 |
| 4.1 | Orders DB Migration | Checkout | 1 | — |
| 4.2 | Secure Checkout Page | Checkout | 5 | 3.3, 4.1 |
| 4.3 | Order Confirmation Page | Checkout | 2 | 4.2 |

---

## Recommended Implementation Sequence

```
Sprint 1 (DB + Cart foundation)
  → Story 3.1: Address DB migration
  → Story 4.1: Orders DB migration
  → Story 2.1: CartContext (all cart features depend on this)

Sprint 2 (Product Detail + Cart UI)
  → Story 1.1: Clickable card
  → Story 1.2: Product Detail page
  → Story 2.2: Cart icon in header
  → Story 2.3: Cart page

Sprint 3 (Address + Checkout)
  → Story 3.2: Address form
  → Story 3.3: Checkout route guard
  → Story 4.2: Checkout page
  → Story 4.3: Order confirmation
```

---

## 🚀 How to Proceed with Implementation

This section is a practical guide for a developer (or Helix/AIRE agent) picking this epic up for the first time. Follow it top to bottom — every step unblocks the next.

---

### Step 1 — Run the DB Migrations First (Before Any Code)

**Why first:** The address form (Story 3.2) and checkout (Story 4.2) write to Supabase. If the tables don't exist, those features cannot be tested at all. Do this before touching a single `.tsx` file.

**What to do:**
1. Open your Supabase project → **SQL Editor**
2. Run **Story 3.1** SQL → creates `user_addresses` table
3. Run **Story 4.1** SQL → creates `orders` + `order_items` tables
4. Verify all three tables appear in **Table Editor** with 🔒 RLS shield icons

> ✅ This takes ~5 minutes and unblocks everything else.

---

### Step 2 — Build CartContext (Story 2.1) — The Core Dependency

**Why second:** `CartContext` is imported by `ProductDetail.tsx`, `CartPage`, `CartSummary`, `CartIconLink`, and `CheckoutClient`. Nothing in the cart or checkout flow can be built or tested without it.

**What to do:**
1. Create `context/CartContext.tsx` (full code in Story 2.1)
2. Wrap `<body>` children in `app/layout.tsx` with `<CartProvider>`
3. **Smoke test:** Open the browser console, add `localStorage.setItem("aura_cart", "[...]")` manually and refresh — confirm the provider hydrates without errors

> ✅ Once this is done, Sprints 2 and 3 can proceed in any order.

---

### Step 3 — Make Cards Clickable (Story 1.1) — Smallest Change, Biggest UX Impact

**Why third:** It's a 1-point change to one file (`JewelleryCard.tsx`) that immediately makes the entire product grid feel like a real shop. It also unblocks Story 1.2.

**What to do:**
1. Wrap `<Card>` in `<Link href={`/product/${item.id}`}>` in `JewelleryCard.tsx`
2. Add `e.preventDefault()` + `e.stopPropagation()` to the heart button's `onClick`
3. **Test:** Click a card in `/results` — should navigate to `/product/1` (will 404 until Story 1.2 is done, which is fine)

> ✅ Takes ~15 minutes. Visually confirms routing is wired up.

---

### Step 4 — Build Product Detail Page (Story 1.2)

**Requires:** Stories 1.1 ✅ and 2.1 ✅

**What to do:**
1. Create `app/product/[id]/page.tsx` (Server Component — fetches item, calls `notFound()` if missing)
2. Create `app/product/[id]/ProductDetail.tsx` (Client Component — renders UI + "Add to Cart")
3. **Test end-to-end:** Click a card → product page loads → click "Add to Cart" → confirm "Added to cart ✓" appears → check `localStorage` for `aura_cart`

---

### Step 5 — Add Cart Icon to Header + Build Cart Page (Stories 2.2 & 2.3)

**Requires:** Story 2.1 ✅

These two can be done in parallel by the same developer in one sitting — they are closely related.

**What to do:**
1. Create `components/cart/CartIconLink.tsx` (client component with badge)
2. Import `<CartIconLink />` in `AuthHeader.tsx`
3. Create `app/cart/page.tsx`, `CartItemRow.tsx`, `CartSummary.tsx`
4. **Test:** Add an item from the product page → badge shows count in header → navigate to `/cart` → qty stepper + remove work → "Proceed to Checkout" redirects guests to `/login`

---

### Step 6 — Build Address Form (Story 3.2)

**Requires:** Story 3.1 (DB) ✅

**What to do:**
1. Create `app/checkout/address/page.tsx` (Server Component — auth guard + fetch existing address)
2. Create `app/checkout/address/AddressForm.tsx` (Client Component — form with validation)
3. Create `app/checkout/address/actions.ts` (Server Action — upsert to `user_addresses`)
4. Create `types/address.ts`
5. **Test:** Log in → visit `/checkout/address` → fill form → submit → verify row appears in Supabase Table Editor

---

### Step 7 — Build Checkout Route Guard (Story 3.3)

**Requires:** Stories 2.1 ✅ and 3.2 ✅

This is largely already handled by the guard logic at the top of `app/checkout/page.tsx` (built in Story 4.2). Story 3.3 is mostly about verifying the routing matrix works correctly:

| Test scenario | Expected result |
|---|---|
| Visit `/checkout` logged out | → `/login?redirectedFrom=/checkout` |
| Visit `/checkout` logged in, no address | → `/checkout/address` |
| Visit `/checkout` logged in, address saved | → Checkout page renders |

---

### Step 8 — Build Secure Checkout Page (Story 4.2) — Highest Complexity

**Requires:** Stories 3.3 ✅ and 4.1 (DB) ✅

This is the most complex story (5 points). Take it in layers:

1. **First:** Build `app/checkout/page.tsx` with just the guard + address display — confirm it renders
2. **Then:** Add `CheckoutClient.tsx` with the Order Summary section (read from CartContext)
3. **Then:** Add Payment Method radio buttons (COD + UPI with conditional input)
4. **Finally:** Wire up `actions.ts` → `placeOrder()` Server Action → test a full COD order end-to-end in Supabase

> 💡 **Tip:** Use the Supabase Table Editor to verify the `orders` and `order_items` rows are created correctly after a test order.

---

### Step 9 — Build Order Confirmation Page (Story 4.3)

**Requires:** Story 4.2 ✅

**What to do:**
1. Create `app/order-confirmation/[id]/page.tsx`
2. **Test full happy path:** Homepage → fill prefs → results → click card → product detail → Add to Cart → cart → checkout (address already saved) → select COD → Place Order → confirmation page shows correct order details
3. Verify cart is cleared (badge disappears, `/cart` shows empty state)

---

### ✅ Full Happy Path Test (End-to-End Smoke Test)

Once all stories are done, run this flow to confirm the entire epic works:

```
1. Go to / (homepage)
2. Fill in recommendation form → go to /results
3. Click a jewellery card → /product/[id] loads ✓
4. Click "Add to Cart" → badge shows 1 in header ✓
5. Click cart icon → /cart shows item ✓
6. Click "Proceed to Checkout" (logged out) → /login ✓
7. Log in → redirected to /checkout → no address → /checkout/address ✓
8. Fill address → Save → /checkout ✓
9. Select UPI → enter UPI ID → Place Order ✓
10. /order-confirmation/[id] shows success ✓
11. Cart badge gone, /cart shows empty state ✓
12. Check Supabase: orders + order_items rows exist ✓
```

---

## Design System Reference

```
Button variants   → "gradient" (primary), "ghost" (secondary)
Card wrapper      → rounded-aura-xl border-border-soft bg-ivory shadow-soft
Page container    → mx-auto w-full max-w-5xl flex-1 px-4 pb-16
Headings          → font-serif text-3xl text-ink
Price             → text-gold font-semibold  +  formatINR() from @/lib/format
Errors            → <Alert variant="destructive">
Input/Label       → @/components/ui/input  +  @/components/ui/label
Icon library      → lucide-react (already installed)
```

---

## New Supabase Tables

| Table | Purpose |
|---|---|
| `user_addresses` | Delivery address per user (upsert pattern, one per user) |
| `orders` | Order header with address snapshot, payment method, status |
| `order_items` | Line items linked to each order |

---

## Files Overview

### New Files (to create)
```
context/CartContext.tsx
types/address.ts
app/product/[id]/page.tsx
app/product/[id]/ProductDetail.tsx
app/cart/page.tsx
components/cart/CartItemRow.tsx
components/cart/CartSummary.tsx
app/checkout/address/page.tsx
app/checkout/address/AddressForm.tsx
app/checkout/address/actions.ts
app/checkout/page.tsx
app/checkout/CheckoutClient.tsx
app/checkout/actions.ts
app/order-confirmation/[id]/page.tsx
supabase/migrations/0002_user_addresses.sql
supabase/migrations/0003_orders.sql
```

### Modified Files
```
components/recommendations/JewelleryCard.tsx   ← add Link wrapper
app/layout.tsx                                 ← add CartProvider
components/auth/AuthHeader.tsx                 ← add cart icon + badge
```

---

## Referenced Paths

### High Relevance
- `-jewellery-age-advisor/aura/types/jewellery.ts` - Core JewelleryItem type used across all features
- `-jewellery-age-advisor/aura/data/jewellery.ts` - Static catalog powering product detail
- `-jewellery-age-advisor/aura/components/recommendations/JewelleryCard.tsx` - Modified in Story 1.1
- `-jewellery-age-advisor/aura/app/layout.tsx` - Modified in Story 2.1 to wrap CartProvider
- `-jewellery-age-advisor/aura/components/auth/AuthHeader.tsx` - Modified in Story 2.2
- `-jewellery-age-advisor/aura/supabase/migrations/0001_favorites.sql` - Migration pattern reference

### Medium Relevance
- `-jewellery-age-advisor/aura/app/favorites/page.tsx` - Auth guard pattern to replicate
- `-jewellery-age-advisor/aura/lib/supabase/server.ts` - Server client for Server Actions
- `-jewellery-age-advisor/aura/lib/supabase/client.ts` - Browser client for CartContext
- `-jewellery-age-advisor/aura/lib/format.ts` - formatINR for price display
- `-jewellery-age-advisor/aura/proxy.ts` - Middleware auth guard pattern

### Low Relevance
- `-jewellery-age-advisor/aura/components/ui/` - UI primitives reference
- `-jewellery-age-advisor/aura/package.json` - Dependency versions
