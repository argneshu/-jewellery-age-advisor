"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { CartItemRow } from "@/components/cart/CartItemRow";
import { CartSummary } from "@/components/cart/CartSummary";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";

// Epic 10, Story 10.7 (Helix 2.3). Until the cart has loaded from localStorage only the heading
// is shown (UI/UX spec) — no "empty cart" flash on refresh. Public page (guests can build a cart).
// Deviation: Helix's summary said "Delivery charges calculated at checkout"; Story 4.2 makes
// delivery always free, so the summary says so.

export default function CartPage() {
  const { items, isHydrated } = useCart();

  if (!isHydrated) {
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-16">
        <h2 className="mb-8 font-serif text-3xl text-ink">Your Cart</h2>
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center gap-6 px-4 pb-16 py-20">
        <ShoppingBag size={48} className="text-ink-soft" aria-hidden="true" />
        <h2 className="font-serif text-2xl text-ink">Your cart is empty</h2>
        <p className="text-sm text-ink-soft">Discover jewellery curated just for you</p>
        <Button
          variant="gradient"
          className="min-h-11"
          nativeButton={false}
          render={<Link href="/" />}
        >
          Browse Jewellery
        </Button>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-16">
      <h2 className="mb-8 font-serif text-3xl text-ink">Your Cart</h2>
      <ul className="space-y-4">
        {items.map((item) => (
          <CartItemRow key={item.id} item={item} />
        ))}
      </ul>
      <CartSummary />
    </main>
  );
}
