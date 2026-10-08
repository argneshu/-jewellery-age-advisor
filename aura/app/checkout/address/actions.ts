"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  formDataToObject,
  toAddressRow,
  validateAddressInput,
  type ActionResult,
} from "@/lib/checkout";

// Epic 10, Story 10.8 (Helix 3.2). Deviations from Helix: server-side validation (D2); expected
// failures are RETURNED (never thrown) and never carry raw database text; `redirect()` runs after
// all fallible work and outside any try/catch, because it works by throwing (Next.js docs:
// "redirect throws a control-flow exception"). Signature matches useActionState(saveAddress, null).

export type SaveAddressState = ActionResult<object> & {
  /** What the user typed, so the form can keep it when the server rejects the submission. */
  values?: Record<string, string>;
};

export async function saveAddress(
  _prevState: SaveAddressState | null,
  formData: FormData
): Promise<SaveAddressState> {
  const values = formDataToObject(formData);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Please sign in again.", values };
  }

  const parsed = validateAddressInput(values);
  if (!parsed.ok) {
    return {
      ok: false,
      error: "Please fix the highlighted fields.",
      fieldErrors: parsed.fieldErrors,
      values,
    };
  }

  const { error } = await supabase
    .from("user_addresses")
    .upsert(toAddressRow(user.id, parsed.value, new Date()), { onConflict: "user_id" });

  if (error) {
    // Error code only — never the message (may contain row data) and never PII.
    console.error("[saveAddress] upsert failed:", error.code);
    return { ok: false, error: "We could not save your address. Please try again.", values };
  }

  redirect("/checkout");
}
