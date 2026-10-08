import { describe, expect, it } from "vitest";
import { JEWELLERY_ITEMS } from "@/data/jewellery";
import {
  CART_STORAGE_KEY,
  MAX_QTY,
  cartReducer,
  cartBadgeText,
  cartLinkLabel,
  cartTotals,
  initialCartState,
  itemCountLabel,
  parseStoredCart,
  serializeCart,
  type CartItem,
  type CartState,
} from "@/lib/cart";

const A = JEWELLERY_ITEMS[0];
const B = JEWELLERY_ITEMS[1];

function input(item: (typeof JEWELLERY_ITEMS)[number]) {
  return {
    id: item.id,
    name: item.name,
    category: item.category,
    price: item.price,
    imagePath: item.imagePath,
    imageAlt: item.imageAlt,
  };
}

function line(item: (typeof JEWELLERY_ITEMS)[number], quantity: number): CartItem {
  return { ...input(item), quantity };
}

function hydrated(items: CartItem[]): CartState {
  return { items, isHydrated: true };
}

describe("cartReducer", () => {
  it("starts empty and not hydrated", () => {
    expect(initialCartState).toEqual({ items: [], isHydrated: false });
  });

  it("adds a new item with quantity 1", () => {
    const next = cartReducer(hydrated([]), { type: "ADD_ITEM", item: input(A) });
    expect(next.items).toEqual([line(A, 1)]);
  });

  it("increments quantity instead of duplicating an existing item", () => {
    const once = cartReducer(hydrated([]), { type: "ADD_ITEM", item: input(A) });
    const twice = cartReducer(once, { type: "ADD_ITEM", item: input(A) });
    expect(twice.items).toHaveLength(1);
    expect(twice.items[0].quantity).toBe(2);
  });

  it("never exceeds MAX_QTY when adding", () => {
    const state = hydrated([line(A, MAX_QTY)]);
    const next = cartReducer(state, { type: "ADD_ITEM", item: input(A) });
    expect(next.items[0].quantity).toBe(MAX_QTY);
  });

  it("ignores an item whose id is not in the catalog", () => {
    const state = hydrated([line(A, 1)]);
    const next = cartReducer(state, {
      type: "ADD_ITEM",
      item: { ...input(A), id: 999999 },
    });
    expect(next).toBe(state);
  });

  it("builds a new line from the catalog, ignoring caller-supplied price/name", () => {
    const next = cartReducer(hydrated([]), {
      type: "ADD_ITEM",
      item: { ...input(A), price: 1, name: "Forged" },
    });
    expect(next.items[0].price).toBe(A.price);
    expect(next.items[0].name).toBe(A.name);
  });

  it("removes an item", () => {
    const state = hydrated([line(A, 2), line(B, 1)]);
    const next = cartReducer(state, { type: "REMOVE_ITEM", id: A.id });
    expect(next.items).toEqual([line(B, 1)]);
  });

  it("updates a quantity", () => {
    const state = hydrated([line(A, 1)]);
    const next = cartReducer(state, { type: "UPDATE_QTY", id: A.id, qty: 4 });
    expect(next.items[0].quantity).toBe(4);
  });

  it("clamps an updated quantity to MAX_QTY", () => {
    const state = hydrated([line(A, 1)]);
    const next = cartReducer(state, { type: "UPDATE_QTY", id: A.id, qty: 99 });
    expect(next.items[0].quantity).toBe(MAX_QTY);
  });

  it.each([0, -1, -100])("removes the item when qty is %s", (qty) => {
    const state = hydrated([line(A, 3), line(B, 1)]);
    const next = cartReducer(state, { type: "UPDATE_QTY", id: A.id, qty });
    expect(next.items).toEqual([line(B, 1)]);
  });

  it.each([1.5, Number.NaN, Number.POSITIVE_INFINITY])(
    "ignores a non-integer quantity update (%s)",
    (qty) => {
      const state = hydrated([line(A, 3)]);
      const next = cartReducer(state, { type: "UPDATE_QTY", id: A.id, qty });
      expect(next).toBe(state);
    }
  );

  it("ignores a quantity update for an item that is not in the cart", () => {
    const state = hydrated([line(A, 3)]);
    const next = cartReducer(state, { type: "UPDATE_QTY", id: B.id, qty: 2 });
    expect(next).toBe(state);
  });

  it("clears the cart but keeps the hydrated flag", () => {
    const next = cartReducer(hydrated([line(A, 2)]), { type: "CLEAR_CART" });
    expect(next).toEqual({ items: [], isHydrated: true });
  });

  it("HYDRATE replaces the items and marks the cart hydrated", () => {
    const next = cartReducer(initialCartState, {
      type: "HYDRATE",
      items: [line(B, 2)],
    });
    expect(next).toEqual({ items: [line(B, 2)], isHydrated: true });
  });

  it("returns the same state for an unknown action", () => {
    const state = hydrated([line(A, 1)]);
    // @ts-expect-error — deliberately invalid action to exercise the default branch
    expect(cartReducer(state, { type: "NOPE" })).toBe(state);
  });
});

