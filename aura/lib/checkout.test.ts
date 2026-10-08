import { describe, expect, it } from "vitest";
import {
  ADDRESS_LIMITS,
  formDataToObject,
  isUuid,
  mapPlaceOrderError,
  MAX_ORDER_LINES,
  priceOrder,
  rowToUserAddress,
  shortOrderId,
  toAddressRow,
  validateAddressInput,
  validatePaymentMethod,
  validatePlaceOrderInput,
  validateUpiId,
} from "@/lib/checkout";

const valid = {
  fullName: "Asha Test",
  phone: "9876543210",
  addressLine1: "1 Main Street",
  addressLine2: "Near the park",
  city: "Pune",
  state: "Maharashtra",
  pincode: "411001",
};

function errorsFor(input: unknown) {
  const result = validateAddressInput(input);
  if (result.ok) throw new Error("expected validation to fail");
  return result.fieldErrors;
}

describe("validateAddressInput — valid input", () => {
  it("accepts a complete address and returns it unchanged", () => {
    const result = validateAddressInput(valid);
    expect(result).toEqual({ ok: true, value: valid });
  });

  it("treats address line 2 as optional (empty or whitespace → undefined)", () => {
    for (const addressLine2 of ["", "   ", undefined]) {
      const result = validateAddressInput({ ...valid, addressLine2 });
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.value.addressLine2).toBeUndefined();
    }
  });

  it("trims surrounding whitespace from every field", () => {
    const result = validateAddressInput({
      fullName: "  Asha Test ",
      phone: " 9876543210 ",
      addressLine1: " 1 Main Street  ",
      addressLine2: " Near the park ",
      city: " Pune ",
      state: " MH ",
      pincode: " 411001 ",
    });
    expect(result).toEqual({
      ok: true,
      value: { ...valid, state: "MH" },
    });
  });

  it("ignores unknown extra fields and never returns them", () => {
    const result = validateAddressInput({ ...valid, isAdmin: true, userId: "someone-else", id: "x" });
    expect(result.ok).toBe(true);
    if (result.ok) expect(Object.keys(result.value).sort()).toEqual(Object.keys(valid).sort());
  });

  it("accepts non-ASCII names and addresses", () => {
    const result = validateAddressInput({ ...valid, fullName: "Zoë Müller", city: "पुणे" });
    expect(result.ok).toBe(true);
  });

  it("accepts values exactly at the length limits", () => {
    const result = validateAddressInput({
      ...valid,
      fullName: "n".repeat(ADDRESS_LIMITS.fullName),
      addressLine1: "a".repeat(ADDRESS_LIMITS.addressLine1),
      addressLine2: "b".repeat(ADDRESS_LIMITS.addressLine2),
      city: "c".repeat(ADDRESS_LIMITS.city),
      state: "s".repeat(ADDRESS_LIMITS.state),
    });
    expect(result.ok).toBe(true);
  });
});

describe("validateAddressInput — required fields", () => {
  it.each(["fullName", "phone", "addressLine1", "city", "state", "pincode"] as const)(
    "rejects a missing %s",
    (field) => {
      const input: Record<string, unknown> = { ...valid };
      delete input[field];
      expect(Object.keys(errorsFor(input))).toEqual([field]);
    }
  );

  it.each(["fullName", "phone", "addressLine1", "city", "state", "pincode"] as const)(
    "rejects a whitespace-only %s",
    (field) => {
      expect(Object.keys(errorsFor({ ...valid, [field]: "   " }))).toEqual([field]);
    }
  );

  it("reports every missing field at once", () => {
    expect(Object.keys(errorsFor({})).sort()).toEqual(
      ["addressLine1", "city", "fullName", "phone", "pincode", "state"].sort()
    );
  });

  it.each([null, undefined, 42, "text", true, []])("rejects a non-object input (%j)", (input) => {
    expect(Object.keys(errorsFor(input)).sort()).toEqual(
      ["addressLine1", "city", "fullName", "phone", "pincode", "state"].sort()
    );
  });

  it("treats non-string field values as missing", () => {
    expect(Object.keys(errorsFor({ ...valid, fullName: 123, city: null }))).toEqual(["fullName", "city"]);
  });

  it("uses friendly messages from the UI/UX spec", () => {
    const errors = errorsFor({});
    expect(errors.fullName).toBe("Enter your full name");
    expect(errors.phone).toBe("Enter a 10-digit phone number");
    expect(errors.pincode).toBe("Enter a 6-digit pincode");
  });
});

