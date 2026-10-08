import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { rowToUserAddress } from "@/lib/checkout";
import { CheckoutClient } from "./CheckoutClient";

// Epic 10, Stories 10.9 + 10.10 (Helix 3.3 / 4.2). Server-side guards cannot be bypassed client-side;
// the proxy (route-rules.ts) is the first layer. `.maybeSingle()` (not Helix's `.single()`): no row is
// not an error, and a genuine query error goes to Next's error boundary instead of silently sending a
// shopper with a saved address to the address form. An empty cart is handled client-side after hydration.

export default async function CheckoutPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirectedFrom=/checkout");

  const { data: row, error } = await supabase
    .from("user_addresses")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) throw new Error(`Failed to load your address (${error.code})`);
  if (!row) redirect("/checkout/address");

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-16 pt-8">
      <h2 className="mb-8 font-serif text-3xl text-ink">Secure Checkout</h2>
      <CheckoutClient address={rowToUserAddress(row)} />
    </main>
  );
}
