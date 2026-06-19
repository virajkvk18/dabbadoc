export type BackendReceiptType =
  | "grocery_receipt"
  | "restaurant_bill"
  | "packaged_food_label"
  | "unknown";

type ParsedItem = {
  name: string;
  quantity: number;
  amount?: number;
};

const restaurantSignals = [
  "table no",
  "server",
  "guests",
  "dine in",
  "starters",
  "soups",
  "main course",
  "breads",
  "biryani",
  "desserts",
  "beverages",
  "service charge",
  "cgst",
  "sgst",
  "restaurant",
  "kebab",
  "naan",
  "paratha",
  "paneer butter",
  "dal makhani",
  "butter chicken"
];

const packagedLabelSignals = [
  "ingredients",
  "nutrition",
  "nutrition facts",
  "per 100g",
  "serving size",
  "added sugar",
  "saturated fat",
  "trans fat",
  "sodium"
];

const grocerySignals = [
  "mrp",
  "qty",
  "quantity",
  "grocery",
  "supermarket",
  "mart",
  "item total",
  "sku",
  "hsn",
  "barcode"
];

const proteinWords = [
  "paneer",
  "dal",
  "chicken",
  "egg",
  "fish",
  "curd",
  "yogurt",
  "chana",
  "rajma",
  "sprouts",
  "tofu",
  "soya"
];

const friedWords = ["fried", "65", "spring roll", "pakora", "fries"];
const butterCreamWords = ["butter", "cream", "makhani", "malai", "cheese", "mayo"];
const refinedCarbWords = ["naan", "paratha", "rice", "biryani", "kulcha"];
const dessertWords = ["gulab jamun", "rasmalai", "dessert", "ice cream", "kheer", "halwa"];
const sugaryDrinkWords = ["sweet lassi", "soda", "cola", "soft drink", "juice", "shake"];
const vegetableSoupWords = ["soup", "veg", "vegetable", "hara bhara", "tomato", "salad"];

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function countSignals(text: string, signals: string[]) {
  return signals.reduce(
    (count, signal) => count + (text.includes(normalize(signal)) ? 1 : 0),
    0
  );
}

