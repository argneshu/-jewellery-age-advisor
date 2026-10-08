---
helix_id: "5875"
title: "Aura — Shopping Flow Feature Specs (Product Detail → Cart → Address → Checkout).md"
solution_id: "1080"
synced_at: "2026-10-08"
helix_metadata: { artifact_type: "tech_spec", visibility: "private", lifecycle_state: "CURRENT", version: 2, created_by: "Argneshu Gupta", created_at: "2026-10-08T09:57:50.105696+00:00", updated_by: "Argneshu Gupta", updated_at: "2026-10-08T09:58:05.362426+00:00" }
---

# Aura — Shopping Flow Feature Specs
## Product Detail → Cart → Address → Secure Checkout

**Created:** 2026-10-08
**For:** Argneshu
**Status:** READY FOR IMPLEMENTATION
**Stack:** Next.js 16 · React 19 · TypeScript · Tailwind CSS · Supabase · shadcn/ui (Base UI)

---

## Codebase Snapshot (as analysed)

| What exists | Key detail |
|---|---|
| `data/jewellery.ts` | Static catalog of 37 `JewelleryItem` objects (id, name, category, price, style, tags, imagePath, imageAlt, ageMin, ageMax) |
| `components/recommendations/JewelleryCard.tsx` | Card component — currently **not clickable** to a detail page |
| `app/results/page.tsx` + `ResultsGrid.tsx` | Renders `JewelleryCard` grid from recommendation prefs |
| `app/favorites/page.tsx` | Renders `JewelleryCard` grid from Supabase favorites |
| Supabase `favorites` table | UUID PK, user_id FK → auth.users, jewellery_item_id integer, RLS enabled |
| `lib/supabase/server.ts` + `client.ts` | SSR and browser Supabase clients already wired |
| `components/auth/AuthHeader.tsx` | Top nav — needs Cart icon added |
| Design tokens | `bg-ivory`, `text-ink`, `text-gold`, `shadow-soft`, `rounded-aura-xl`, `border-border-soft`, `font-serif` (Playfair Display), `font-sans` (Poppins) |

---

## Feature 1 — Product Detail Page

### User Story
> As a shopper, when I click on a jewellery card I want to see a dedicated product detail page so I can read full details and add the item to my cart.

### Acceptance Criteria
- [ ] Every `JewelleryCard` is wrapped in a `<Link href="/product/[id]">` — the entire card is clickable
- [ ] Route `/product/[id]` renders server-side using the static `JEWELLERY_ITEMS` catalog
- [ ] If `id` doesn't match any item, render Next.js `notFound()`
- [ ] Page shows: product image (or gradient fallback), name, category badge, price (formatted INR), style tag, age range, and all tags as chips
- [ ] Prominent **"Add to Cart"** button (gradient variant, full-width on mobile)
- [ ] Favourites heart button retained (same logic as `JewelleryCard`)
- [ ] Breadcrumb: `← Back to results` (uses `router.back()`) or `← Browse` if no history

### Files to Create
```
app/product/[id]/page.tsx          ← Server Component — fetches item, passes to client view
app/product/[id]/ProductDetail.tsx ← "use client" — renders UI + Add to Cart action
```

### Files to Modify
```
components/recommendations/JewelleryCard.tsx  ← Wrap card in <Link href={`/product/${item.id}`}>
                                                 Remove onClick if any; keep heart button stopPropagation
```

### Implementation Notes
```tsx
// app/product/[id]/page.tsx
import { notFound } from "next/navigation";
import { JEWELLERY_ITEMS } from "@/data/jewellery";
import { ProductDetail } from "./ProductDetail";

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = JEWELLERY_ITEMS.find((i) => i.id === Number(id));
  if (!item) notFound();
  return <ProductDetail item={item} />;
}

// Generate static params for all products (optional but good for performance)
export function generateStaticParams() {
  return JEWELLERY_ITEMS.map((item) => ({ id: String(item.id) }));
}
```

```tsx
// JewelleryCard.tsx — wrap the card
import Link from "next/link";
// Wrap entire <Card> in:
<Link href={`/product/${item.id}`} className="block">
  <Card ...>
    {/* heart button needs e.stopPropagation() + e.preventDefault() on its onClick */}
  </Card>
</Link>
```

---

## Feature 2 — Cart (Context + Cart Page)

### User Story
> As a shopper, after clicking "Add to Cart" I want the item added to my cart and I want to be able to view my cart, see all items, and proceed to checkout.

