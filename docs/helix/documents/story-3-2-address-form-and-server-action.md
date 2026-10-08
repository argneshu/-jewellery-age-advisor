---
helix_id: "5887"
title: "Story 3.2 — Address Form & Server Action"
solution_id: "1080"
synced_at: "2026-10-08"
helix_metadata: { artifact_type: "story", visibility: "team", lifecycle_state: "CURRENT", version: 1, parent_registry_id: 5877, created_by: "Argneshu Gupta", created_at: "2026-10-08T10:15:00.873169+00:00", updated_by: null, updated_at: "2026-10-08T10:15:00.873169+00:00" }
---

# Story 3.2 — Address Form & Server Action

**Epic:** Aura Shopping Flow
**Feature:** Address Management
**Points:** 3
**Status:** TO DO
**Depends On:** Story 3.1 (Address DB Migration)

---

## User Story

> As a shopper who hasn't saved a delivery address, I want to fill in my address on a form and save it so I can proceed to checkout.

---

## Acceptance Criteria

- [ ] `/checkout/address` is accessible only to logged-in users; guests → `/login?redirectedFrom=/checkout/address`
- [ ] If user has a saved address, form is pre-populated; heading shows "Update Delivery Address"
- [ ] If no address, form is blank; heading shows "Add Delivery Address"
- [ ] Form fields: Full Name*, Phone (10 digits)*, Address Line 1*, Address Line 2 (optional), City*, State*, Pincode (6 digits)*
- [ ] Client-side `pattern` validation on phone and pincode
- [ ] Server Action `saveAddress()` upserts to `user_addresses`
- [ ] On success → redirect to `/checkout`
- [ ] Server errors shown in `<Alert variant="destructive">`
- [ ] "Cancel" link returns to `/cart`

---

## Files to Create

```
-jewellery-age-advisor/aura/app/checkout/address/page.tsx
-jewellery-age-advisor/aura/app/checkout/address/AddressForm.tsx
-jewellery-age-advisor/aura/app/checkout/address/actions.ts
```

---

## Implementation

```tsx
// app/checkout/address/page.tsx — Server Component
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AddressForm } from "./AddressForm";
import type { UserAddress } from "@/types/address";

export default async function AddressPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirectedFrom=/checkout/address");

  const { data: row } = await supabase.from("user_addresses").select("*").eq("user_id", user.id).single();
  const existing: UserAddress | null = row ? {
    id: row.id, userId: row.user_id, fullName: row.full_name, phone: row.phone,
    addressLine1: row.address_line1, addressLine2: row.address_line2 ?? undefined,
    city: row.city, state: row.state, pincode: row.pincode,
  } : null;

  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-4 pb-16 pt-8">
      <h2 className="mb-6 font-serif text-3xl text-ink">
        {existing ? "Update Delivery Address" : "Add Delivery Address"}
      </h2>
      <AddressForm existing={existing} />
    </main>
  );
}
```

```tsx
// app/checkout/address/AddressForm.tsx — Client Component
"use client";
import { useActionState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { saveAddress } from "./actions";
import type { UserAddress } from "@/types/address";

export function AddressForm({ existing }: { existing: UserAddress | null }) {
  const [error, formAction, isPending] = useActionState(
    async (_: string | null, formData: FormData) => {
      try { await saveAddress(formData); return null; }
      catch (e) { return e instanceof Error ? e.message : "Failed to save address"; }
    }, null
  );

  return (
    <form action={formAction} className="space-y-4">
      {error && <Alert variant="destructive">{error}</Alert>}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="fullName">Full Name *</Label>
          <Input id="fullName" name="fullName" required defaultValue={existing?.fullName} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="phone">Phone Number *</Label>
          <Input id="phone" name="phone" required pattern="[0-9]{10}" title="10-digit number" defaultValue={existing?.phone} />
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="addressLine1">Address Line 1 *</Label>
        <Input id="addressLine1" name="addressLine1" required defaultValue={existing?.addressLine1} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="addressLine2">Address Line 2 (optional)</Label>
        <Input id="addressLine2" name="addressLine2" defaultValue={existing?.addressLine2} />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1">
          <Label htmlFor="city">City *</Label>
          <Input id="city" name="city" required defaultValue={existing?.city} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="state">State *</Label>
          <Input id="state" name="state" required defaultValue={existing?.state} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="pincode">Pincode *</Label>
          <Input id="pincode" name="pincode" required pattern="[0-9]{6}" title="6-digit pincode" defaultValue={existing?.pincode} />
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <Button type="submit" variant="gradient" className="flex-1" disabled={isPending}>
          {isPending ? "Saving…" : "Save & Continue"}
        </Button>
        <Button variant="ghost" render={<Link href="/cart" />}>Cancel</Button>
      </div>
    </form>
  );
}
```

```ts
// app/checkout/address/actions.ts
"use server";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function saveAddress(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.from("user_addresses").upsert({
    user_id: user.id,
    full_name: formData.get("fullName") as string,
    phone: formData.get("phone") as string,
    address_line1: formData.get("addressLine1") as string,
    address_line2: (formData.get("addressLine2") as string) || null,
    city: formData.get("city") as string,
    state: formData.get("state") as string,
    pincode: formData.get("pincode") as string,
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id" });

  if (error) throw new Error(`Failed to save address: ${error.message}`);
  redirect("/checkout");
}
```

---

## Definition of Done

- [ ] `/checkout/address` redirects guests to `/login`
- [ ] Form pre-populated when address exists
- [ ] Validation works (required, phone 10 digits, pincode 6 digits)
- [ ] Successful save redirects to `/checkout`
- [ ] Cancel returns to `/cart`
- [ ] No TypeScript errors

---

## Referenced Paths

### High Relevance
- `-jewellery-age-advisor/aura/lib/supabase/server.ts` - Auth check and DB upsert
- `-jewellery-age-advisor/aura/app/favorites/page.tsx` - Auth guard redirect pattern

### Medium Relevance
- `-jewellery-age-advisor/aura/components/ui/input.tsx` - Form input component
- `-jewellery-age-advisor/aura/components/ui/label.tsx` - Label component
- `-jewellery-age-advisor/aura/components/ui/button.tsx` - Button variants
- `-jewellery-age-advisor/aura/components/ui/alert.tsx` - Error display

### Low Relevance
- `-jewellery-age-advisor/aura/supabase/migrations/0001_favorites.sql` - RLS pattern reference
