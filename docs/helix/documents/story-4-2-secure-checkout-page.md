---
helix_id: "5881"
title: "Story 4.2 — Secure Checkout Page"
solution_id: "1080"
synced_at: "2026-10-08"
helix_metadata: { artifact_type: "story", visibility: "team", lifecycle_state: "CURRENT", version: 1, parent_registry_id: 5877, created_by: "Argneshu Gupta", created_at: "2026-10-08T10:15:00.570616+00:00", updated_by: null, updated_at: "2026-10-08T10:15:00.570616+00:00" }
---

# Story 4.2 — Secure Checkout Page

**Epic:** Aura Shopping Flow
**Feature:** Secure Checkout
**Points:** 5
**Status:** TO DO
**Depends On:** Story 3.3 (Route Guard), Story 4.1 (Orders DB Migration)

---

## User Story

> As a logged-in shopper with a saved address, I want to review my order, choose Cash on Delivery or UPI as my payment method, and place my order from a single secure page.

---

## Acceptance Criteria

- [ ] `/checkout` guarded (Story 3.3) — only reachable by authenticated users with a saved address
- [ ] Three sections: **Order Summary**, **Delivery Address**, **Payment Method**
- [ ] **Order Summary**: cart items (name, qty, unit price, line total), subtotal, "Free Delivery", Grand Total
- [ ] **Delivery Address**: saved address with "Change" link → `/checkout/address`
- [ ] **Payment Method**: two radio options
  - 🏠 Cash on Delivery — no extra fields
  - 📱 UPI — reveals UPI ID text input (required when UPI selected)
- [ ] **Place Order** button: disabled until payment method selected (and UPI ID filled if UPI); shows "Placing Order…" during submit
- [ ] On success → `clearCart()` called client-side → redirect to `/order-confirmation/[orderId]`
- [ ] Server errors shown in `<Alert variant="destructive">`

---

## Files to Create

```
-jewellery-age-advisor/aura/app/checkout/page.tsx
-jewellery-age-advisor/aura/app/checkout/CheckoutClient.tsx
-jewellery-age-advisor/aura/app/checkout/actions.ts
```

---

## Implementation

```tsx
// app/checkout/page.tsx — Server Component with guard
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CheckoutClient } from "./CheckoutClient";
import type { UserAddress } from "@/types/address";

export default async function CheckoutPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirectedFrom=/checkout");

  const { data: row } = await supabase.from("user_addresses").select("*").eq("user_id", user.id).single();
  if (!row) redirect("/checkout/address");

  const address: UserAddress = {
    id: row.id, userId: row.user_id, fullName: row.full_name, phone: row.phone,
    addressLine1: row.address_line1, addressLine2: row.address_line2 ?? undefined,
    city: row.city, state: row.state, pincode: row.pincode,
  };

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-16 pt-8">
      <h2 className="mb-8 font-serif text-3xl text-ink">Secure Checkout</h2>
      <CheckoutClient address={address} />
    </main>
  );
}
```