### Acceptance Criteria
- [ ] Cart state is persisted in **`localStorage`** (no Supabase table needed — keeps it simple and works for guests)
- [ ] A `CartContext` (React Context + `useReducer`) wraps the whole app via `app/layout.tsx`
- [ ] `useCart()` hook exposes: `items`, `addItem(item)`, `removeItem(id)`, `updateQty(id, qty)`, `clearCart()`, `totalItems`, `totalPrice`
- [ ] Cart icon with item count badge appears in `AuthHeader` — navigates to `/cart`
- [ ] **Add to Cart** on the product detail page calls `addItem()` and shows a brief toast/confirmation ("Added to cart ✓") then shows a "View Cart →" link
- [ ] `/cart` page lists all cart items: image/gradient, name, category, price, quantity stepper (+ / −), remove button, line total
- [ ] Cart summary section: subtotal, item count
- [ ] **"Proceed to Checkout"** button (disabled if cart is empty) navigates to `/checkout`
- [ ] If cart is empty, show friendly empty state with "Browse Jewellery" CTA back to `/`

### Files to Create
```
context/CartContext.tsx             ← CartProvider, useCart hook, CartItem type
app/cart/page.tsx                   ← "use client" Cart page
components/cart/CartItemRow.tsx     ← Single cart row with qty stepper + remove
components/cart/CartSummary.tsx     ← Subtotal + Proceed to Checkout button
```

### Files to Modify
```
app/layout.tsx                      ← Wrap <body> children with <CartProvider>
components/auth/AuthHeader.tsx      ← Add <CartIcon> with badge
app/product/[id]/ProductDetail.tsx  ← Wire "Add to Cart" button to useCart().addItem()
```

### CartItem Type
```ts
// context/CartContext.tsx
export interface CartItem {
  id: number;           // jewellery_item_id
  name: string;
  category: string;
  price: number;        // INR integer
  imagePath: string;
  imageAlt: string;
  quantity: number;
}
```

### Cart Reducer Actions
```ts
type CartAction =
  | { type: "ADD_ITEM"; item: Omit<CartItem, "quantity"> }
  | { type: "REMOVE_ITEM"; id: number }
  | { type: "UPDATE_QTY"; id: number; qty: number }
  | { type: "CLEAR_CART" }
  | { type: "HYDRATE"; items: CartItem[] };  // load from localStorage on mount
```

### localStorage Persistence
```ts
// On every state change, write to localStorage:
localStorage.setItem("aura_cart", JSON.stringify(state.items));
// On CartProvider mount (useEffect), read and dispatch HYDRATE
```

### Cart Icon in AuthHeader
```tsx
// Use ShoppingBag icon from lucide-react
// Show red badge with count when totalItems > 0
<Link href="/cart" className="relative">
  <ShoppingBag size={22} />
  {totalItems > 0 && (
    <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center
                     rounded-full bg-rose text-[10px] font-semibold text-white">
      {totalItems}
    </span>
  )}
</Link>
```

---

## Feature 3 — Address Management

### User Story
> As a shopper clicking "Proceed to Checkout", if I haven't saved a delivery address I want to fill in an address form and save it before I can continue to payment.

### Acceptance Criteria
- [ ] Clicking "Proceed to Checkout" from `/cart`:
  - If user is **not logged in** → redirect to `/login?redirectedFrom=/checkout`
  - If user is **logged in, no address saved** → redirect to `/checkout/address`
  - If user is **logged in, address saved** → go directly to `/checkout`
- [ ] `/checkout/address` shows a form with fields: Full Name, Phone Number, Address Line 1, Address Line 2 (optional), City, State, Pincode (6 digits)
- [ ] Validation: all required fields filled, phone = 10 digits, pincode = 6 digits
- [ ] On submit, address is saved to Supabase `user_addresses` table via a Next.js Server Action
- [ ] After successful save, user is navigated to `/checkout`
- [ ] If user already has an address, `/checkout/address` shows existing address with an "Edit" option

### Supabase Migration — `user_addresses` table
```sql
-- supabase/migrations/0002_user_addresses.sql
create table public.user_addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  full_name text not null,
  phone text not null,
  address_line1 text not null,
  address_line2 text,
  city text not null,
  state text not null,
  pincode text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- One address per user (upsert pattern)
  unique (user_id)
);

alter table public.user_addresses enable row level security;

create policy "Users can view their own address"
  on public.user_addresses for select
  using (auth.uid() = user_id);

create policy "Users can insert their own address"
  on public.user_addresses for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own address"
  on public.user_addresses for update
  using (auth.uid() = user_id);
```

