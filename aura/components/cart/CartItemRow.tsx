"use client";

import { Minus, Plus, X } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { MAX_QTY, type CartItem } from "@/lib/cart";
import { formatINR } from "@/lib/format";
import { gradientForCategory } from "@/lib/gradients";

// Epic 10, Story 10.7 (Helix 2.3). Layout per UI/UX spec: one row from 640px up; below 640px a
// two-line card stack (swatch + name + remove / stepper + line total) so nothing overflows at
// 375px. Tap targets are 44x44px around smaller visuals; every control is named per item.
// Prices use text-gold-deep (WCAG AA).

export function CartItemRow({ item }: { item: CartItem }) {
  const { updateQty, removeItem } = useCart();
  const atMax = item.quantity >= MAX_QTY;

  return (
    <li className="grid grid-cols-[4rem_1fr_auto] items-center gap-x-4 gap-y-3 rounded-aura-xl border border-border-soft bg-ivory p-4 shadow-soft sm:grid-cols-[4rem_1fr_auto_6rem_auto]">
      <div
        className="col-start-1 row-start-1 h-16 w-16 shrink-0 rounded-lg sm:col-auto sm:row-auto"
        style={{ background: gradientForCategory(item.category) }}
        aria-hidden="true"
      />

      <div className="col-start-2 row-start-1 min-w-0 sm:col-auto sm:row-auto">
        <p className="text-xs font-medium uppercase tracking-wide text-ink-soft">
          {item.category}
        </p>
        <p className="truncate font-serif text-base text-ink">{item.name}</p>
        <p className="text-sm font-semibold text-gold-deep">{formatINR(item.price)}</p>
        {atMax && <p className="text-xs text-ink-soft">Maximum {MAX_QTY} per item</p>}
      </div>

      <div
        role="group"
        aria-label={`Quantity of ${item.name}`}
        className="col-span-2 col-start-1 row-start-2 flex items-center sm:col-auto sm:row-auto"
      >
        <button
          type="button"
          onClick={() => updateQty(item.id, item.quantity - 1)}
          className="flex h-11 w-11 items-center justify-center rounded-full text-ink-soft outline-none transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-gold-deep"
          aria-label={`Decrease quantity of ${item.name}`}
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full border border-ink-soft">
            <Minus size={14} aria-hidden="true" />
          </span>
        </button>
        <span className="w-6 text-center text-sm font-medium text-ink" aria-live="polite">
          {item.quantity}
        </span>
        <button
          type="button"
          onClick={() => updateQty(item.id, item.quantity + 1)}
          disabled={atMax}
          className="flex h-11 w-11 items-center justify-center rounded-full text-ink-soft outline-none transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-gold-deep disabled:cursor-not-allowed disabled:opacity-40"
          aria-label={`Increase quantity of ${item.name}`}
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full border border-ink-soft">
            <Plus size={14} aria-hidden="true" />
          </span>
        </button>
      </div>

      <p className="col-start-3 row-start-2 justify-self-end text-right text-sm font-semibold text-ink sm:col-auto sm:row-auto sm:w-24">
        {formatINR(item.price * item.quantity)}
      </p>

      <button
        type="button"
        onClick={() => removeItem(item.id)}
        className="col-start-3 row-start-1 flex h-11 w-11 items-center justify-center justify-self-end rounded-full text-ink-soft outline-none transition-colors hover:text-rose-deep focus-visible:ring-2 focus-visible:ring-gold-deep sm:col-auto sm:row-auto"
        aria-label={`Remove ${item.name}`}
      >
        <X size={18} aria-hidden="true" />
      </button>
    </li>
  );
}