describe("validateAddressInput — phone and pincode", () => {
  it.each(["987654321", "98765432101", "98765abcde", "98765 43210", "+919876543210", "98765-43210", "९८७६५४३२१०"])(
    "rejects the phone %j",
    (phone) => {
      expect(errorsFor({ ...valid, phone }).phone).toBe("Enter a 10-digit phone number");
    }
  );

  it.each(["41100", "4110011", "41100a", "411 001", "४११००१"])("rejects the pincode %j", (pincode) => {
    expect(errorsFor({ ...valid, pincode }).pincode).toBe("Enter a 6-digit pincode");
  });
});

describe("validateAddressInput — length limits", () => {
  it.each([
    ["fullName", ADDRESS_LIMITS.fullName],
    ["addressLine1", ADDRESS_LIMITS.addressLine1],
    ["addressLine2", ADDRESS_LIMITS.addressLine2],
    ["city", ADDRESS_LIMITS.city],
    ["state", ADDRESS_LIMITS.state],
  ] as const)("rejects %s longer than %i characters", (field, limit) => {
    const errors = errorsFor({ ...valid, [field]: "x".repeat(limit + 1) });
    expect(Object.keys(errors)).toEqual([field]);
    expect(errors[field]).toContain(String(limit));
  });
});

describe("formDataToObject", () => {
  it("keeps string entries and drops files", () => {
    const fd = new FormData();
    fd.set("fullName", "Asha");
    fd.set("upload", new Blob(["x"]), "x.txt");
    expect(formDataToObject(fd)).toEqual({ fullName: "Asha" });
  });

  it("round-trips into the validator", () => {
    const fd = new FormData();
    for (const [k, v] of Object.entries(valid)) fd.set(k, v);
    expect(validateAddressInput(formDataToObject(fd)).ok).toBe(true);
  });
});

describe("toAddressRow / rowToUserAddress", () => {
  const now = new Date("2026-10-08T10:00:00.000Z");

  it("maps to snake_case columns with the session user id and a timestamp", () => {
    expect(toAddressRow("user-1", valid, now)).toEqual({
      user_id: "user-1",
      full_name: "Asha Test",
      phone: "9876543210",
      address_line1: "1 Main Street",
      address_line2: "Near the park",
      city: "Pune",
      state: "Maharashtra",
      pincode: "411001",
      updated_at: "2026-10-08T10:00:00.000Z",
    });
  });

  it("stores a missing address line 2 as null", () => {
    const withoutLine2: Omit<typeof valid, "addressLine2"> & { addressLine2?: string } = { ...valid };
    delete withoutLine2.addressLine2;
    expect(toAddressRow("user-1", withoutLine2, now).address_line2).toBeNull();
  });

  it("maps a database row back to a UserAddress (null line 2 → omitted)", () => {
    const row = {
      id: "addr-1",
      user_id: "user-1",
      full_name: "Asha Test",
      phone: "9876543210",
      address_line1: "1 Main Street",
      address_line2: null,
      city: "Pune",
      state: "Maharashtra",
      pincode: "411001",
    };
    const address = rowToUserAddress(row);
    expect(address).toEqual({
      id: "addr-1",
      userId: "user-1",
      fullName: "Asha Test",
      phone: "9876543210",
      addressLine1: "1 Main Street",
      city: "Pune",
      state: "Maharashtra",
      pincode: "411001",
    });
    expect("addressLine2" in address).toBe(false);
  });

  it("keeps address line 2 when present", () => {
    const address = rowToUserAddress({
      id: "a", user_id: "u", full_name: "n", phone: "9876543210", address_line1: "l1",
      address_line2: "l2", city: "c", state: "s", pincode: "411001",
    });
    expect(address.addressLine2).toBe("l2");
  });
});

