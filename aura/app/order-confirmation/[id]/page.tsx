import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatINR } from "@/lib/format";
import { isUuid, shortOrderId } from "@/lib/checkout";
import { FocusHeading } from "./FocusHeading";

// Epic 10, Story 10.11 (Helix 4.3). Deviations from Helix: the id is checked with isUuid() before any
// query (junk ids -> 404, never a database error); `.maybeSingle()` instead of `.single()`; a genuine
// query error goes to Next's error boundary instead of masquerading as "not found". RLS limits the
// query to the caller's own rows, so another user's order id returns no row -> 404.

interface OrderItemRow {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

interface AddressSnapshot {
  full_name: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  pincode: string;
}

export default async function OrderConfirmationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isUuid(id)) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?redirectedFrom=/order-confirmation/${id}`);

  const { data: order, error } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`Failed to load your order (${error.code})`);
  if (!order) notFound();

  const items = order.order_items as OrderItemRow[];
  const address = order.address_snapshot as AddressSnapshot;

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-16 pt-12">
      <div className="mb-10 text-center">
        <CheckCircle2 size={56} className="mx-auto mb-4 text-green-600" aria-hidden="true" />
        <FocusHeading>Order Placed!</FocusHeading>
        <p className="mt-2 text-ink-soft">
          Thank you! Your order <span className="font-semibold text-ink">#{shortOrderId(order.id)}</span> is confirmed.
        </p>
        <p className="mt-1 text-sm text-ink-soft">
          Estimated delivery: <strong>5–7 business days</strong>
        </p>
      </div>

      <section className="mb-6 rounded-aura-xl border border-border-soft bg-ivory p-6 shadow-soft">
        <h2 className="mb-4 font-serif text-xl text-ink">Items Ordered</h2>
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id} className="flex justify-between gap-4 text-sm">
              <span className="text-ink">
                {item.name} <span className="text-ink-soft">× {item.quantity}</span>
              </span>
              <span className="font-semibold text-gold-deep">{formatINR(item.price * item.quantity)}</span>
            </li>
          ))}
        </ul>
        <Separator className="my-4" />
        <div className="flex justify-between font-serif text-lg font-semibold text-ink">
          <span>Grand Total</span>
          <span className="text-gold-deep">{formatINR(order.total)}</span>
        </div>
      </section>

      <section className="mb-8 rounded-aura-xl border border-border-soft bg-ivory p-6 shadow-soft">
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <h3 className="mb-1 font-medium text-ink">Payment</h3>
            <p className="text-sm text-ink-soft">
              {order.payment_method === "cod" ? "Cash on Delivery" : `UPI — ${order.upi_id}`}
            </p>
          </div>
          <div>
            <h3 className="mb-1 font-medium text-ink">Delivering to</h3>
            <p className="text-sm text-ink-soft">
              {address.full_name}
              <br />
              {address.address_line1}
              {address.address_line2 && <>, {address.address_line2}</>}
              <br />
              {address.city}, {address.state} – {address.pincode}
            </p>
          </div>
        </div>
      </section>

      <div className="text-center">
        <Button variant="gradient" className="min-h-11" nativeButton={false} render={<Link href="/" />}>
          Continue Shopping
        </Button>
      </div>
    </main>
  );
}
