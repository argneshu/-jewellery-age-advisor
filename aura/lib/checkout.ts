import type { AddressInput, UserAddress } from "@/types/address";

// Epic 10 checkout logic (pure — no React, no Next, no Supabase), shared by the browser form and
// the Server Actions so both enforce the SAME rules and messages. The database enforces the same
// limits again with CHECK constraints (migration 0002), so bypassing the UI cannot store junk.
//
// Story 10.8 (this file's first part): address validation + row mapping.
// Story 10.10 adds order pricing/validation; Story 10.11 adds the order-id helpers.

/** Result returned by Server Actions: expected failures are returned, never thrown (patterns §E10.2). */
export type ActionResult<T extends object = object> =
  | ({ ok: true } & T)
  | { ok: false; error: string; fieldErrors?: Partial<Record<string, string>> };

export const ADDRESS_LIMITS = {
  fullName: 100,
  addressLine1: 200,
  addressLine2: 200,
  city: 100,
  state: 100,
} as const;

export type AddressField = keyof AddressInput;
export type AddressFieldErrors = Partial<Record<AddressField, string>>;
export type AddressValidation =
  | { ok: true; value: AddressInput }
  | { ok: false; fieldErrors: AddressFieldErrors };

const PHONE_PATTERN = /^[0-9]{10}$/;
const PINCODE_PATTERN = /^[0-9]{6}$/;

function readString(source: Record<string, unknown>, key: string): string {
  const value = source[key];
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Validates and normalises address input (a plain object, e.g. from `formDataToObject`).
 * Unknown keys are ignored and never returned; every string is trimmed; address line 2 is optional.
 */
export function validateAddressInput(raw: unknown): AddressValidation {
  const source: Record<string, unknown> =
    typeof raw === "object" && raw !== null && !Array.isArray(raw)
      ? (raw as Record<string, unknown>)
      : {};

  const fullName = readString(source, "fullName");
  const phone = readString(source, "phone");
  const addressLine1 = readString(source, "addressLine1");
  const addressLine2 = readString(source, "addressLine2");
  const city = readString(source, "city");
  const state = readString(source, "state");
  const pincode = readString(source, "pincode");

  const fieldErrors: AddressFieldErrors = {};
  const tooLong = (label: string, limit: number) => `${label} must be ${limit} characters or fewer`;

  if (!fullName) fieldErrors.fullName = "Enter your full name";
  else if (fullName.length > ADDRESS_LIMITS.fullName) fieldErrors.fullName = tooLong("Full name", ADDRESS_LIMITS.fullName);

  if (!PHONE_PATTERN.test(phone)) fieldErrors.phone = "Enter a 10-digit phone number";

  if (!addressLine1) fieldErrors.addressLine1 = "Enter your address";
  else if (addressLine1.length > ADDRESS_LIMITS.addressLine1) fieldErrors.addressLine1 = tooLong("Address line 1", ADDRESS_LIMITS.addressLine1);

  if (addressLine2.length > ADDRESS_LIMITS.addressLine2) fieldErrors.addressLine2 = tooLong("Address line 2", ADDRESS_LIMITS.addressLine2);

  if (!city) fieldErrors.city = "Enter your city";
  else if (city.length > ADDRESS_LIMITS.city) fieldErrors.city = tooLong("City", ADDRESS_LIMITS.city);

  if (!state) fieldErrors.state = "Enter your state";
  else if (state.length > ADDRESS_LIMITS.state) fieldErrors.state = tooLong("State", ADDRESS_LIMITS.state);

  if (!PINCODE_PATTERN.test(pincode)) fieldErrors.pincode = "Enter a 6-digit pincode";

  if (Object.keys(fieldErrors).length > 0) return { ok: false, fieldErrors };

  return {
    ok: true,
    value: {
      fullName,
      phone,
      addressLine1,
      ...(addressLine2 ? { addressLine2 } : {}),
      city,
      state,
      pincode,
    },
  };
}

/** Keeps only the string entries of a FormData (files are dropped). */
export function formDataToObject(formData: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") out[key] = value;
  }
  return out;
}

/** Columns written to public.user_addresses. The user id always comes from the session, never from input. */
export interface AddressRowPayload {
  user_id: string;
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  pincode: string;
  updated_at: string;
}

export function toAddressRow(userId: string, address: AddressInput, now: Date): AddressRowPayload {
  return {
    user_id: userId,
    full_name: address.fullName,
    phone: address.phone,
    address_line1: address.addressLine1,
    address_line2: address.addressLine2 ?? null,
    city: address.city,
    state: address.state,
    pincode: address.pincode,
    updated_at: now.toISOString(),
  };
}

/** A row read back from public.user_addresses. */
export interface AddressRow {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  pincode: string;
}

export function rowToUserAddress(row: AddressRow): UserAddress {
  return {
    id: row.id,
    userId: row.user_id,
    fullName: row.full_name,
    phone: row.phone,
    addressLine1: row.address_line1,
    ...(row.address_line2 ? { addressLine2: row.address_line2 } : {}),
    city: row.city,
    state: row.state,
    pincode: row.pincode,
  };
}

