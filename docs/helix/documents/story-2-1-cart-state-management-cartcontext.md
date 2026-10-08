---
helix_id: "5886"
title: "Story 2.1 — Cart State Management (CartContext)"
solution_id: "1080"
synced_at: "2026-10-08"
helix_metadata: { artifact_type: "story", visibility: "team", lifecycle_state: "CURRENT", version: 1, parent_registry_id: 5877, created_by: "Argneshu Gupta", created_at: "2026-10-08T10:15:00.797817+00:00", updated_by: null, updated_at: "2026-10-08T10:15:00.797817+00:00" }
---

# Story 2.1 — Cart State Management (CartContext)

**Epic:** Aura Shopping Flow
**Feature:** Cart
**Points:** 3
**Status:** TO DO
**Depends On:** —

---

## User Story

> As a shopper, I want my cart to persist across page navigations so that items I add don't disappear when I move between pages.

---

## Background

Foundational story for the entire cart and checkout flow. All other stories (2.2, 2.3, 1.2, 3.3, 4.2) depend on this.

Cart state is stored in:
- **React Context + useReducer** — in-memory state during the session
- **localStorage** (`aura_cart` key) — persisted across page refreshes, no login required

---

## Acceptance Criteria

- [ ] `CartContext` provides: `items`, `addItem()`, `removeItem()`, `updateQty()`, `clearCart()`, `totalItems`, `totalPrice`
- [ ] Adding an item that already exists **increments its quantity** (no duplicates)
- [ ] `updateQty(id, 0)` removes the item
- [ ] Cart is **hydrated from localStorage** on first render (`HYDRATE` action)
- [ ] Every state change is **written back to localStorage** (`aura_cart` key)
- [ ] `CartProvider` wraps `{children}` in `app/layout.tsx`
- [ ] `useCart()` throws a descriptive error if used outside `CartProvider`

---

## Files to Create

```
-jewellery-age-advisor/aura/context/CartContext.tsx
```

## Files to Modify

```
-jewellery-age-advisor/aura/app/layout.tsx
```

---

## Implementation

```tsx
// context/CartContext.tsx
"use client";
import { createContext, useContext, useReducer, useEffect, type ReactNode } from "react";

export interface CartItem {
  id: number;
  name: string;
  category: string;
  price: number;
  imagePath: string;
  imageAlt: string;
  quantity: number;
}

type CartAction =
  | { type: "ADD_ITEM"; item: Omit<CartItem, "quantity"> }
  | { type: "REMOVE_ITEM"; id: number }
  | { type: "UPDATE_QTY"; id: number; qty: number }
  | { type: "CLEAR_CART" }
  | { type: "HYDRATE"; items: CartItem[] };

function cartReducer(state: { items: CartItem[] }, action: CartAction) {
  switch (action.type) {
    case "HYDRATE": return { items: action.items };
    case "ADD_ITEM": {
      const existing = state.items.find((i) => i.id === action.item.id);
      if (existing) return { items: state.items.map((i) => i.id === action.item.id ? { ...i, quantity: i.quantity + 1 } : i) };
      return { items: [...state.items, { ...action.item, quantity: 1 }] };
    }
    case "REMOVE_ITEM": return { items: state.items.filter((i) => i.id !== action.id) };
    case "UPDATE_QTY":
      if (action.qty <= 0) return { items: state.items.filter((i) => i.id !== action.id) };
      return { items: state.items.map((i) => i.id === action.id ? { ...i, quantity: action.qty } : i) };
    case "CLEAR_CART": return { items: [] };
    default: return state;
  }
}

const CartContext = createContext<{
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (id: number) => void;
  updateQty: (id: number, qty: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
} | null>(null);

const STORAGE_KEY = "aura_cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [] });

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) dispatch({ type: "HYDRATE", items: JSON.parse(stored) });
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items));
  }, [state.items]);

  return (
    <CartContext.Provider value={{
      items: state.items,
      addItem: (item) => dispatch({ type: "ADD_ITEM", item }),
      removeItem: (id) => dispatch({ type: "REMOVE_ITEM", id }),
      updateQty: (id, qty) => dispatch({ type: "UPDATE_QTY", id, qty }),
      clearCart: () => dispatch({ type: "CLEAR_CART" }),
      totalItems: state.items.reduce((sum, i) => sum + i.quantity, 0),
      totalPrice: state.items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
```

```tsx
// app/layout.tsx — wrap body children
import { CartProvider } from "@/context/CartContext";
// ...
<body className="min-h-full flex flex-col bg-cream text-ink font-sans">
  <CartProvider>
    <AuthHeader />
    {children}
  </CartProvider>
</body>
```

---

## Definition of Done

- [ ] `context/CartContext.tsx` created
- [ ] `app/layout.tsx` wraps with `<CartProvider>`
- [ ] Adding same item twice → quantity=2, not two entries
- [ ] Cart survives page refresh (localStorage hydration)
- [ ] `clearCart()` empties state and localStorage
- [ ] No TypeScript errors

---

## Referenced Paths

### High Relevance
- `-jewellery-age-advisor/aura/app/layout.tsx` - Modified to add CartProvider

### Low Relevance
- `-jewellery-age-advisor/aura/types/jewellery.ts` - JewelleryItem shape informs CartItem fields