// ---- Story 10.10: order pricing / payment validation ----

const catalog = [
  { id: 1, name: "Tiny Gold Stud Set", price: 3500 },
  { id: 2, name: "Nameplate Charm Bracelet", price: 4200 },
  { id: 3, name: "Featherweight Anklet Pair", price: 2800 },
];

describe("validateUpiId", () => {
  it.each(["a.b@bank", "name-1_x@okaxis", "ab@upi"])("accepts %s", (id) => {
    expect(validateUpiId(id)).toEqual({ ok: true, value: id });
  });

  it("trims surrounding whitespace", () => {
    expect(validateUpiId("  name@upi  ")).toEqual({ ok: true, value: "name@upi" });
  });

  it.each(["", "a@upi", "nobank", "na me@upi", "name@u", "name@up1", "नाम@upi", "a@b@upi"])(
    "rejects %j",
    (id) => {
      expect(validateUpiId(id).ok).toBe(false);
    }
  );

  it("rejects more than 100 characters before the @", () => {
    expect(validateUpiId(`${"a".repeat(101)}@upi`).ok).toBe(false);
    expect(validateUpiId(`${"a".repeat(100)}@upi`).ok).toBe(true);
  });

  it("rejects non-strings", () => {
    expect(validateUpiId(undefined).ok).toBe(false);
    expect(validateUpiId(42).ok).toBe(false);
  });
});

describe("validatePaymentMethod", () => {
  it("accepts cod and upi only", () => {
    expect(validatePaymentMethod("cod")).toBe("cod");
    expect(validatePaymentMethod("upi")).toBe("upi");
    expect(validatePaymentMethod("card")).toBeNull();
    expect(validatePaymentMethod("COD")).toBeNull();
    expect(validatePaymentMethod(undefined)).toBeNull();
  });
});

describe("priceOrder", () => {
  it("prices a multi-line order from the catalog", () => {
    const result = priceOrder(
      [{ id: 1, quantity: 2 }, { id: 3, quantity: 1 }],
      catalog
    );
    expect(result).toEqual({
      ok: true,
      lines: [
        { jewellery_item_id: 1, name: "Tiny Gold Stud Set", price: 3500, quantity: 2 },
        { jewellery_item_id: 3, name: "Featherweight Anklet Pair", price: 2800, quantity: 1 },
      ],
      subtotal: 9800,
    });
  });

  it("ignores client-supplied price and name (forged values)", () => {
    const result = priceOrder([{ id: 1, quantity: 1, price: 1, name: "Free ring" }], catalog);
    expect(result).toMatchObject({ ok: true, subtotal: 3500 });
    if (result.ok) expect(result.lines[0]).toEqual({ jewellery_item_id: 1, name: "Tiny Gold Stud Set", price: 3500, quantity: 1 });
  });

  it("accepts quantity 1 and 10", () => {
    expect(priceOrder([{ id: 1, quantity: 10 }], catalog)).toMatchObject({ ok: true, subtotal: 35000 });
    expect(priceOrder([{ id: 1, quantity: 1 }], catalog).ok).toBe(true);
  });

  it.each([
    ["not an array", { id: 1, quantity: 1 }],
    ["null", null],
    ["a string", "items"],
    ["empty", []],
    ["unknown id", [{ id: 999, quantity: 1 }]],
    ["quantity 0", [{ id: 1, quantity: 0 }]],
    ["quantity 11", [{ id: 1, quantity: 11 }]],
    ["quantity 1.5", [{ id: 1, quantity: 1.5 }]],
    ["quantity as string", [{ id: 1, quantity: "2" }]],
    ["negative quantity", [{ id: 1, quantity: -1 }]],
    ["id as string", [{ id: "1", quantity: 1 }]],
    ["duplicate ids", [{ id: 1, quantity: 1 }, { id: 1, quantity: 2 }]],
    ["non-object line", [5]],
    ["null line", [null]],
  ])("rejects %s", (_label, input) => {
    expect(priceOrder(input, catalog).ok).toBe(false);
  });

  it("rejects more than the maximum number of lines", () => {
    const bigCatalog = Array.from({ length: MAX_ORDER_LINES + 1 }, (_, i) => ({ id: i + 1, name: `n${i}`, price: 100 }));
    const lines = bigCatalog.map((c) => ({ id: c.id, quantity: 1 }));
    expect(priceOrder(lines, bigCatalog).ok).toBe(false);
    expect(priceOrder(lines.slice(0, MAX_ORDER_LINES), bigCatalog).ok).toBe(true);
  });
});

