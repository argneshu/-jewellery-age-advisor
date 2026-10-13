"use client";

import { createContext, useContext, type ReactNode } from "react";

// Admin-uploaded photo URLs (Supabase Storage) keyed by product id, provided once by the root layout
// so every <ProductImage> (cards, product page, cart, checkout) picks up a replaced photo without
// each page having to fetch it. Empty by default: components fall back to the static catalog photo.

const ImageOverridesContext = createContext<Record<number, string>>({});

export function ImageOverridesProvider({
  overrides,
  children,
}: {
  overrides: Record<number, string>;
  children: ReactNode;
}) {
  return <ImageOverridesContext.Provider value={overrides}>{children}</ImageOverridesContext.Provider>;
}

export function useImageOverride(id: number): string | undefined {
  return useContext(ImageOverridesContext)[id];
}
