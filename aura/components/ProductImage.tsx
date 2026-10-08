"use client";

import { useState, type ReactNode } from "react";
import Image from "next/image";
import { gradientForCategory } from "@/lib/gradients";
import { hasRealPhoto } from "@/lib/product-images";

// Epic 10, Story 10.7a (Enhancement 1). The one place that decides "photo or gradient" for a product,
// used by the results/favorites card, the product page, the cart row and the checkout summary.
// Shows the curated photo (lib/product-images.ts) when the item has one and it loads; otherwise the
// category gradient — no broken-image icon and no layout shift, because the box size comes from the
// caller's className, not from the image. `children` render inside the box (e.g. the heart button).

interface ProductImageProps {
  item: { id: number; category: string; imagePath: string; imageAlt: string };
  /** Size hint for next/image so small thumbnails do not download full-size files. */
  sizes?: string;
  /** Preload for above-the-fold images (Next 16: `preload` replaces the deprecated `priority`). */
  preload?: boolean;
  /** Sizing/shape classes for the box (e.g. "aspect-square w-full" or "h-16 w-16 rounded-lg"). */
  className?: string;
  children?: ReactNode;
}

export function ProductImage({ item, sizes, preload, className = "", children }: ProductImageProps) {
  const [failed, setFailed] = useState(false);
  const showImage = hasRealPhoto(item.id) && !failed;

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={showImage ? undefined : { background: gradientForCategory(item.category) }}
    >
      {showImage && (
        <Image
          src={item.imagePath}
          alt={item.imageAlt}
          fill
          sizes={sizes}
          preload={preload}
          className="object-cover"
          onError={() => setFailed(true)}
        />
      )}
      {children}
    </div>
  );
}
