"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatINR } from "@/lib/format";
import { whyText } from "@/lib/recommendation-engine";
import { gradientForCategory } from "@/lib/gradients";
import { hasRealPhoto } from "@/lib/product-images";
import { useFavorite } from "@/lib/use-favorite";
import type { JewelleryItem, RecommendationPrefs } from "@/types/jewellery";

// Only items with a curated photo (lib/product-images.ts) show an image; the remaining Epic 4
// placeholders (picsum.photos, see public/images/jewellery/CREDITS.md) are random stock photos and
// stay on the category gradient. onError still covers a genuinely broken/missing file.

export function JewelleryCard({
  item,
  prefs,
}: {
  item: JewelleryItem;
  // Optional: the favorites page (Story 7.3) has no recommendation-run
  // context (age/relationship/occasion/budget/style) to generate a why-text
  // from, since a favorite can outlive the search that produced it.
  prefs?: RecommendationPrefs;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = hasRealPhoto(item.id) && !imageFailed;

  // Favorite state/logic lives in useFavorite (extracted from this component in Epic 10, Story 10.4).
  const { isFavorited, toggleFavorite } = useFavorite(item.id);

  return (
    // Epic 10, Story 10.4 (Helix 1.1): the whole card opens the product page; the heart button
    // below stops the click from navigating (mouse and keyboard).
    <Link
      href={`/product/${item.id}`}
      className="group block rounded-aura-xl outline-none focus-visible:ring-2 focus-visible:ring-gold-deep focus-visible:ring-offset-2"
    >
      <Card className="overflow-hidden rounded-aura-xl border-border-soft bg-ivory shadow-soft transition-shadow group-hover:shadow-md">
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
          {/* 44x44px hit area (UI/UX spec) around the unchanged 32px visual circle. */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleFavorite();
            }}
            className="absolute right-1.5 top-1.5 flex h-11 w-11 items-center justify-center"
            aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ivory/80">
              <Heart
                size={20}
                className={isFavorited ? "fill-rose text-rose" : "text-ink-soft"}
              />
            </span>
          </button>
        </div>
        <CardContent className="space-y-1 p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-soft">
            {item.category}
          </p>
          <h3 className="font-serif text-lg text-ink">{item.name}</h3>
          <p className="text-base font-semibold text-gold">{formatINR(item.price)}</p>
          {prefs && <p className="text-sm text-ink-soft">{whyText(item, prefs)}</p>}
        </CardContent>
      </Card>
    </Link>
  );
}