// ---- Story 10.10: order validation and pricing (server-trusted) ----
// The browser sends only ids + quantities (+ payment choice). Names and prices ALWAYS come from the
// catalog here, so a tampered cart can never change what is charged (D1). place_order re-checks shape
// and arithmetic in the database; it cannot verify catalog prices (residual risk R1).

export const MAX_ORDER_LINES = 40;
export const MAX_LINE_QUANTITY = 10;

export type PaymentMethod = "cod" | "upi";

export interface CatalogEntry {
  id: number;
  name: string;
  price: number;
}

/** One priced line, shaped for the place_order SQL function's p_items argument. */
export interface PricedLine {
  jewellery_item_id: number;
  name: string;
  price: number;
  quantity: number;
}

// Mirrors the place_order function's UPI rule so browser, server and database agree.
const UPI_PATTERN = /^[A-Za-z0-9._-]{2,100}@[A-Za-z]{2,64}$/;

export function validateUpiId(raw: unknown): { ok: true; value: string } | { ok: false; error: string } {
  const value = typeof raw === "string" ? raw.trim() : "";
  if (!UPI_PATTERN.test(value)) return { ok: false, error: "Enter a valid UPI ID, like name@bank" };
  return { ok: true, value };
}

export function validatePaymentMethod(raw: unknown): PaymentMethod | null {
  return raw === "cod" || raw === "upi" ? raw : null;
}

export type PriceOrderResult =
  | { ok: true; lines: PricedLine[]; subtotal: number }
  | { ok: false; error: string };

const INVALID_CART = "Your cart could not be validated. Please review it and try again.";

export function priceOrder(rawItems: unknown, catalog: readonly CatalogEntry[]): PriceOrderResult {
  if (!Array.isArray(rawItems) || rawItems.length < 1 || rawItems.length > MAX_ORDER_LINES) {
    return { ok: false, error: INVALID_CART };
  }

  const byId = new Map(catalog.map((entry) => [entry.id, entry]));
  const seen = new Set<number>();
  const lines: PricedLine[] = [];

  for (const raw of rawItems) {
    if (typeof raw !== "object" || raw === null) return { ok: false, error: INVALID_CART };
    const { id, quantity } = raw as Record<string, unknown>;
    if (typeof id !== "number" || !Number.isInteger(id) || seen.has(id)) return { ok: false, error: INVALID_CART };
    if (typeof quantity !== "number" || !Number.isInteger(quantity) || quantity < 1 || quantity > MAX_LINE_QUANTITY) {
      return { ok: false, error: INVALID_CART };
    }
    const entry = byId.get(id);
    if (!entry) return { ok: false, error: INVALID_CART };
    seen.add(id);
    lines.push({ jewellery_item_id: entry.id, name: entry.name, price: entry.price, quantity });
  }

  const subtotal = lines.reduce((sum, line) => sum + line.price * line.quantity, 0);
  return { ok: true, lines, subtotal };
}

export type PlaceOrderValidation =
  | { ok: true; paymentMethod: PaymentMethod; upiId: string | null; lines: PricedLine[]; subtotal: number }
  | { ok: false; error: string };

export function validatePlaceOrderInput(raw: unknown, catalog: readonly CatalogEntry[]): PlaceOrderValidation {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return { ok: false, error: INVALID_CART };
  const input = raw as Record<string, unknown>;

  const paymentMethod = validatePaymentMethod(input.paymentMethod);
  if (!paymentMethod) return { ok: false, error: "Choose a payment method." };

  let upiId: string | null = null;
  if (paymentMethod === "upi") {
    const upi = validateUpiId(input.upiId);
    if (!upi.ok) return { ok: false, error: upi.error };
    upiId = upi.value;
  }

  const priced = priceOrder(input.items, catalog);
  if (!priced.ok) return priced;

  return { ok: true, paymentMethod, upiId, lines: priced.lines, subtotal: priced.subtotal };
}

const GENERIC_ORDER_ERROR = "Order could not be placed. Please try again.";

/** Maps a place_order database error to a user-safe message; raw database text is never returned. */
export function mapPlaceOrderError(error: { message?: string } | null): string {
  const message = error?.message ?? "";
  if (message.includes("no_address")) return "Please add a delivery address first.";
  if (message.includes("invalid_order")) return INVALID_CART;
  if (message.includes("not_authenticated")) return "Please sign in again.";
  return GENERIC_ORDER_ERROR;
}

// ---- Story 10.11: order id helpers ----

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** True only for a canonical hyphenated UUID; checked before any database query so junk ids become a 404. */
export function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}

/** Human-friendly order reference: the last 8 hex characters, upper-case (e.g. A1B2C3D4). */
export function shortOrderId(id: string): string {
  return id.replace(/-/g, "").slice(-8).toUpperCase();
}
