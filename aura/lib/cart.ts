import { getCatalogItem } from "@/lib/catalog";
import type { JewelleryItem } from "@/types/jewellery";

// Epic 10, Story 10.3 (Helix 2.1). Pure cart logic — no React, no browser APIs — so it is
// fully unit-testable in the node-only Vitest setup (docs/architecture/design/03-…, §E10.9).
//
// Deviations from Helix 2.1 (architecture AD-1):
//  - Quantity is capped at MAX_QTY (10).
//  - The catalog is the only source of name/price/category/image: an item's price is NEVER
//    taken from the caller or from localStorage, so a stale or tampered cart cannot show or
//    carry a wrong price.
//  - Only { id, quantity } is persisted (serializeCart); everything else is rebuilt on load.

export const CART_STORAGE_KEY = "aura_cart";
export const MAX_QTY = 10;

export interface CartItem {
  id: number;
  name: string;
  category: string;
  price: number;
  imagePath: string;
  imageAlt: string;
  quantity: number;
}

export type CartItemInput = Omit<CartItem, "quantity">;

export interface CartState {
  items: CartItem[];
  isHydrated: boolean;
}

export type CartAction =
  | { type: "ADD_ITEM"; item: CartItemInput }
  | { type: "REMOVE_ITEM"; id: number }
  | { type: "UPDATE_QTY"; id: number; qty: number }
  | { type: "CLEAR_CART" }
  | { type: "HYDRATE"; items: CartItem[] };

export const initialCartState: CartState = { items: [], isHydrated: false };

function lineFromCatalog(item: JewelleryItem, quantity: number): CartItem {
  return {
    id: item.id,
    name: item.name,
    category: item.category,
    price: item.price,
    imagePath: item.imagePath,
    imageAlt: item.imageAlt,
    quantity,
  };
}

export function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "HYDRATE":
      return { items: action.items, isHydrated: true };

    case "ADD_ITEM": {
      const catalogItem = getCatalogItem(action.item.id);
      if (!catalogItem) return state;
      const existing = state.items.find((i) => i.id === catalogItem.id);
      if (existing) {
        return {
          ...state,
          items: state.items.map((i) =>
            i.id === catalogItem.id
              ? { ...i, quantity: Math.min(i.quantity + 1, MAX_QTY) }
              : i
          ),
        };
      }
      return { ...state, items: [...state.items, lineFromCatalog(catalogItem, 1)] };
    }

    case "REMOVE_ITEM":
      return { ...state, items: state.items.filter((i) => i.id !== action.id) };

    case "UPDATE_QTY": {
      if (!Number.isInteger(action.qty)) return state;
      if (!state.items.some((i) => i.id === action.id)) return state;
      if (action.qty <= 0) {
        return { ...state, items: state.items.filter((i) => i.id !== action.id) };
      }
      const qty = Math.min(action.qty, MAX_QTY);
      return {
        ...state,
        items: state.items.map((i) => (i.id === action.id ? { ...i, quantity: qty } : i)),
      };
    }

    case "CLEAR_CART":
      return { ...state, items: [] };

    default:
      return state;
  }
}

/**
 * Parses the raw `aura_cart` localStorage value. Never throws: anything malformed yields an
 * empty cart or drops only the bad lines. Only `id` and `quantity` are trusted; the rest of
 * each line is rebuilt from the catalog. Over-large quantities are clamped to MAX_QTY,
 * zero/negative/fractional/non-numeric quantities are dropped, duplicate ids are merged.
 */
export function parseStoredCart(raw: string | null): CartItem[] {
  if (raw === null) return [];
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(data)) return [];

  const quantityById = new Map<number, number>();
  for (const element of data) {
    if (typeof element !== "object" || element === null) continue;
    const { id, quantity } = element as Record<string, unknown>;
    if (typeof id !== "number" || !Number.isInteger(id)) continue;
    if (typeof quantity !== "number" || !Number.isInteger(quantity) || quantity < 1) continue;
    if (!getCatalogItem(id)) continue;
    quantityById.set(id, Math.min((quantityById.get(id) ?? 0) + quantity, MAX_QTY));
  }

  const items: CartItem[] = [];
  for (const [id, quantity] of quantityById) {
    const catalogItem = getCatalogItem(id);
    if (catalogItem) items.push(lineFromCatalog(catalogItem, quantity));
  }
  return items;
}

export function serializeCart(items: CartItem[]): string {
  return JSON.stringify(items.map((i) => ({ id: i.id, quantity: i.quantity })));
}

export function cartTotals(items: CartItem[]): { totalItems: number; totalPrice: number } {
  return {
    totalItems: items.reduce((sum, i) => sum + i.quantity, 0),
    totalPrice: items.reduce((sum, i) => sum + i.price * i.quantity, 0),
  };
}

/** Text shown inside the header cart badge: nothing for an empty cart, the count up to 9, then "9+". */
export function cartBadgeText(totalItems: number): string {
  if (!Number.isInteger(totalItems) || totalItems <= 0) return "";
  return totalItems > 9 ? "9+" : String(totalItems);
}

/** Accessible name of the header cart link; always the exact count, never the capped "9+". */
export function cartLinkLabel(totalItems: number): string {
  if (!Number.isInteger(totalItems) || totalItems <= 0) return "View cart";
  return `View cart, ${totalItems} ${totalItems === 1 ? "item" : "items"}`;
}

/** "1 item" / "N items" for the cart summary. */
export function itemCountLabel(count: number): string {
  return `${count} ${count === 1 ? "item" : "items"}`;
}
