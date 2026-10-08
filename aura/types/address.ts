// Epic 10, Story 10.1 (Helix 3.1). Delivery address, one per user (table public.user_addresses,
// migration 0002). Field names are camelCase here; DB columns are snake_case and mapped at the
// boundary (same convention as FavoriteRecord in types/auth.ts).

export interface UserAddress {
  id: string;
  userId: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
}

/** What the address form submits (no id/userId — the server takes the user from the session). */
export type AddressInput = Omit<UserAddress, "id" | "userId">;
