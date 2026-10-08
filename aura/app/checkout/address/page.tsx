import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { rowToUserAddress } from "@/lib/checkout";
import { AddressForm } from "./AddressForm";

// Epic 10, Story 10.8 (Helix 3.2). The optional existing address is read with .maybeSingle()
// (no row is not an error); a genuine query error is thrown to Next's default error page instead
// of silently showing an empty form that would overwrite a saved address.

export default async function AddressPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirectedFrom=/checkout/address");

  const { data: row, error } = await supabase
    .from("user_addresses")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) throw new Error(`Failed to load your address (${error.code})`);

  const existing = row ? rowToUserAddress(row) : null;

  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-4 pb-16 pt-8">
      <h2 className="mb-6 font-serif text-3xl text-ink">
        {existing ? "Update Delivery Address" : "Add Delivery Address"}
      </h2>
      <AddressForm existing={existing} />
    </main>
  );
}