describe("validatePlaceOrderInput", () => {
  const items = [{ id: 1, quantity: 2 }];

  it("accepts a COD order", () => {
    expect(validatePlaceOrderInput({ paymentMethod: "cod", items }, catalog)).toMatchObject({
      ok: true,
      paymentMethod: "cod",
      upiId: null,
      subtotal: 7000,
    });
  });

  it("accepts a UPI order with a valid UPI id", () => {
    expect(validatePlaceOrderInput({ paymentMethod: "upi", upiId: "me@okaxis", items }, catalog)).toMatchObject({
      ok: true,
      paymentMethod: "upi",
      upiId: "me@okaxis",
    });
  });

  it("drops a UPI id sent with COD", () => {
    expect(validatePlaceOrderInput({ paymentMethod: "cod", upiId: "me@okaxis", items }, catalog)).toMatchObject({
      ok: true,
      upiId: null,
    });
  });

  it.each([
    ["non-object", "x"],
    ["null", null],
    ["array", []],
    ["missing method", { items }],
    ["bad method", { paymentMethod: "card", items }],
    ["upi without id", { paymentMethod: "upi", items }],
    ["upi with bad id", { paymentMethod: "upi", upiId: "nope", items }],
    ["bad items", { paymentMethod: "cod", items: [] }],
  ])("rejects %s", (_label, input) => {
    expect(validatePlaceOrderInput(input, catalog).ok).toBe(false);
  });
});

describe("mapPlaceOrderError", () => {
  it("maps known database errors to safe messages", () => {
    expect(mapPlaceOrderError({ message: "no_address" })).toBe("Please add a delivery address first.");
    expect(mapPlaceOrderError({ message: "invalid_order" })).toBe(
      "Your cart could not be validated. Please review it and try again."
    );
    expect(mapPlaceOrderError({ message: "not_authenticated" })).toBe("Please sign in again.");
  });

  it("falls back to a generic message and never echoes raw text", () => {
    const message = mapPlaceOrderError({ message: 'duplicate key value violates "orders_pkey" for user x' });
    expect(message).toBe("Order could not be placed. Please try again.");
    expect(mapPlaceOrderError(null)).toBe("Order could not be placed. Please try again.");
    expect(mapPlaceOrderError({})).toBe("Order could not be placed. Please try again.");
  });
});

// ---- Story 10.11: order id helpers ----

describe("isUuid", () => {
  it("accepts lower- and upper-case UUIDs", () => {
    expect(isUuid("655c3713-9c63-4f33-9771-15c171e73199")).toBe(true);
    expect(isUuid("655C3713-9C63-4F33-9771-15C171E73199")).toBe(true);
  });

  it.each([
    "",
    "{655c3713-9c63-4f33-9771-15c171e73199}",
    "1 or 1=1; drop table orders",
    "655c3713-9c63-4f33-9771-15c171e7319",
    "655c3713-9c63-4f33-9771-15c171e731999",
    "655c3713-9c63-4f33-9771-15c171e7319g",
    "655c371390634f33977115c171e73199",
  ])("rejects %j", (value) => {
    expect(isUuid(value)).toBe(false);
  });
});

describe("shortOrderId", () => {
  it("strips dashes, keeps the last 8 characters and upper-cases them", () => {
    expect(shortOrderId("655c3713-9c63-4f33-9771-15c171e73199")).toBe("71E73199");
  });

  it("upper-cases letters", () => {
    expect(shortOrderId("00000000-0000-0000-0000-0000abcdef12")).toBe("ABCDEF12");
  });
});
