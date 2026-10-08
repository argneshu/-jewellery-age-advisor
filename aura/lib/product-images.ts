// Items whose image file is a curated, licensed photo (see public/images/jewellery/CREDITS.md).
// The other catalog images are still random picsum.photos placeholders that do not show the product
// (see commit e91bb41), so those items keep the category gradient. When a placeholder is replaced,
// add its id here — lib/product-images.test.ts checks the file exists and is credited to Pexels.
export const REAL_PHOTO_IDS: ReadonlySet<number> = new Set([
  3, 7, 8, 9, 11, 12, 13, 14, 15, 16, 18, 19, 20, 21, 22, 24, 25, 26, 27, 28, 29, 30, 33, 39, 40,
]);

export function hasRealPhoto(id: number): boolean {
  return REAL_PHOTO_IDS.has(id);
}
