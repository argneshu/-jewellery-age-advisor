"use client";

import { useActionState, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  formDataToObject,
  validateAddressInput,
  type AddressField,
  type AddressFieldErrors,
} from "@/lib/checkout";
import type { UserAddress } from "@/types/address";
import { saveAddress, type SaveAddressState } from "./actions";

// Epic 10, Story 10.8 (Helix 3.2) + UI/UX spec: noValidate; on submit the SAME pure validators
// the server uses run first (inline errors, focus on the first invalid field); server errors
// appear in a destructive Alert; fields are disabled while saving; inputs carry autocomplete and
// numeric-keyboard hints; layout is 1 column <640, name|phone from 640, city|state|pincode from 768.
// The action is passed straight to useActionState — no try/catch wrapper (it would swallow redirect()).

const FIELD_ORDER: AddressField[] = ["fullName", "phone", "addressLine1", "addressLine2", "city", "state", "pincode"];

export function AddressForm({ existing }: { existing: UserAddress | null }) {
  const [state, formAction, isPending] = useActionState<SaveAddressState | null, FormData>(saveAddress, null);
  const [clientErrors, setClientErrors] = useState<AddressFieldErrors | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const serverErrors = state && !state.ok ? state.fieldErrors : undefined;
  const errors: AddressFieldErrors = { ...(serverErrors ?? {}), ...(clientErrors ?? {}) };
  const serverMessage = state && !state.ok && !state.fieldErrors ? state.error : null;
  // React resets uncontrolled fields after an action finishes; keep what the user typed on a server error.
  const kept = state && !state.ok ? state.values : undefined;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    const result = validateAddressInput(formDataToObject(new FormData(event.currentTarget)));
    if (result.ok) {
      setClientErrors(null);
      return;
    }
    event.preventDefault();
    setClientErrors(result.fieldErrors);
    const first = FIELD_ORDER.find((f) => result.fieldErrors[f]);
    if (first) (formRef.current?.elements.namedItem(first) as HTMLElement | null)?.focus();
  }

  function clearError(field: AddressField) {
    setClientErrors((prev) => (prev && prev[field] ? { ...prev, [field]: undefined } : prev));
  }

  function field(name: AddressField, label: string, props: React.ComponentProps<typeof Input>) {
    const message = errors[name];
    const errorId = `${name}-error`;
    return (
      <div className="space-y-1">
        <Label htmlFor={name}>{label}</Label>
        <Input
          id={name}
          name={name}
          defaultValue={kept?.[name] ?? (existing ? (existing[name as keyof UserAddress] as string | undefined) : undefined) ?? ""}
          aria-invalid={message ? true : undefined}
          aria-describedby={message ? errorId : undefined}
          onChange={() => clearError(name)}
          {...props}
        />
        {message && (
          <p id={errorId} className="text-xs text-destructive">
            {message}
          </p>
        )}
      </div>
    );
  }

  return (
    <form ref={formRef} action={formAction} onSubmit={handleSubmit} noValidate className="space-y-4">
      {(serverMessage || (serverErrors && !clientErrors)) && (
        <Alert variant="destructive">
          <AlertDescription>{serverMessage ?? "Please fix the highlighted fields."}</AlertDescription>
        </Alert>
      )}

      <fieldset disabled={isPending} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          {field("fullName", "Full Name *", { autoComplete: "name" })}
          {field("phone", "Phone Number *", { autoComplete: "tel-national", inputMode: "numeric", type: "tel" })}
        </div>
        {field("addressLine1", "Address Line 1 *", { autoComplete: "address-line1" })}
        {field("addressLine2", "Address Line 2 (optional)", { autoComplete: "address-line2" })}
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {field("city", "City *", { autoComplete: "address-level2" })}
          {field("state", "State *", { autoComplete: "address-level1" })}
          {field("pincode", "Pincode *", { autoComplete: "postal-code", inputMode: "numeric" })}
        </div>
      </fieldset>

      <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row">
        <Button
          variant="ghost"
          className="min-h-11"
          nativeButton={false}
          render={<Link href="/cart" />}
        >
          Cancel
        </Button>
        <Button type="submit" variant="gradient" className="min-h-11 flex-1" disabled={isPending}>
          {isPending ? "Saving…" : "Save & Continue"}
        </Button>
      </div>
    </form>
  );
}
