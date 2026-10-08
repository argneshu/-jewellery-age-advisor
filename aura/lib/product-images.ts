// Items whose image file is a curated, licensed photo (see public/images/jewellery/CREDITS.md).
// Any catalog image that is still a random picsum.photos placeholder (see commit e91bb41) does not
// show the product, so such items keep the category gradient. When a placeholder is replaced,
// add its id here — lib/product-images.test.ts checks the file exists and is credited to Pexels.
export const REAL_PHOTO_IDS: ReadonlySet<number> = new Set([
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40,
]);

export function hasRealPhoto(id: number): boolean {
  return REAL_PHOTO_IDS.has(id);
}
