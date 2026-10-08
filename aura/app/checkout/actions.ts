"use server";

import { createClient } from "@/lib/supabase/server";
import { JEWELLERY_ITEMS } from "@/data/jewellery";
import { mapPlaceOrderError, validatePlaceOrderInput } from "@/lib/checkout";

// Epic 10, Story 10.10 (Helix 4.2). Deviations from Helix: the browser sends ids + quantities only;
// names/prices come from the catalog (D1); input is validated server-side; the order is created
// atomically by the place_order SQL function (D3); expected failures are RETURNED, never thrown,
// and never carry raw database text. Only the error code is logged — never PII or the UPI id.

export type PlaceOrderResult = { ok: true; orderId: string } | { ok: false; error: string };

export async function placeOrder(input: unknown): Promise<PlaceOrderResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Please sign in again." };

  const validated = validatePlaceOrderInput(input, JEWELLERY_ITEMS);
  if (!validated.ok) return { ok: false, error: validated.error };

  const { data, error } = await supabase.rpc("place_order", {
    p_payment_method: validated.paymentMethod,
    p_upi_id: validated.upiId,
    p_items: validated.lines,
  });

  if (error || typeof data !== "string") {
    console.error("[place_order]", error?.code ?? "no_data");
    return { ok: false, error: mapPlaceOrderError(error) };
  }

  return { ok: true, orderId: data };
}
