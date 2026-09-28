"use client";

import { useState } from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { formatINR } from "@/lib/format";
import { whyText } from "@/lib/recommendation-engine";
import { gradientForCategory } from "@/lib/gradients";
import type { JewelleryItem, RecommendationPrefs } from "@/types/jewellery";

export function JewelleryCard({
  item,
  prefs,
}: {
  item: JewelleryItem;
  prefs: RecommendationPrefs;
}) {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <Card className="overflow-hidden rounded-aura-xl border-border-soft bg-ivory shadow-soft">
      <div
        className="relative aspect-square w-full"
        style={
          imageFailed
            ? { background: gradientForCategory(item.category) }
            : undefined
        }
      >
        {!imageFailed && (
          <Image
            src={item.imagePath}
            alt={item.imageAlt}
            fill
            className="object-cover"
            onError={() => setImageFailed(true)}
          />
        )}
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
