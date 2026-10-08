"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import {
  CART_STORAGE_KEY,
  cartReducer,
  cartTotals,
  initialCartState,
  parseStoredCart,
  serializeCart,
  type CartItem,
  type CartItemInput,
} from "@/lib/cart";

// Epic 10, Story 10.3 (Helix 2.1). All logic lives in lib/cart.ts; this file only wires React
// state to localStorage.
//
// Deviation from Helix 2.1: persistence is gated on `isHydrated`. Helix wrote the initial empty
// cart to localStorage before hydrating, which wiped the stored cart (and under React StrictMode
// in dev, lost it on refresh). The first server and client render both use an empty cart, so
// there is no hydration mismatch; items appear right after mount.

interface CartContextValue {
  items: CartItem[];
  isHydrated: boolean;
  addItem: (item: CartItemInput) => void;
  removeItem: (id: number) => void;
  updateQty: (id: number, qty: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextValue | null>(null);

function readStoredCart(): string | null {
  try {
    return window.localStorage.getItem(CART_STORAGE_KEY);
  } catch {
    // Storage unavailable (private mode, blocked cookies): the cart still works in memory.
    return null;
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialCartState);

  useEffect(() => {
    dispatch({ type: "HYDRATE", items: parseStoredCart(readStoredCart()) });
  }, []);

  useEffect(() => {
    if (!state.isHydrated) return;
    try {
      window.localStorage.setItem(CART_STORAGE_KEY, serializeCart(state.items));
    } catch {
      // Quota exceeded / storage unavailable: keep the in-memory cart, skip persistence.
    }
  }, [state.items, state.isHydrated]);

  const addItem = useCallback((item: CartItemInput) => dispatch({ type: "ADD_ITEM", item }), []);
  const removeItem = useCallback((id: number) => dispatch({ type: "REMOVE_ITEM", id }), []);
  const updateQty = useCallback(
    (id: number, qty: number) => dispatch({ type: "UPDATE_QTY", id, qty }),
    []
  );
  const clearCart = useCallback(() => dispatch({ type: "CLEAR_CART" }), []);

  const value = useMemo<CartContextValue>(() => {
    const { totalItems, totalPrice } = cartTotals(state.items);
    return {
      items: state.items,
      isHydrated: state.isHydrated,
      addItem,
      removeItem,
      updateQty,
      clearCart,
      totalItems,
      totalPrice,
    };
  }, [state.items, state.isHydrated, addItem, removeItem, updateQty, clearCart]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
