"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { listFavorites, addFavorite, removeFavorite } from "@/lib/favorites";
import { buildLoginRedirect } from "@/lib/login-redirect";

// Epic 10, Story 10.4. Extracted VERBATIM from JewelleryCard (Epic 7, Story 7.2) so the product
// page (Story 10.5) can reuse the same heart behaviour: signed-in check, initial state from
// listFavorites, optimistic toggle with rollback, guests sent to /login preserving where they were.
// No behaviour change to the card is intended.

export function useFavorite(itemId: number) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isFavorited, setIsFavorited] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function checkAuthAndFavorite() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (cancelled) return;
      setIsSignedIn(!!user);
      if (!user) return;

      const favorites = await listFavorites().catch(() => []);
      if (cancelled) return;
      setIsFavorited(favorites.some((f) => f.jewelleryItemId === itemId));
    }

    checkAuthAndFavorite();
    return () => {
      cancelled = true;
    };
  }, [itemId]);

  async function toggleFavorite() {
    if (!isSignedIn) {
      router.push(buildLoginRedirect(pathname, searchParams.toString()));
      return;
    }
    const nextState = !isFavorited;
    setIsFavorited(nextState);
    try {
      if (nextState) {
        await addFavorite(itemId);
      } else {
        await removeFavorite(itemId);
      }
    } catch {
      setIsFavorited(!nextState);
    }
  }

  return { isFavorited, toggleFavorite };
}
