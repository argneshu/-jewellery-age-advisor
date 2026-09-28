import type { Relationship } from "@/types/jewellery";

export function formatINR(n: number): string {
  return "₹" + n.toLocaleString("en-IN");
}

export function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// Migration Document §1.5 names these as two separate maps (results-title vs.
// why-text phrasing) without enumerating every value — filled in here as the
// minimal literal extrapolation from the one given example ("Curated for
// your wife"). Review/adjust if these don't read naturally.
const RELATIONSHIP_LABEL: Record<Relationship, string> = {
  self: "yourself",
  daughter: "your daughter",
  mother: "your mother",
  wife: "your wife",
  friend: "your friend",
  sister: "your sister",
};

const RELATIONSHIP_TONE: Record<Relationship, string> = {
  self: "you",
  daughter: "your daughter",
  mother: "your mother",
  wife: "your wife",
  friend: "your friend",
  sister: "your sister",
};

export function relationshipLabel(r: Relationship): string {
  return RELATIONSHIP_LABEL[r];
}

export function relationshipTone(r: Relationship): string {
  return RELATIONSHIP_TONE[r];
}
