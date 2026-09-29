"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Heart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatINR } from "@/lib/format";
import { whyText } from "@/lib/recommendation-engine";
import { gradientForCategory } from "@/lib/gradients";
import { createClient } from "@/lib/supabase/client";
import { listFavorites, addFavorite, removeFavorite } from "@/lib/favorites";
import type { JewelleryItem, RecommendationPrefs } from "@/types/jewellery";

// The Epic 4 placeholder images (picsum.photos, see public/images/jewellery/
// CREDITS.md) are random stock photos with no relation to jewellery — worse
// than showing no photo at all. Flip this once real photos are curated;
// onError below still covers a genuinely broken/missing file at that point.
const SHOW_PLACEHOLDER_IMAGES = false;

export function JewelleryCard({
  item,
  prefs,
}: {
  item: JewelleryItem;
  prefs: RecommendationPrefs;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = SHOW_PLACEHOLDER_IMAGES && !imageFailed;

  const router = useRouter();
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
      setIsFavorited(favorites.some((f) => f.jewelleryItemId === item.id));
    }

    checkAuthAndFavorite();
    return () => {
      cancelled = true;
    };
  }, [item.id]);

  async function handleToggleFavorite() {
    if (!isSignedIn) {
      router.push("/login");
      return;
    }
    const nextState = !isFavorited;
    setIsFavorited(nextState);
    try {
      if (nextState) {
        await addFavorite(item.id);
      } else {
        await removeFavorite(item.id);
      }
    } catch {
      setIsFavorited(!nextState);
    }
  }

  return (
    <Card className="overflow-hidden rounded-aura-xl border-border-soft bg-ivory shadow-soft">
      <div
        className="relative aspect-square w-full"
        style={
          !showImage
            ? { background: gradientForCategory(item.category) }
            : undefined
        }
      >
        {showImage && (
          <Image
            src={item.imagePath}
            alt={item.imageAlt}
            fill
            className="object-cover"
            onError={() => setImageFailed(true)}
          />
        )}
        <button
          type="button"
          onClick={handleToggleFavorite}
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-ivory/80"
          aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
        >
          <Heart
            size={20}
            className={isFavorited ? "fill-rose text-rose" : "text-ink-soft"}
          />
        </button>
      </div>
      <CardContent className="space-y-1 p-5">
        <p className="text-xs font-medium uppercase tracking-wide text-ink-soft">
          {item.category}
        </p>
        <h3 className="font-serif text-lg text-ink">{item.name}</h3>
        <p className="text-base font-semibold text-gold">{formatINR(item.price)}</p>
        <p className="text-sm text-ink-soft">{whyText(item, prefs)}</p>
      </CardContent>
    </Card>
  );
}