function hasAny(text: string, words: string[]) {
  return words.some((word) => text.includes(normalize(word)));
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function detectBackendReceiptType(rawText: string): BackendReceiptType {
  const text = normalize(rawText);
  if (!text) return "unknown";

  const restaurantScore = countSignals(text, restaurantSignals);
  const labelScore = countSignals(text, packagedLabelSignals);
  const groceryScore = countSignals(text, grocerySignals);

  if (restaurantScore >= 3) return "restaurant_bill";
  if (labelScore >= 3 && restaurantScore < 2) return "packaged_food_label";
  if (groceryScore >= 2) return "grocery_receipt";
  if (restaurantScore >= 2 && /bill|total|amount|tax/.test(text)) return "restaurant_bill";
  return "unknown";
}

function parseNumber(value?: string) {
  if (!value) return undefined;
  const parsed = Number(value.replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseRestaurantItems(rawText: string): ParsedItem[] {
  const items: ParsedItem[] = [];
  for (const rawLine of rawText.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || /^[-=]+$/.test(line)) continue;
    if (
      /\b(sr|item|qty|rate|amount|subtotal|discount|taxable|grand total|payment|upi|gstin|phone|bill no|date|time|thank you|server|guests|table no|cgst|sgst|service charge)\b/i.test(
        line
      )
    ) {
      continue;
    }

    const match = line.match(
      /^(?:\d+\s+)?([A-Za-z][A-Za-z &()/-]*?)\s+(\d+)\s+\d+(?:\.\d{1,2})?\s+(\d+(?:\.\d{1,2})?)$/
    );
    if (!match) continue;
    items.push({
      name: match[1].replace(/\s+/g, " ").trim(),
      quantity: parseNumber(match[2]) ?? 1,
      amount: parseNumber(match[3])
    });
  }
  return items;
}

export function analyzeRestaurantText(rawText: string) {
  const items = parseRestaurantItems(rawText);
  if (items.length === 0) {
    return {
      receiptType: "restaurant_bill" as const,
      healthScore: null,
      proteinScore: 0,
      riskLevel: "unknown",
      positives: [],
      concerns: ["Could not find enough item names in the bill."],
      itemBreakdown: [],
      mealBalanceSummary: "Insufficient item data. Try a clearer receipt image.",
      suggestions: ["Retake the receipt with item rows visible."],
      disclaimer: "This is general wellness guidance, not medical advice."
    };
  }

  const itemBreakdown = items.map((item) => {
    const text = normalize(item.name);
    const proteinSignal = hasAny(text, proteinWords);
    const concerns = [
      hasAny(text, friedWords) ? "Fried/oil-heavy" : null,
      hasAny(text, butterCreamWords) ? "Butter/cream-heavy" : null,
      hasAny(text, refinedCarbWords) ? "Refined carb or rice-heavy" : null,
      hasAny(text, dessertWords) ? "Dessert sugar load" : null,
      hasAny(text, sugaryDrinkWords) ? "Sugary beverage" : null
    ].filter(Boolean);
    const positives = [
      proteinSignal ? "Protein source" : null,
      hasAny(text, vegetableSoupWords) ? "Vegetable/soup signal" : null
    ].filter(Boolean);
    return {
      item: item.name,
      quantity: item.quantity,
      amount: item.amount,
      proteinSignal,
      positives,
      concerns
    };
  });

  const proteinSources = itemBreakdown.filter((item) => item.proteinSignal).map((item) => item.item);
  const friedItems = itemBreakdown.filter((item) => item.concerns.includes("Fried/oil-heavy"));
  const richItems = itemBreakdown.filter((item) => item.concerns.includes("Butter/cream-heavy"));
  const carbItems = itemBreakdown.filter((item) => item.concerns.includes("Refined carb or rice-heavy"));
  const desserts = itemBreakdown.filter((item) => item.concerns.includes("Dessert sugar load"));
  const sugaryDrinks = itemBreakdown.filter((item) => item.concerns.includes("Sugary beverage"));
  const vegetableSignals = itemBreakdown.filter((item) =>
    item.positives.includes("Vegetable/soup signal")
  );

  let score = 50;
  score += Math.min(14, proteinSources.length * 3);
  score += Math.min(8, vegetableSignals.length * 2);
  score -= Math.min(12, friedItems.length * 4);
  score -= Math.min(14, richItems.length * 3);
  score -= Math.min(14, carbItems.length * 2);
  score -= Math.min(12, desserts.length * 4);
  score -= Math.min(10, sugaryDrinks.length * 4);
  if (items.length > 18) score -= 4;
  const healthScore = clamp(Math.round(score), 20, 75);

  return {
    receiptType: "restaurant_bill" as const,
    healthScore,
    proteinScore: clamp(proteinSources.length * 14, 0, 100),
    riskLevel: healthScore <= 45 ? "high" : healthScore <= 64 ? "medium" : "low",
    positives: [
      proteinSources.length
        ? `Protein present from ${proteinSources.slice(0, 4).join(", ")}`
        : null,
      vegetableSignals.length ? "Soups/vegetable items add some balance." : null
    ].filter(Boolean),
    concerns: [
      friedItems.length ? "Fried/oil-heavy starters are present." : null,
      richItems.length ? "Butter/cream-heavy gravies increase calorie load." : null,
      carbItems.length ? "Naan, paratha, rice, or biryani make this carb-heavy." : null,
      desserts.length || sugaryDrinks.length ? "Desserts or sweet drinks add sugar load." : null
    ].filter(Boolean),
    itemBreakdown,
    mealBalanceSummary:
      "This looks like a restaurant meal with some protein and variety, but also rich gravies, refined carbs, and sugar/fat load.",
    suggestions: [
      "Keep one protein dish and one dal/curd item.",
      "Reduce one butter/cream gravy or fried starter.",
      "Choose roti/chaas/water more often than naan, sweet lassi, or soda.",
      "Share desserts instead of ordering one per person."
    ],
    disclaimer: "This is general wellness guidance based on dish names, not exact lab nutrition."
  };
}