```tsx
// app/checkout/CheckoutClient.tsx — Client Component
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MapPin, Banknote, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { formatINR } from "@/lib/format";
import { gradientForCategory } from "@/lib/gradients";
import { useCart } from "@/context/CartContext";
import { placeOrder } from "./actions";
import type { UserAddress } from "@/types/address";

export function CheckoutClient({ address }: { address: UserAddress }) {
  const { items, totalPrice, clearCart } = useCart();
  const router = useRouter();
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "upi" | "">("");
  const [upiId, setUpiId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const canPlaceOrder = paymentMethod === "cod" || (paymentMethod === "upi" && upiId.trim().length > 0);

  async function handlePlaceOrder() {
    if (!canPlaceOrder) return;
    setIsPending(true); setError(null);
    try {
      const formData = new FormData();
      formData.set("paymentMethod", paymentMethod);
      formData.set("upiId", upiId);
      formData.set("items", JSON.stringify(items));
      const orderId = await placeOrder(formData);
      clearCart();
      router.push(`/order-confirmation/${orderId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Order could not be placed. Please try again.");
      setIsPending(false);
    }
  }

  return (
    <div className="space-y-6">
      {error && <Alert variant="destructive">{error}</Alert>}

      {/* Order Summary */}
      <section className="rounded-aura-xl border border-border-soft bg-ivory p-6 shadow-soft">
        <h3 className="mb-4 font-serif text-xl text-ink">Order Summary</h3>
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-3">
              <div className="h-10 w-10 shrink-0 rounded-lg" style={{ background: gradientForCategory(item.category) }} />
              <p className="flex-1 text-sm text-ink">{item.name}</p>
              <p className="text-xs text-ink-soft">×{item.quantity}</p>
              <p className="text-sm font-semibold text-gold">{formatINR(item.price * item.quantity)}</p>
            </div>
          ))}
        </div>
        <Separator className="my-4" />
        <div className="flex justify-between text-sm text-ink-soft">
          <span>Delivery</span><span className="font-medium text-green-600">Free</span>
        </div>
        <div className="mt-2 flex justify-between font-serif text-lg font-semibold text-ink">
          <span>Grand Total</span><span className="text-gold">{formatINR(totalPrice)}</span>
        </div>
      </section>

      {/* Delivery Address */}
      <section className="rounded-aura-xl border border-border-soft bg-ivory p-6 shadow-soft">
        <div className="flex items-start justify-between">
          <h3 className="font-serif text-xl text-ink flex items-center gap-2"><MapPin size={18} /> Delivery Address</h3>
          <Link href="/checkout/address" className="text-sm text-gold hover:underline">Change</Link>
        </div>
        <div className="mt-3 text-sm text-ink-soft space-y-0.5">
          <p className="font-medium text-ink">{address.fullName}</p>
          <p>{address.addressLine1}</p>
          {address.addressLine2 && <p>{address.addressLine2}</p>}
          <p>{address.city}, {address.state} – {address.pincode}</p>
          <p>📞 {address.phone}</p>
        </div>
      </section>

      {/* Payment Method */}
      <section className="rounded-aura-xl border border-border-soft bg-ivory p-6 shadow-soft">
        <h3 className="mb-4 font-serif text-xl text-ink">Payment Method</h3>
        <div className="space-y-3">
          <label className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-colors ${paymentMethod === "cod" ? "border-gold bg-gold/5" : "border-border-soft"}`}>
            <input type="radio" name="payment" value="cod" checked={paymentMethod === "cod"} onChange={() => { setPaymentMethod("cod"); setUpiId(""); }} className="accent-gold" />
            <Banknote size={20} className="text-ink-soft" />
            <div>
              <p className="font-medium text-ink">Cash on Delivery</p>
              <p className="text-xs text-ink-soft">Pay when your order arrives</p>
            </div>
          </label>
          <label className={`flex cursor-pointer flex-col gap-3 rounded-xl border p-4 transition-colors ${paymentMethod === "upi" ? "border-gold bg-gold/5" : "border-border-soft"}`}>
            <div className="flex items-center gap-3">
              <input type="radio" name="payment" value="upi" checked={paymentMethod === "upi"} onChange={() => setPaymentMethod("upi")} className="accent-gold" />
              <Smartphone size={20} className="text-ink-soft" />
              <div>
                <p className="font-medium text-ink">UPI</p>
                <p className="text-xs text-ink-soft">Pay instantly with your UPI ID</p>
              </div>
            </div>
            {paymentMethod === "upi" && (
              <div className="ml-7 space-y-1">
                <Label htmlFor="upiId">UPI ID</Label>
                <Input id="upiId" placeholder="yourname@upi" value={upiId} onChange={(e) => setUpiId(e.target.value)} autoFocus />
              </div>
            )}
          </label>
        </div>
      </section>

      <Button variant="gradient" className="w-full text-base py-3" disabled={!canPlaceOrder || isPending} onClick={handlePlaceOrder}>
        {isPending ? "Placing Order…" : "Place Order"}
      </Button>
    </div>
  );
}
```

```ts
// app/checkout/actions.ts
"use server";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { CartItem } from "@/context/CartContext";

export async function placeOrder(formData: FormData): Promise<string> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const paymentMethod = formData.get("paymentMethod") as "cod" | "upi";
  const upiId = (formData.get("upiId") as string) || null;
  const items: CartItem[] = JSON.parse(formData.get("items") as string);

  const { data: address, error: addrError } = await supabase.from("user_addresses").select("*").eq("user_id", user.id).single();
  if (addrError || !address) throw new Error("No delivery address found");

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const { data: order, error: orderError } = await supabase.from("orders").insert({
    user_id: user.id, address_snapshot: address, payment_method: paymentMethod, upi_id: upiId, subtotal, total: subtotal,
  }).select("id").single();
  if (orderError || !order) throw new Error("Failed to create order");

  const { error: itemsError } = await supabase.from("order_items").insert(
    items.map((i) => ({ order_id: order.id, jewellery_item_id: i.id, name: i.name, price: i.price, quantity: i.quantity }))
  );
  if (itemsError) throw new Error("Failed to save order items");

  return order.id;
}
```

---

## Definition of Done

- [ ] Three sections render correctly (order summary, address, payment)
- [ ] "Place Order" disabled until valid payment selection
- [ ] COD and UPI both create orders in Supabase
- [ ] Cart cleared after successful order
- [ ] Redirect to order confirmation page
- [ ] No TypeScript errors

---

## Referenced Paths

### High Relevance
- `-jewellery-age-advisor/aura/lib/supabase/server.ts` - Auth guard and order insertion
- `-jewellery-age-advisor/aura/lib/format.ts` - formatINR() for totals
- `-jewellery-age-advisor/aura/lib/gradients.ts` - gradientForCategory() for item swatches

### Medium Relevance
- `-jewellery-age-advisor/aura/components/ui/button.tsx` - Place Order button
- `-jewellery-age-advisor/aura/components/ui/input.tsx` - UPI ID input
- `-jewellery-age-advisor/aura/components/ui/alert.tsx` - Error display
- `-jewellery-age-advisor/aura/components/ui/separator.tsx` - Order summary divider

### Low Relevance
- `-jewellery-age-advisor/aura/app/favorites/page.tsx` - Auth pattern reference
