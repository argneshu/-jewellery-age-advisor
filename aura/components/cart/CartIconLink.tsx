"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { cartBadgeText, cartLinkLabel } from "@/lib/cart";

// Epic 10, Story 10.6 (Helix 2.2). A small client component so AuthHeader (an async Server
// Component) keeps its server boundary. UI/UX spec: 44x44px hit area, rose-deep badge with white
// 12px text (5.38:1), accessible name carries the exact count. Before the cart has loaded from
// localStorage the count is 0, so the server render and first client render match.

export function CartIconLink() {
  const { totalItems } = useCart();
  const badge = cartBadgeText(totalItems);

  return (
    <Link
      href="/cart"
      aria-label={cartLinkLabel(totalItems)}
      className="relative flex h-11 w-11 items-center justify-center rounded-full text-ink-soft outline-none transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-gold-deep focus-visible:ring-offset-2"
    >
      <ShoppingBag size={22} aria-hidden="true" />
      {badge && (
        <span
          aria-hidden="true"
          className="absolute right-0 top-0 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-deep px-1 text-xs font-semibold leading-none text-white"
        >
          {badge}
        </span>
      )}
    </Link>
  );
}
