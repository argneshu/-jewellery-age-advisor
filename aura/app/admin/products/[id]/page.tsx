import Link from "next/link";
import { notFound } from "next/navigation";
import { findItemByRouteId } from "@/lib/catalog";
import { requireAdmin } from "@/lib/supabase/admin";
import { ProductEditor } from "./ProductEditor";

export default async function AdminProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { supabase } = await requireAdmin();
  const { id } = await params;
  const item = findItemByRouteId(id);
  if (!item) notFound();

  const { data: row, error } = await supabase
    .from("product_details")
    .select("*")
    .eq("product_id", item.id)
    .maybeSingle();
  if (error) throw new Error(`Failed to load product details (${error.code})`);

  return (
    <main>
      <Link href="/admin" className="mb-4 inline-block text-sm text-ink-soft hover:text-ink">
        ← All products
      </Link>
      <h2 className="mb-1 font-serif text-3xl text-ink">{item.name}</h2>
      <p className="mb-8 text-sm text-ink-soft">
        #{item.id} · {item.category} ·{" "}
        <Link href={`/product/${item.id}`} className="text-gold-deep hover:underline">
          View product page
        </Link>
      </p>
      <ProductEditor item={item} row={row} />
    </main>
  );
}
