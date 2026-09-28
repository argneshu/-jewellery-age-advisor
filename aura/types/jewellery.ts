export type JewelleryCategory =
  | "Ring"
  | "Necklace"
  | "Earrings"
  | "Bracelet"
  | "Bangle"
  | "Anklet"
  | "Pendant"
  | "Set"
  | "Chain"
  // Not in the Migration Document's original category list (§3.1) — added to
  // represent item 37 ("Traditional Gold Maang Tikka") accurately rather than
  // mis-categorizing it as one of the above.
  | "Hair Jewellery";

export type JewelleryStyle = "minimal" | "traditional" | "statement" | "modern";

export interface JewelleryItem {
  id: number;
  name: string;
  category: JewelleryCategory;
  price: number; // INR, integer
  ageMin: number;
  ageMax: number;
  style: JewelleryStyle;
  tags: string[];
  imagePath: string; // e.g. "/images/jewellery/ring-cocktail-statement.jpg"
  imageAlt: string; // accessibility text, derived from `name`
}

export type Relationship = "self" | "daughter" | "mother" | "wife" | "friend" | "sister";
export type Occasion = "birthday" | "wedding" | "anniversary" | "festival" | "everyday" | "graduation";

export interface RecommendationPrefs {
  age: number;
  relationship: Relationship;
  occasion: Occasion;
  budget: number;
  style: JewelleryStyle | "";
}
