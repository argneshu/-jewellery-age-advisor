"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MapPin } from "lucide-react";
import { ProductImage } from "@/components/ProductImage";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/context/CartContext";
import { validateUpiId, type PaymentMethod } from "@/lib/checkout";
import { formatINR } from "@/lib/format";
import type { UserAddress } from "@/types/address";
import { placeOrder } from "./actions";
import { PaymentMethodSection } from "./PaymentMethodSection";

// Epic 10, Story 10.10 (Helix 4.2). Deviations from Helix: only ids + quantities are sent (prices come
// from the catalog on the server); the action returns a typed result (no try/catch around a throw);
// the cart is cleared ONLY after { ok: true }; a ref lock set synchronously on click prevents double
// submits (state alone is async); nothing but the heading renders until the cart has loaded.

const sectionClass = "rounded-aura-xl border border-border-soft bg-ivory p-6 shadow-soft";

export function CheckoutClient({ address }: { address: UserAddress }) {
  const { items, totalPrice, clearCart, isHydrated } = useCart();
  const router = useRouter();
  const [method, setMethod] = useState<PaymentMethod | "">("");
  const [upiId, setUpiId] = useState("");
  const [upiTouched, setUpiTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const submitLock = useRef(false);
  const completed = useRef(false);

  useEffect(() => {
    if (isHydrated && items.length === 0 && !completed.current) router.replace("/cart");
  }, [isHydrated, items.length, router]);

  if (!isHydrated || items.length === 0) return null;

  // Same validator the server and place_order use, so the button is enabled only for an id they accept.
  const upiCheck = validateUpiId(upiId);
  const canPlaceOrder = method === "cod" || (method === "upi" && upiCheck.ok);
  const upiError = method === "upi" && upiTouched && upiId.trim() !== "" && !upiCheck.ok ? upiCheck.error : null;

  async function handlePlaceOrder() {
    if (submitLock.current || !canPlaceOrder || !method) return;

    submitLock.current = true;
    setIsPending(true);
    setError(null);

    const result = await placeOrder({
      paymentMethod: method,
      upiId: method === "upi" ? upiId : undefined,
      items: items.map(({ id, quantity }) => ({ id, quantity })),
    });

    if (result.ok) {
      completed.current = true;
      clearCart();
      router.push(`/order-confirmation/${result.orderId}`);
      return;
    }

    setError(result.error);
    setIsPending(false);
    submitLock.current = false;
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>
            {error}
            {error.includes("delivery address") && (
              <>
                {" "}
                <Link href="/checkout/address" className="underline">
                  Add address
                </Link>
              </>
            )}
          </AlertDescription>
        </Alert>
      )}

      <section className={sectionClass} aria-labelledby="order-summary-heading">
        <h3 id="order-summary-heading" className="mb-4 font-serif text-xl text-ink">
          Order Summary
        </h3>
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id} className="flex items-center gap-3">
              <ProductImage item={item} sizes="2.5rem" className="h-10 w-10 shrink-0 rounded-lg" />
              <p className="flex-1 text-sm text-ink">{item.name}</p>
              <p className="text-xs text-ink-soft">×{item.quantity}</p>
              <p className="text-sm font-semibold text-gold-deep">{formatINR(item.price * item.quantity)}</p>
            </li>
          ))}
        </ul>
        <Separator className="my-4" />
        <div className="flex justify-between text-sm text-ink-soft">
          <span>Delivery</span>
          <span className="font-medium text-green-700">Free</span>
        </div>
        <div className="mt-2 flex justify-between font-serif text-lg font-semibold text-ink">
          <span>Grand Total</span>
          <span className="text-gold-deep">{formatINR(totalPrice)}</span>
        </div>
      </section>

      <section className={sectionClass} aria-labelledby="address-heading">
        <div className="flex items-start justify-between">
          <h3 id="address-heading" className="flex items-center gap-2 font-serif text-xl text-ink">
            <MapPin size={18} aria-hidden="true" /> Delivery Address
          </h3>
          <Link href="/checkout/address" className="text-sm text-gold-deep hover:underline">
            Change
          </Link>
        </div>
        <div className="mt-3 space-y-0.5 text-sm text-ink-soft">
          <p className="font-medium text-ink">{address.fullName}</p>
          <p>{address.addressLine1}</p>
          {address.addressLine2 && <p>{address.addressLine2}</p>}
          <p>
            {address.city}, {address.state} – {address.pincode}
          </p>
          <p>Phone: {address.phone}</p>
        </div>
      </section>

      <section className={sectionClass} aria-labelledby="payment-heading">
        <h3 id="payment-heading" className="mb-4 font-serif text-xl text-ink">
          Payment Method
        </h3>
        <PaymentMethodSection
          method={method}
          upiId={upiId}
          upiError={upiError}
          disabled={isPending}
          onMethodChange={(next) => {
            setMethod(next);
            if (next === "cod") {
              setUpiId("");
              setUpiTouched(false);
            }
          }}
          onUpiChange={setUpiId}
          onUpiBlur={() => setUpiTouched(true)}
        />
      </section>

      <Button
        variant="gradient"
        className="min-h-11 w-full py-3 text-base"
        disabled={!canPlaceOrder || isPending}
        onClick={handlePlaceOrder}
      >
        {isPending ? "Placing Order…" : "Place Order"}
      </Button>
    </div>
  );
}