describe("parseStoredCart", () => {
  it("returns an empty cart for null", () => {
    expect(parseStoredCart(null)).toEqual([]);
  });

  it.each(["", "not json", "{", "undefined"])("returns an empty cart for invalid JSON (%s)", (raw) => {
    expect(parseStoredCart(raw)).toEqual([]);
  });

  it.each(["{}", '"x"', "42", "null", "true"])("returns an empty cart when the value is not an array (%s)", (raw) => {
    expect(parseStoredCart(raw)).toEqual([]);
  });

  it("drops elements that are not objects", () => {
    const raw = JSON.stringify([1, "a", null, [], { id: A.id, quantity: 1 }]);
    expect(parseStoredCart(raw)).toEqual([line(A, 1)]);
  });

  it("drops unknown ids", () => {
    const raw = JSON.stringify([{ id: 999999, quantity: 1 }, { id: A.id, quantity: 2 }]);
    expect(parseStoredCart(raw)).toEqual([line(A, 2)]);
  });

  it("drops a non-integer id", () => {
    const raw = JSON.stringify([{ id: "1", quantity: 1 }, { id: 1.5, quantity: 1 }]);
    expect(parseStoredCart(raw)).toEqual([]);
  });

  it.each([
    ["zero", 0],
    ["negative", -2],
    ["fractional", 1.5],
    ["a string", "2"],
    ["null", null],
  ])("drops a line whose quantity is %s", (_label, quantity) => {
    const raw = JSON.stringify([{ id: A.id, quantity }]);
    expect(parseStoredCart(raw)).toEqual([]);
  });

  it("clamps an over-large quantity to MAX_QTY", () => {
    const raw = JSON.stringify([{ id: A.id, quantity: 11 }]);
    expect(parseStoredCart(raw)).toEqual([line(A, MAX_QTY)]);
  });

  it("merges duplicate ids and caps the total at MAX_QTY", () => {
    const raw = JSON.stringify([
      { id: A.id, quantity: 6 },
      { id: A.id, quantity: 7 },
    ]);
    expect(parseStoredCart(raw)).toEqual([line(A, MAX_QTY)]);
  });

  it("replaces a forged price/name/category with the catalog values", () => {
    const raw = JSON.stringify([
      { id: A.id, quantity: 1, price: 1, name: "Forged", category: "Ring", imagePath: "/evil.png" },
    ]);
    const [only] = parseStoredCart(raw);
    expect(only).toEqual(line(A, 1));
  });

  it("round-trips through serializeCart", () => {
    const items = [line(A, 2), line(B, 5)];
    expect(parseStoredCart(serializeCart(items))).toEqual(items);
  });
});

describe("serializeCart", () => {
  it("stores only id and quantity (prices are never persisted)", () => {
    const serialized = serializeCart([line(A, 3)]);
    expect(JSON.parse(serialized)).toEqual([{ id: A.id, quantity: 3 }]);
  });

  it("serializes an empty cart as an empty array", () => {
    expect(serializeCart([])).toBe("[]");
  });
});

describe("cartTotals", () => {
  it("returns zeros for an empty cart", () => {
    expect(cartTotals([])).toEqual({ totalItems: 0, totalPrice: 0 });
  });

  it("sums quantities and line prices", () => {
    const totals = cartTotals([line(A, 2), line(B, 3)]);
    expect(totals.totalItems).toBe(5);
    expect(totals.totalPrice).toBe(A.price * 2 + B.price * 3);
  });
});

describe("constants", () => {
  it("uses the Helix storage key and a quantity cap of 10", () => {
    expect(CART_STORAGE_KEY).toBe("aura_cart");
    expect(MAX_QTY).toBe(10);
  });
});

describe("cartBadgeText", () => {
  it.each([
    [0, ""],
    [1, "1"],
    [5, "5"],
    [9, "9"],
    [10, "9+"],
    [42, "9+"],
  ])("shows %s item(s) as %j", (count, text) => {
    expect(cartBadgeText(count)).toBe(text);
  });

  it.each([-1, Number.NaN])("shows no badge for an invalid count (%s)", (count) => {
    expect(cartBadgeText(count)).toBe("");
  });
});

describe("cartLinkLabel", () => {
  it("is just 'View cart' when the cart is empty", () => {
    expect(cartLinkLabel(0)).toBe("View cart");
  });

  it("uses the singular for one item", () => {
    expect(cartLinkLabel(1)).toBe("View cart, 1 item");
  });

  it("uses the plural and the exact count for many items (never the capped '9+')", () => {
    expect(cartLinkLabel(3)).toBe("View cart, 3 items");
    expect(cartLinkLabel(27)).toBe("View cart, 27 items");
  });

  it("falls back to 'View cart' for an invalid count", () => {
    expect(cartLinkLabel(-2)).toBe("View cart");
    expect(cartLinkLabel(Number.NaN)).toBe("View cart");
  });
});

describe("itemCountLabel", () => {
  it.each([
    [1, "1 item"],
    [2, "2 items"],
    [10, "10 items"],
    [0, "0 items"],
  ])("labels %s as %j", (n, label) => {
    expect(itemCountLabel(n)).toBe(label);
  });
});
