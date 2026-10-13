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
