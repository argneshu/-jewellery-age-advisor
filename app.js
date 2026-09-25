// Aura — scoring engine + DOM wiring (deterministic weighted heuristic, fully client-side)

const AGE_BRACKETS = [
  { min: 1, max: 12, label: "safety-focused, lightweight" },
  { min: 13, max: 19, label: "trendy, affordable daily-wear" },
  { min: 20, max: 29, label: "statement, work-to-evening" },
  { min: 30, max: 45, label: "elegant, premium, investment" },
  { min: 46, max: 60, label: "classic, heritage" },
  { min: 61, max: 80, label: "timeless, low-maintenance" }
];

const HEIRLOOM_OCCASIONS = ["wedding", "anniversary"];
const HEIRLOOM_RELATIONSHIPS = ["wife", "mother"];

function ageBracketFor(age) {
  return AGE_BRACKETS.find((b) => age >= b.min && age <= b.max) || AGE_BRACKETS[AGE_BRACKETS.length - 1];
}

function scoreItem(item, criteria) {
  const { age, relationship, occasion, budget, style } = criteria;
  let score = 0;
  const reasons = [];

  // Age fit — closer to the item's age range midpoint scores higher
  if (age >= item.ageMin && age <= item.ageMax) {
    score += 40;
    reasons.push(`suits the ${ageBracketFor(age).label} phase`);
  } else {
    const distance = age < item.ageMin ? item.ageMin - age : age - item.ageMax;
    score += Math.max(0, 20 - distance);
  }

  // Heirloom skew for wedding/anniversary + wife/mother, independent of raw age bracket
  const isHeirloomContext = HEIRLOOM_OCCASIONS.includes(occasion) && HEIRLOOM_RELATIONSHIPS.includes(relationship);
  if (isHeirloomContext && item.style === "traditional") {
    score += 30;
    reasons.push(`an heirloom-style pick for ${occasion}`);
  }

  // Occasion tag boost
  if (item.occasionTags.includes(occasion)) {
    score += 20;
    reasons.push(`fits a ${occasion} occasion`);
  }

  // Relationship relevance
  if (item.relationshipTags.includes(relationship)) {
    score += 10;
  }

  // Style match (only if user specified a preference)
  if (style) {
    if (item.style === style) {
      score += 15;
      reasons.push(`matches your ${style} style preference`);
    } else {
      score -= 10;
    }
  }

  // Budget fit
  if (item.price <= budget) {
    score += 15;
    const headroom = budget - item.price;
    if (headroom / budget < 0.15) {
      reasons.push("makes great use of your budget");
    }
  } else {
    score -= 50;
  }

  return { score, reason: reasons[0] || `a thoughtful pick for a ${age}-year-old on ${occasion}` };
}

function recommend(criteria, items, limit = 6) {
  return items
    .map((item) => ({ item, ...scoreItem(item, criteria) }))
    .filter((r) => r.item.price <= criteria.budget)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

function formatPrice(price) {
  return "₹" + price.toLocaleString("en-IN");
}

function renderResults(results, criteria) {
  const grid = document.getElementById("results-grid");
  const noResults = document.getElementById("no-results");
  grid.innerHTML = "";

  if (results.length === 0) {
    noResults.hidden = false;
    return;
  }
  noResults.hidden = true;

  results.forEach(({ item, reason }, index) => {
    const card = document.createElement("article");
    card.className = "card";
    card.style.animationDelay = `${index * 60}ms`;
    card.innerHTML = `
      <div class="card-image ${item.gradient}"></div>
      <div class="card-body">
        <h3 class="card-name">${item.name}</h3>
        <p class="card-category">${item.category}</p>
        <p class="card-price">${formatPrice(item.price)}</p>
        <p class="card-why">Why: ${reason} for a ${criteria.age}-year-old on ${criteria.occasion}.</p>
      </div>
    `;
    grid.appendChild(card);
  });
}

function showScreen(id) {
  document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("advisor-form");
  const ageInput = document.getElementById("age");
  const ageValue = document.getElementById("age-value");
  const budgetInput = document.getElementById("budget");
  const budgetValue = document.getElementById("budget-value");
  const refilterBudget = document.getElementById("refilter-budget");
  const refilterBudgetValue = document.getElementById("refilter-budget-value");
  const refilterStyle = document.getElementById("refilter-style");
  const backLink = document.getElementById("back-link");

  let lastCriteria = null;

  ageInput.addEventListener("input", () => (ageValue.textContent = ageInput.value));
  budgetInput.addEventListener("input", () => (budgetValue.textContent = Number(budgetInput.value).toLocaleString("en-IN")));

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    lastCriteria = {
      age: Number(formData.get("age")),
      relationship: formData.get("relationship"),
      occasion: formData.get("occasion"),
      budget: Number(formData.get("budget")),
      style: formData.get("style") || ""
    };

    refilterBudget.value = lastCriteria.budget;
    refilterBudgetValue.textContent = lastCriteria.budget.toLocaleString("en-IN");
    refilterStyle.value = lastCriteria.style;

    const results = recommend(lastCriteria, JEWELLERY_ITEMS);
    renderResults(results, lastCriteria);
    showScreen("results-screen");
  });

  function applyRefilter() {
    if (!lastCriteria) return;
    const criteria = {
      ...lastCriteria,
      budget: Number(refilterBudget.value),
      style: refilterStyle.value
    };
    refilterBudgetValue.textContent = criteria.budget.toLocaleString("en-IN");
    const results = recommend(criteria, JEWELLERY_ITEMS);
    renderResults(results, criteria);
  }

  refilterBudget.addEventListener("input", applyRefilter);
  refilterStyle.addEventListener("change", applyRefilter);

  backLink.addEventListener("click", (e) => {
    e.preventDefault();
    showScreen("form-screen");
  });
});
