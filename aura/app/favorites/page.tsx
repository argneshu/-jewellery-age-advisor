import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { JEWELLERY_ITEMS } from "@/data/jewellery";
import { JewelleryCard } from "@/components/recommendations/JewelleryCard";

export default async function FavoritesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Defense-in-depth: proxy.ts already redirects unauthenticated requests to
  // /favorites, but this page never trusts that alone (same principle as the
  // favorites API route).
  if (!user) {
    redirect("/login?redirectedFrom=/favorites");
  }

  const { data: favorites, error } = await supabase
    .from("favorites")
    .select("jewellery_item_id")
    .eq("user_id", user.id);

  if (error) {
    throw new Error(`Failed to load favorites: ${error.message}`);
  }

  // jewellery_item_id has no DB foreign key back to the static catalog
  // (Migration Document §3.2) — filter out any id no longer present in
  // data/jewellery.ts rather than crashing on a stale reference.
  const items = (favorites ?? [])
    .map((f) => JEWELLERY_ITEMS.find((item) => item.id === f.jewellery_item_id))
    .filter((item) => item !== undefined);

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-16">
      <div className="mb-6 text-center">
        <h2 className="font-serif text-3xl text-ink">Your Favorites</h2>
      </div>

      {items.length === 0 ? (
        <p className="mx-auto max-w-md text-center text-ink-soft">
          You haven&apos;t saved anything yet.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <JewelleryCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </main>
  );
}
