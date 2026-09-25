// Aura — static jewellery dataset (invented items for demo purposes; currency: INR)
// Each item: id, name, category, price, ageMin/ageMax, style, occasionTags, relationshipTags, gradient
const JEWELLERY_ITEMS = [
  { id: 1, name: "Tiny Gold Stud Set", category: "Earrings", price: 3500, ageMin: 1, ageMax: 12, style: "minimal", occasionTags: ["birthday", "everyday"], relationshipTags: ["daughter", "self"], gradient: "g-gold-soft" },
  { id: 2, name: "Nameplate Charm Bracelet", category: "Bracelet", price: 4200, ageMin: 1, ageMax: 12, style: "minimal", occasionTags: ["birthday", "everyday"], relationshipTags: ["daughter"], gradient: "g-rose-soft" },
  { id: 3, name: "Featherweight Anklet Pair", category: "Anklet", price: 2800, ageMin: 1, ageMax: 12, style: "minimal", occasionTags: ["everyday", "festival"], relationshipTags: ["daughter"], gradient: "g-gold-soft" },
  { id: 4, name: "Hypoallergenic Flower Studs", category: "Earrings", price: 3200, ageMin: 1, ageMax: 12, style: "minimal", occasionTags: ["birthday"], relationshipTags: ["daughter"], gradient: "g-cream-gold" },
  { id: 5, name: "Little Star Pendant", category: "Necklace", price: 5200, ageMin: 1, ageMax: 12, style: "minimal", occasionTags: ["birthday", "graduation"], relationshipTags: ["daughter"], gradient: "g-rose-soft" },

  { id: 6, name: "Birthstone Thin Chain", category: "Necklace", price: 6800, ageMin: 13, ageMax: 19, style: "minimal", occasionTags: ["birthday", "everyday"], relationshipTags: ["daughter", "sister", "self", "friend"], gradient: "g-gold-soft" },
  { id: 7, name: "Small Hoop Earrings", category: "Earrings", price: 4500, ageMin: 13, ageMax: 19, style: "modern", occasionTags: ["everyday", "birthday"], relationshipTags: ["sister", "friend", "self"], gradient: "g-rose-soft" },
  { id: 8, name: "Layer-Ready Daily Chain", category: "Necklace", price: 7200, ageMin: 13, ageMax: 19, style: "modern", occasionTags: ["everyday", "graduation"], relationshipTags: ["daughter", "self"], gradient: "g-cream-gold" },
  { id: 9, name: "Trend Stack Rings (Set of 3)", category: "Ring", price: 5600, ageMin: 13, ageMax: 22, style: "modern", occasionTags: ["birthday", "everyday"], relationshipTags: ["friend", "sister", "self"], gradient: "g-gold-soft" },
  { id: 10, name: "Affordable Birthstone Studs", category: "Earrings", price: 3900, ageMin: 13, ageMax: 19, style: "minimal", occasionTags: ["birthday"], relationshipTags: ["sister", "friend"], gradient: "g-rose-soft" },

  { id: 11, name: "Cocktail Statement Ring", category: "Ring", price: 18500, ageMin: 20, ageMax: 29, style: "statement", occasionTags: ["birthday", "graduation", "everyday"], relationshipTags: ["self", "wife", "friend"], gradient: "g-gold-bold" },
  { id: 12, name: "Layered Gold Necklace Set", category: "Necklace", price: 24500, ageMin: 20, ageMax: 29, style: "statement", occasionTags: ["birthday", "everyday"], relationshipTags: ["self", "wife"], gradient: "g-rose-bold" },
  { id: 13, name: "Versatile Drop Earrings", category: "Earrings", price: 15800, ageMin: 20, ageMax: 32, style: "modern", occasionTags: ["everyday", "graduation", "birthday"], relationshipTags: ["self", "friend", "wife"], gradient: "g-gold-bold" },
  { id: 14, name: "Work-to-Evening Bangle", category: "Bangle", price: 21000, ageMin: 20, ageMax: 29, style: "modern", occasionTags: ["everyday", "birthday"], relationshipTags: ["self", "wife"], gradient: "g-cream-gold" },
  { id: 15, name: "Graduation Cap Pendant", category: "Necklace", price: 9800, ageMin: 20, ageMax: 25, style: "minimal", occasionTags: ["graduation"], relationshipTags: ["daughter", "self", "friend"], gradient: "g-rose-soft" },

  { id: 16, name: "Polki Bridal Necklace Set", category: "Necklace", price: 185000, ageMin: 20, ageMax: 60, style: "traditional", occasionTags: ["wedding", "anniversary"], relationshipTags: ["wife", "self"], gradient: "g-rose-bold" },
  { id: 17, name: "Kundan Heirloom Choker", category: "Necklace", price: 165000, ageMin: 25, ageMax: 60, style: "traditional", occasionTags: ["wedding", "anniversary", "festival"], relationshipTags: ["wife", "mother"], gradient: "g-gold-bold" },
  { id: 18, name: "Solitaire Anniversary Ring", category: "Ring", price: 145000, ageMin: 25, ageMax: 55, style: "statement", occasionTags: ["anniversary", "wedding"], relationshipTags: ["wife"], gradient: "g-cream-gold" },
  { id: 19, name: "Gold Investment Bangles (Pair)", category: "Bangle", price: 98000, ageMin: 30, ageMax: 45, style: "traditional", occasionTags: ["anniversary", "festival", "everyday"], relationshipTags: ["wife", "mother", "self"], gradient: "g-gold-bold" },
  { id: 20, name: "Elegant Premium Pearl Drop Set", category: "Necklace", price: 42000, ageMin: 30, ageMax: 45, style: "statement", occasionTags: ["anniversary", "festival"], relationshipTags: ["wife", "mother"], gradient: "g-rose-soft" },
  { id: 21, name: "Diamond Halo Earrings", category: "Earrings", price: 68000, ageMin: 30, ageMax: 45, style: "statement", occasionTags: ["anniversary", "birthday"], relationshipTags: ["wife", "self"], gradient: "g-gold-bold" },
  { id: 22, name: "Investment Gold Chain", category: "Necklace", price: 55000, ageMin: 30, ageMax: 45, style: "traditional", occasionTags: ["everyday", "festival"], relationshipTags: ["wife", "self"], gradient: "g-cream-gold" },

  { id: 23, name: "Temple Jewellery Necklace Set", category: "Necklace", price: 88000, ageMin: 46, ageMax: 60, style: "traditional", occasionTags: ["festival", "wedding", "anniversary"], relationshipTags: ["mother", "wife"], gradient: "g-gold-bold" },
  { id: 24, name: "Classic Pearl Strand", category: "Necklace", price: 32000, ageMin: 46, ageMax: 60, style: "traditional", occasionTags: ["everyday", "festival"], relationshipTags: ["mother"], gradient: "g-rose-soft" },
  { id: 25, name: "Heritage Jhumka Earrings", category: "Earrings", price: 27500, ageMin: 46, ageMax: 60, style: "traditional", occasionTags: ["festival", "wedding"], relationshipTags: ["mother"], gradient: "g-gold-bold" },
  { id: 26, name: "Timeless Gold Bangle", category: "Bangle", price: 45000, ageMin: 46, ageMax: 60, style: "traditional", occasionTags: ["everyday", "anniversary"], relationshipTags: ["mother", "wife"], gradient: "g-cream-gold" },
  { id: 27, name: "Sentimental Locket Pendant", category: "Necklace", price: 12500, ageMin: 46, ageMax: 60, style: "minimal", occasionTags: ["birthday", "everyday"], relationshipTags: ["mother"], gradient: "g-rose-soft" },

  { id: 28, name: "Soft-Tone Pearl Studs", category: "Earrings", price: 8500, ageMin: 60, ageMax: 80, style: "minimal", occasionTags: ["everyday", "birthday"], relationshipTags: ["mother"], gradient: "g-cream-gold" },
  { id: 29, name: "Simple Gold Chain", category: "Necklace", price: 22000, ageMin: 60, ageMax: 80, style: "minimal", occasionTags: ["everyday", "festival"], relationshipTags: ["mother"], gradient: "g-gold-soft" },
  { id: 30, name: "Low-Maintenance Gold Studs", category: "Earrings", price: 6800, ageMin: 60, ageMax: 80, style: "minimal", occasionTags: ["everyday"], relationshipTags: ["mother"], gradient: "g-rose-soft" },
  { id: 31, name: "Comfort-Fit Gold Bangle", category: "Bangle", price: 38000, ageMin: 60, ageMax: 80, style: "minimal", occasionTags: ["everyday", "festival"], relationshipTags: ["mother"], gradient: "g-cream-gold" },
  { id: 32, name: "Timeless Pearl Pendant", category: "Necklace", price: 15500, ageMin: 60, ageMax: 80, style: "traditional", occasionTags: ["birthday", "everyday"], relationshipTags: ["mother"], gradient: "g-rose-soft" },

  { id: 33, name: "Everyday Minimal Ring", category: "Ring", price: 6200, ageMin: 18, ageMax: 45, style: "minimal", occasionTags: ["everyday"], relationshipTags: ["self", "friend", "wife"], gradient: "g-gold-soft" },
  { id: 34, name: "Festival Kundan Earrings", category: "Earrings", price: 19500, ageMin: 18, ageMax: 60, style: "traditional", occasionTags: ["festival"], relationshipTags: ["wife", "mother", "self", "sister"], gradient: "g-gold-bold" },
  { id: 35, name: "Modern Geometric Necklace", category: "Necklace", price: 13200, ageMin: 20, ageMax: 40, style: "modern", occasionTags: ["birthday", "everyday"], relationshipTags: ["self", "friend", "sister"], gradient: "g-rose-bold" },
  { id: 36, name: "Statement Chandelier Earrings", category: "Earrings", price: 28500, ageMin: 20, ageMax: 45, style: "statement", occasionTags: ["wedding", "anniversary"], relationshipTags: ["wife", "self"], gradient: "g-gold-bold" },
  { id: 37, name: "Traditional Gold Maang Tikka", category: "Hair Jewellery", price: 34500, ageMin: 18, ageMax: 45, style: "traditional", occasionTags: ["wedding", "festival"], relationshipTags: ["wife", "self"], gradient: "g-cream-gold" },
  { id: 38, name: "Everyday Rose Gold Studs", category: "Earrings", price: 4800, ageMin: 13, ageMax: 45, style: "minimal", occasionTags: ["everyday"], relationshipTags: ["self", "friend", "sister", "daughter"], gradient: "g-rose-soft" },
  { id: 39, name: "Anniversary Eternity Band", category: "Ring", price: 76000, ageMin: 25, ageMax: 60, style: "statement", occasionTags: ["anniversary"], relationshipTags: ["wife"], gradient: "g-gold-bold" },
  { id: 40, name: "Graduation Gift Bracelet", category: "Bracelet", price: 8900, ageMin: 18, ageMax: 26, style: "modern", occasionTags: ["graduation", "birthday"], relationshipTags: ["daughter", "friend", "self"], gradient: "g-rose-soft" }
];
