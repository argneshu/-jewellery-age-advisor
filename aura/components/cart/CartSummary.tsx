"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { itemCountLabel } from "@/lib/cart";
import { formatINR } from "@/lib/format";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

// Epic 10, Story 10.7 (Helix 2.3). The client-side auth check only saves guests a round trip;
// /checkout enforces auth and the address check server-side (Story 10.9). The in-flight ref
// prevents a double click from starting two navigations.

export function CartSummary() {
  const { items, totalItems, totalPrice } = useCart();
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const inFlight = useRef(false);

  async function handleCheckout() {
    if (inFlight.current) return;
    inFlight.current = true;
    setPending(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      router.push(user ? "/checkout" : "/login?redirectedFrom=/checkout");
    } catch {
      // Network/auth lookup failed: /checkout re-checks on the server and sends guests to login.
      router.push("/checkout");
    } finally {
      inFlight.current = false;
      setPending(false);
    }
  }

  return (
    <div className="mt-8 rounded-aura-xl border border-border-soft bg-ivory p-6 shadow-soft">
      <div className="mb-1 flex justify-between text-sm text-ink-soft">
        <span>{itemCountLabel(totalItems)}</span>
      </div>
      <div className="flex justify-between font-serif text-lg font-semibold text-ink">
        <span>Subtotal</span>
        <span className="text-gold-deep">{formatINR(totalPrice)}</span>
      </div>
      <p className="mt-1 text-xs text-ink-soft">Delivery is free on every order.</p>
      <Button
        variant="gradient"
        className="mt-6 min-h-11 w-full"
        disabled={items.length === 0 || pending}
        onClick={handleCheckout}
      >
        {pending ? "Please wait…" : "Proceed to Checkout"}
      </Button>
    </div>
  );
}
