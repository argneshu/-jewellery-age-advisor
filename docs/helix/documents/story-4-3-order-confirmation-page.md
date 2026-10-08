---
helix_id: "5888"
title: "Story 4.3 — Order Confirmation Page"
solution_id: "1080"
synced_at: "2026-10-08"
helix_metadata: { artifact_type: "story", visibility: "team", lifecycle_state: "CURRENT", version: 1, parent_registry_id: 5877, created_by: "Argneshu Gupta", created_at: "2026-10-08T10:15:00.896217+00:00", updated_by: null, updated_at: "2026-10-08T10:15:00.896217+00:00" }
---

# Story 4.3 — Order Confirmation Page

**Epic:** Aura Shopping Flow
**Feature:** Secure Checkout
**Points:** 2
**Status:** TO DO
**Depends On:** Story 4.2 (Checkout Page)

---

## User Story

> As a shopper who just placed an order, I want to see a confirmation screen with my order details so I know my purchase was successful.

---

## Acceptance Criteria

- [ ] Route `/order-confirmation/[id]` renders a success page for the given order UUID
- [ ] Auth guard: guests → `/login`
- [ ] Unknown or other-user's order ID → `notFound()`
- [ ] Page displays: ✅ success icon, order ID (last 8 chars, e.g. `#A1B2C3D4`), ordered items list with quantities and prices, Grand Total, payment method, delivery address, estimated delivery (5–7 business days)
- [ ] **"Continue Shopping"** button → `/`

---

## Files to Create

```
-jewellery-age-advisor/aura/app/order-confirmation/[id]/page.tsx
```

---

## Implementation

```tsx
// app/order-confirmation/[id]/page.tsx — Server Component
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatINR } from "@/lib/format";

export default async function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: order } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("id", id)
    .single();

  if (!order) notFound();

  const shortId = order.id.replace(/-/g, "").slice(-8).toUpperCase();
  const address = order.address_snapshot as Record<string, string>;

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-16 pt-12">
      <div className="mb-10 text-center">
        <CheckCircle2 size={56} className="mx-auto mb-4 text-green-500" />
        <h1 className="font-serif text-3xl text-ink">Order Placed!</h1>
        <p className="mt-2 text-ink-soft">
          Thank you! Your order <span className="font-semibold text-ink">#{shortId}</span> is confirmed.
        </p>
        <p className="mt-1 text-sm text-ink-soft">
          Estimated delivery: <strong>5–7 business days</strong>
        </p>
      </div>

      <section className="rounded-aura-xl border border-border-soft bg-ivory p-6 shadow-soft mb-6">
        <h2 className="mb-4 font-serif text-xl text-ink">Items Ordered</h2>
        <div className="space-y-3">
          {order.order_items.map((item: { id: string; name: string; quantity: number; price: number }) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="text-ink">{item.name} <span className="text-ink-soft">× {item.quantity}</span></span>
              <span className="font-semibold text-gold">{formatINR(item.price * item.quantity)}</span>
            </div>
          ))}
        </div>
        <Separator className="my-4" />
        <div className="flex justify-between font-serif text-lg font-semibold text-ink">
          <span>Grand Total</span>
          <span className="text-gold">{formatINR(order.total)}</span>
        </div>
      </section>

      <section className="rounded-aura-xl border border-border-soft bg-ivory p-6 shadow-soft mb-8">
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <h3 className="mb-1 font-medium text-ink">Payment</h3>
            <p className="text-sm text-ink-soft">
              {order.payment_method === "cod" ? "Cash on Delivery" : `UPI — ${order.upi_id}`}
            </p>
          </div>
          <div>
            <h3 className="mb-1 font-medium text-ink">Delivering to</h3>
            <p className="text-sm text-ink-soft">
              {address.full_name}<br />
              {address.address_line1}
              {address.address_line2 && <>, {address.address_line2}</>}<br />
              {address.city}, {address.state} – {address.pincode}
            </p>
          </div>
        </div>
      </section>

      <div className="text-center">
        <Button variant="gradient" render={<Link href="/" />}>Continue Shopping</Button>
      </div>
    </main>
  );
}
```

---

## Definition of Done

- [ ] `/order-confirmation/[id]` renders correctly for valid order ID
- [ ] Unknown ID returns 404
- [ ] Guests redirected to `/login`
- [ ] All order details display correctly (items, total, payment, address)
- [ ] "Continue Shopping" → `/`
- [ ] No TypeScript errors

---

## Referenced Paths

### High Relevance
- `-jewellery-age-advisor/aura/lib/supabase/server.ts` - Fetch order from DB
- `-jewellery-age-advisor/aura/lib/format.ts` - formatINR() for price display

### Medium Relevance
- `-jewellery-age-advisor/aura/components/ui/button.tsx` - Continue Shopping CTA
- `-jewellery-age-advisor/aura/components/ui/separator.tsx` - Divider before total

### Low Relevance
- `-jewellery-age-advisor/aura/app/favorites/page.tsx` - Auth guard pattern reference
- `-jewellery-age-advisor/aura/app/layout.tsx` - Root layout wrapping this page
