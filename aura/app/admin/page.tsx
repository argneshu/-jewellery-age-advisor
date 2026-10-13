import Link from "next/link";
import { JEWELLERY_ITEMS } from "@/data/jewellery";
import { requireAdmin } from "@/lib/supabase/admin";

// Product list with at-a-glance status: does it have details, and is its photo a custom upload?
export default async function AdminHome() {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase.from("product_details").select("product_id, image_url");
  if (error) throw new Error(`Failed to load product details (${error.code})`);

  const rows = new Map((data ?? []).map((r) => [r.product_id as number, r.image_url as string | null]));

  return (
    <main>
      <h2 className="mb-1 font-serif text-3xl text-ink">Products</h2>
      <p className="mb-6 text-sm text-ink-soft">Edit the details and photo shown on each product page.</p>
      <ul className="divide-y divide-border-soft rounded-aura-xl border border-border-soft bg-ivory">
        {JEWELLERY_ITEMS.map((item) => {
          const hasDetails = rows.has(item.id);
          const customPhoto = Boolean(rows.get(item.id));
          return (
            <li key={item.id} className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
              <div>
                <p className="font-medium text-ink">
                  #{item.id} · {item.name}
                </p>
                <p className="text-ink-soft">
                  {item.category} · {hasDetails ? "Details added" : "No details yet"} ·{" "}
                  {customPhoto ? "Custom photo" : "Original photo"}
                </p>
              </div>
              <Link
                href={`/admin/products/${item.id}`}
                className="inline-flex min-h-11 items-center font-semibold text-gold-deep hover:underline"
              >
                Edit
              </Link>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
