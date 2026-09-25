# Aura — Jewellery Age Advisor

A static, fully client-side MVP: the shopper describes who they're buying for, and Aura
recommends jewellery suited to that person's age and occasion, with a one-line explanation of
why each piece was picked.

## Run locally

No build step, no dependencies. Any static file server works, e.g.:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

Opening `index.html` directly in a browser also works.

## Deploy

Deployable as a static site (e.g. Vercel) with no build command — the app is just
`index.html`, `styles.css`, `data.js`, and `app.js`.

## Files

- `index.html` — form screen + results screen markup
- `styles.css` — cream/ivory + gold/rose-gold theme, responsive layout, transitions
- `data.js` — static dataset of 40 invented jewellery items
- `app.js` — scoring engine (age fit, heirloom skew for wedding/anniversary + wife/mother,
  occasion tag boost, style match, budget fit) and DOM wiring for both screens

## Assumptions

- Prices and item names are invented for demo purposes — not real inventory.
- Currency is INR (₹) per the ₹1,000–₹2,00,000 budget spec.
- No real images are used; each card uses a CSS gradient placeholder colored by category.
- Age ranges slightly overlap at the edges for a few occasion-driven items (e.g. wedding/festival
  sets spanning wider ages) so results don't go empty on edge-case combinations.
- Scoring is a deterministic weighted heuristic, not a real ML model — designed to feel
  personalized while remaining fully client-side and predictable.