### Files to Create
```
app/checkout/address/page.tsx         ← Server Component — checks auth + existing address
app/checkout/address/AddressForm.tsx  ← "use client" form with validation
app/checkout/address/actions.ts       ← Server Actions: saveAddress(), getAddress()
types/address.ts                      ← UserAddress type
```

### Address Type
```ts
// types/address.ts
export interface UserAddress {
  id: string;
  userId: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
}
```

### Server Action (saveAddress)
```ts
// app/checkout/address/actions.ts
"use server";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function saveAddress(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase
    .from("user_addresses")
    .upsert({
      user_id: user.id,
      full_name: formData.get("fullName"),
      phone: formData.get("phone"),
      address_line1: formData.get("addressLine1"),
      address_line2: formData.get("addressLine2") || null,
      city: formData.get("city"),
      state: formData.get("state"),
      pincode: formData.get("pincode"),
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });

  if (error) throw new Error(error.message);
  redirect("/checkout");
}
```

### Checkout Redirect Logic (in Cart page)
```tsx
// components/cart/CartSummary.tsx
// "Proceed to Checkout" button — Server Action or API route that:
// 1. Checks auth (redirect to /login if not signed in)
// 2. Checks if user_addresses row exists for user
// 3. Redirects to /checkout/address or /checkout accordingly
```

---

## Feature 4 — Secure Checkout & Payment Selection

### User Story
> As a shopper on the checkout page, I want to review my order, select a payment method (Cash on Delivery or UPI), and place my order.

### Acceptance Criteria
- [ ] `/checkout` is a **protected route** — unauthenticated users are redirected to `/login?redirectedFrom=/checkout`
- [ ] Page shows an **Order Summary**: list of cart items (name, qty, price), subtotal, "Free Delivery" line, and **Grand Total**
- [ ] **Delivery Address** section shows the user's saved address with a "Change" link → `/checkout/address`
- [ ] **Payment Method** section with two options:
  - 🏠 **Cash on Delivery** — radio option, no extra fields
  - 📱 **UPI** — radio option, reveals a UPI ID text input (e.g. `yourname@upi`)
- [ ] **Place Order** button:
  - Disabled until a payment method is selected (and UPI ID filled if UPI chosen)
  - On click: saves order to Supabase `orders` table → clears cart → redirects to `/order-confirmation/[orderId]`
- [ ] `/order-confirmation/[orderId]` shows success screen: order ID, summary, estimated delivery (5–7 business days), and "Continue Shopping" CTA

### Supabase Migration — `orders` + `order_items` tables
```sql
-- supabase/migrations/0003_orders.sql
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  address_snapshot jsonb not null,   -- snapshot of address at time of order
  payment_method text not null check (payment_method in ('cod', 'upi')),
  upi_id text,                       -- only when payment_method = 'upi'
  subtotal integer not null,         -- INR paise or integer rupees (keep consistent)
  total integer not null,
  status text not null default 'confirmed' check (status in ('confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
  created_at timestamptz not null default now()
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  jewellery_item_id integer not null,
  name text not null,
  price integer not null,
  quantity integer not null default 1
);

alter table public.orders enable row level security;
alter table public.order_items enable row level security;

create policy "Users can view their own orders"
  on public.orders for select using (auth.uid() = user_id);

create policy "Users can insert their own orders"
  on public.orders for insert with check (auth.uid() = user_id);

create policy "Users can view their own order items"
  on public.order_items for select
  using (exists (
    select 1 from public.orders o
    where o.id = order_id and o.user_id = auth.uid()
  ));

create policy "Users can insert their own order items"
  on public.order_items for insert
  with check (exists (
    select 1 from public.orders o
    where o.id = order_id and o.user_id = auth.uid()
  ));
```

### Files to Create
```
app/checkout/page.tsx                    ← Server Component — auth guard + load address
app/checkout/CheckoutClient.tsx          ← "use client" — payment selection + place order
app/checkout/actions.ts                  ← Server Action: placeOrder()
app/order-confirmation/[id]/page.tsx     ← Order success page (Server Component)
```

