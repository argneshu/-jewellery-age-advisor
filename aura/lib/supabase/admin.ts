import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Gate for everything under /admin and for the admin server actions. The proxy already sends signed-out
// visitors to /login; this adds the admin check. Signed-in non-admins get a 404 (the page's existence is
// not revealed). This is defence in depth: the real enforcement is RLS (migration 0007), so even a
// forged request from a non-admin cannot write product_details or upload to the product-images bucket.
export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirectedFrom=/admin");

  const { data: isAdmin, error } = await supabase.rpc("is_admin");
  if (error) throw new Error(`Admin check failed (${error.code})`);
  if (!isAdmin) notFound();

  return { supabase, user };
}
