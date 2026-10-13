import { createClient } from "@supabase/supabase-js";
import { toProductDetails, type ProductDetails, type ProductDetailsRow } from "@/lib/product-details";

// Public, read-only catalog data. Uses the anon key without cookies on purpose: reading cookies()
// would make every product page dynamic and defeat generateStaticParams. Any failure (table not
// created yet, network, RLS) returns null so the product page still renders from the static catalog.
export async function fetchProductDetails(productId: number): Promise<ProductDetails | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  try {
    const supabase = createClient(url, key, { auth: { persistSession: false } });
    const { data, error } = await supabase
      .from("product_details")
      .select("*")
      .eq("product_id", productId)
      .maybeSingle<ProductDetailsRow>();
    if (error) return null;
    return toProductDetails(data);
  } catch {
    return null;
  }
}

/**
 * Admin-uploaded photo URLs keyed by product id. One small query (one row per product with an
 * override) read on every request by the root layout, so a new photo shows immediately and there is
 * no cache to invalidate. Failure returns an empty map: pages fall back to the static photos.
 */
export async function fetchImageOverrides(): Promise<Record<number, string>> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return {};

  try {
    const supabase = createClient(url, key, { auth: { persistSession: false } });
    const { data, error } = await supabase
      .from("product_details")
      .select("product_id, image_url")
      .not("image_url", "is", null);
    if (error || !data) return {};
    return Object.fromEntries(data.map((r) => [r.product_id as number, r.image_url as string]));
  } catch {
    return {};
  }
}