### placeOrder Server Action
```ts
// app/checkout/actions.ts
"use server";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function placeOrder(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const paymentMethod = formData.get("paymentMethod") as "cod" | "upi";
  const upiId = formData.get("upiId") as string | null;
  const itemsJson = formData.get("items") as string;   // JSON-serialised CartItem[]
  const items = JSON.parse(itemsJson);

  // 1. Fetch address snapshot
  const { data: address } = await supabase
    .from("user_addresses")
    .select("*")
    .eq("user_id", user.id)
    .single();

  const subtotal = items.reduce((sum: number, i: { price: number; quantity: number }) =>
    sum + i.price * i.quantity, 0);

  // 2. Insert order
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      user_id: user.id,
      address_snapshot: address,
      payment_method: paymentMethod,
      upi_id: upiId || null,
      subtotal,
      total: subtotal, // free delivery
    })
    .select("id")
    .single();

  if (orderError || !order) throw new Error("Order creation failed");

  // 3. Insert order items
  const orderItems = items.map((i: { id: number; name: string; price: number; quantity: number }) => ({
    order_id: order.id,
    jewellery_item_id: i.id,
    name: i.name,
    price: i.price,
    quantity: i.quantity,
  }));

  await supabase.from("order_items").insert(orderItems);

  // Cart is cleared client-side after redirect via CartContext
  redirect(`/order-confirmation/${order.id}`);
}
```

---

## Implementation Sequence (Recommended Order)

Execute features in this order so each one builds on the previous:

| Step | Feature | Why this order |
|---|---|---|
| 1 | **Database migrations** | Run `0002_user_addresses.sql` + `0003_orders.sql` in Supabase first |
| 2 | **CartContext** | All subsequent features depend on cart state |
| 3 | **Product Detail Page** | Entry point to "Add to Cart" |
| 4 | **Cart Page** | Needs CartContext; precedes checkout |
| 5 | **Address Form** | Middleware between cart and checkout |
| 6 | **Checkout + Order Confirmation** | Final step — depends on all above |

---

## Design System Conventions (Apply Throughout)

```
Primary button   → variant="gradient"   (gold → rose gradient, already defined)
Ghost button     → variant="ghost"
Input fields     → use <Input> from @/components/ui/input
Labels           → use <Label> from @/components/ui/label
Cards            → rounded-aura-xl border-border-soft bg-ivory shadow-soft
Page wrapper     → mx-auto w-full max-w-5xl flex-1 px-4 pb-16
Section headings → font-serif text-3xl text-ink
Body text        → text-ink / text-ink-soft
Price            → text-gold font-semibold, formatted with formatINR() from @/lib/format
Error states     → use <Alert variant="destructive"> from @/components/ui/alert
```

---

## Environment Variables Required
No new env vars needed. The existing Supabase connection (`NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`) covers all new tables.

---

## Referenced Paths

> Note: paths marked "to be created" do not exist yet — they are the implementation targets defined in this spec.

### High Relevance
- `-jewellery-age-advisor/aura/components/recommendations/JewelleryCard.tsx` - Modified to add navigation link to product detail
- `-jewellery-age-advisor/aura/app/layout.tsx` - Modified to wrap with CartProvider
- `-jewellery-age-advisor/aura/components/auth/AuthHeader.tsx` - Modified to add cart icon
- `-jewellery-age-advisor/aura/types/jewellery.ts` - JewelleryItem type drives CartItem shape
- `-jewellery-age-advisor/aura/data/jewellery.ts` - Static catalog used by product detail page
- `-jewellery-age-advisor/aura/supabase/migrations/0001_favorites.sql` - Pattern for new migrations (existing)

### Medium Relevance
- `-jewellery-age-advisor/aura/app/results/page.tsx` - Context for how JewelleryCard is rendered in grids
- `-jewellery-age-advisor/aura/app/favorites/page.tsx` - Auth guard pattern to reuse in checkout
- `-jewellery-age-advisor/aura/lib/supabase/server.ts` - Server-side Supabase client for Server Actions
- `-jewellery-age-advisor/aura/lib/supabase/client.ts` - Browser Supabase client for CartContext hydration
- `-jewellery-age-advisor/aura/components/recommendations/ResultsGrid.tsx` - Grid pattern reference
- `-jewellery-age-advisor/aura/proxy.ts` - Middleware auth guard pattern
- `-jewellery-age-advisor/aura/lib/format.ts` - formatINR utility for price display

### Low Relevance
- `-jewellery-age-advisor/aura/components/ui/` - shadcn/ui primitives (Button, Input, Card, Label, Alert)
- `-jewellery-age-advisor/aura/app/globals.css` - Design token definitions
- `-jewellery-age-advisor/aura/package.json` - Dependency versions (Next 16, React 19, Supabase SSR)
