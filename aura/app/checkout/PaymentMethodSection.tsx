"use client";

import { Banknote, Smartphone } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PaymentMethod } from "@/lib/checkout";

// Epic 10, Story 10.10 (Helix 4.2) payment choice, split out of CheckoutClient to keep files small.
// Radio cards are >= 44px tall; the UPI field appears only when UPI is chosen.

interface Props {
  method: PaymentMethod | "";
  upiId: string;
  upiError: string | null;
  disabled: boolean;
  onMethodChange: (method: PaymentMethod) => void;
  onUpiChange: (value: string) => void;
  onUpiBlur: () => void;
}

const cardClass = (selected: boolean) =>
  `flex min-h-11 cursor-pointer flex-col gap-3 rounded-xl border p-4 transition-colors ${
    selected ? "border-gold bg-gold/5" : "border-border-soft"
  }`;

export function PaymentMethodSection({ method, upiId, upiError, disabled, onMethodChange, onUpiChange, onUpiBlur }: Props) {
  return (
    <fieldset disabled={disabled} className="space-y-3">
      <legend className="sr-only">Payment method</legend>

      <label className={cardClass(method === "cod")}>
        <span className="flex items-center gap-3">
          <input
            type="radio"
            name="payment"
            value="cod"
            checked={method === "cod"}
            onChange={() => onMethodChange("cod")}
            className="accent-gold"
          />
          <Banknote size={20} className="text-ink-soft" aria-hidden="true" />
          <span>
            <span className="block font-medium text-ink">Cash on Delivery</span>
            <span className="block text-xs text-ink-soft">Pay when your order arrives.</span>
          </span>
        </span>
      </label>

      <div className={cardClass(method === "upi")}>
        <label className="flex min-h-11 cursor-pointer items-center gap-3">
          <input
            type="radio"
            name="payment"
            value="upi"
            checked={method === "upi"}
            onChange={() => onMethodChange("upi")}
            className="accent-gold"
          />
          <Smartphone size={20} className="text-ink-soft" aria-hidden="true" />
          <span>
            <span className="block font-medium text-ink">UPI</span>
            <span className="block text-xs text-ink-soft">
              Your UPI ID is saved with this order. No payment is taken on this page.
            </span>
          </span>
        </label>
        {method === "upi" && (
          <div className="space-y-1 sm:ml-7">
            <Label htmlFor="upiId">UPI ID</Label>
            <Input
              id="upiId"
              name="upiId"
              placeholder="yourname@upi"
              value={upiId}
              onChange={(e) => onUpiChange(e.target.value)}
              onBlur={onUpiBlur}
              autoComplete="off"
              aria-invalid={upiError ? true : undefined}
              aria-describedby={upiError ? "upiId-error" : undefined}
            />
            {upiError && (
              <p id="upiId-error" className="text-xs text-destructive">
                {upiError}
              </p>
            )}
          </div>
        )}
      </div>
    </fieldset>
  );
}
