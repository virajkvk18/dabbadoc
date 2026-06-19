import type {
  FoodItem,
  FoodItemInsight,
  HealthScoreBreakdown,
  NutritionInference,
  ReceiptAnalysis,
  RiskFlag,
  RiskSeverity
} from "@/types";
import { DABBADOC_DISCLAIMER } from "@/types";
import { clamp } from "@/lib/utils";
import { getScoreCategory } from "@/lib/scoring/healthIndex";

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

const highRiskWords = [
  "butter",
  "fried",
  "naan",
  "paratha",
  "biryani",
  "cream",
  "cheese",
  "sweet",
  "soda",
  "dessert",
  "gulab jamun",
  "rasmalai",
  "lassi",
  "mayo",
  "processed"
];

const friedWords = ["fried", "65", "spring roll", "pakora", "fries"];
const butterCreamWords = ["butter", "cream", "makhani", "malai", "cheese", "mayo"];
const refinedCarbWords = ["naan", "paratha", "rice", "biryani", "roti", "kulcha"];
const dessertWords = ["dessert", "gulab jamun", "rasmalai", "ice cream", "kheer", "halwa"];
const sugaryDrinkWords = ["sweet lassi", "soda", "cola", "soft drink", "juice", "shake"];
const vegetableSoupWords = [
  "soup",
  "veg",
  "vegetable",
  "hara bhara",
  "tomato",
  "kadai veg",
  "salad"
];

const sectionHeaders = new Set([
  "starters",
  "starter",
  "soups",
  "soup",
  "main course",
  "breads",
  "bread",
  "rice biryani",
  "rice and biryani",
  "rice & biryani",
  "desserts",
  "dessert",
  "beverages"
]);

const restaurantFoodWords = [
  ...proteinWords,
  ...highRiskWords,
  ...friedWords,
  ...butterCreamWords,
  ...refinedCarbWords,
  ...dessertWords,
  ...sugaryDrinkWords,
  ...vegetableSoupWords,
  "kebab",
  "tikka",
  "roll",
  "manchow",
  "tomato soup",
  "masala",
  "kadai",
  "roti",
  "chaas",
  "lime",
  "water"
];

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function hasAny(normalized: string, words: string[]) {
  return words.some((word) => normalized.includes(normalize(word)));
}

function classifyCategory(name: string) {
  const normalized = normalize(name);
  if (hasAny(normalized, dessertWords)) return "dessert";
  if (hasAny(normalized, sugaryDrinkWords) || normalized.includes("chaas")) return "beverage";
  if (normalized.includes("soup")) return "soup";
  if (hasAny(normalized, ["naan", "roti", "paratha", "kulcha"])) return "bread";
  if (hasAny(normalized, ["rice", "biryani"])) return "rice_or_biryani";
  if (hasAny(normalized, ["paneer", "dal", "chicken", "kadai veg", "butter masala"])) {
    return "main_course";
  }
  return "restaurant_item";
}

function parseNumber(value?: string) {
  if (!value) return undefined;
  const parsed = Number(value.replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : undefined;
}

function isNoiseLine(line: string) {
  return /\b(sr|item|qty|rate|amount|subtotal|discount|taxable|grand total|payment|upi|gstin|phone|bill no|date|time|thank you|visit again|plot no|server|guests|table no|cgst|sgst|service charge|address|koramangala|bengaluru|bangalore|karnataka|transaction|amount paid|payment mode|restaurant|dine in)\b/i.test(line);
}

function parseStrictRestaurantLine(line: string) {
  const match = line.match(/^(?:\d+[\).]?\s+)?([A-Za-z][A-Za-z0-9 &()/-]*?)\s+(\d+)\s+\d+(?:\.\d{1,2})?\s+(\d+(?:\.\d{1,2})?)$/);
  if (!match) return null;

  return {
    name: match[1].replace(/\s+/g, " ").trim(),
    quantity: parseNumber(match[2]) ?? 1,
    amount: parseNumber(match[3])
  };
}

function parseLooseRestaurantLine(line: string, insideMenuSection: boolean) {
  const withoutSerial = line.replace(/^\s*\d+[\).]?\s+/, "").replace(/\s+/g, " ").trim();
  if (!withoutSerial || isNoiseLine(withoutSerial)) return null;

  const normalized = normalize(withoutSerial);
  const hasFoodSignal = hasAny(normalized, restaurantFoodWords);
  if (!insideMenuSection && !hasFoodSignal) return null;

  const numericValues = withoutSerial.match(/\b\d+(?:,\d{3})*(?:\.\d{1,2})?\b/g) ?? [];
  const name = withoutSerial
    .replace(/\s+\d+(?:,\d{3})*(?:\.\d{1,2})?(?:\s+\d+(?:,\d{3})*(?:\.\d{1,2})?){0,3}\s*$/, "")
    .replace(/\s+x\d+\b/gi, " ")
    .replace(/\b(?:rs\.?|inr|qty|rate|amount|amt)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (name.length < 3 || !/[a-zA-Z]/.test(name)) return null;
  if (!hasAny(normalize(name), restaurantFoodWords) && !insideMenuSection) return null;

  const quantity = numericValues.length >= 3 ? parseNumber(numericValues[0]) ?? 1 : 1;
  const amount = numericValues.length ? parseNumber(numericValues[numericValues.length - 1]) : undefined;

  return { name, quantity, amount };
}

function dedupeRestaurantItems(items: Array<{ name: string; quantity: number; amount?: number }>) {
  const seen = new Set<string>();
  const deduped: Array<{ name: string; quantity: number; amount?: number }> = [];
  for (const item of items) {
    const key = normalize(item.name);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    deduped.push(item);
  }
  return deduped;
}

export function parseRestaurantBillItems(rawText: string) {
  const items: Array<{ name: string; quantity: number; amount?: number }> = [];
  let insideMenuSection = false;

  for (const rawLine of rawText.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || /^[-=]+$/.test(line)) continue;

    const cleanedHeader = normalize(line);
    if (sectionHeaders.has(cleanedHeader)) {
      insideMenuSection = true;
      continue;
    }
    if (/\b(subtotal|discount|taxable|grand total|payment|thank you)\b/i.test(line)) {
      insideMenuSection = false;
    }
    if (isNoiseLine(line)) continue;

    const item = parseStrictRestaurantLine(line) ?? parseLooseRestaurantLine(line, insideMenuSection);
    if (!item || item.name.length < 3) continue;
    items.push(item);
  }

  return dedupeRestaurantItems(items);
}

export function restaurantItemTextForAnalysis(rawText: string) {
  const items = parseRestaurantBillItems(rawText);
  if (items.length === 0) return rawText;

  return items
    .map((item, index) => {
      const amount = typeof item.amount === "number" ? ` ${item.amount.toFixed(2)}` : "";
      return `${index + 1}. ${item.name} x${item.quantity}${amount}`;
    })
    .join("\n");
}

function insightForItem(item: { name: string; quantity: number; amount?: number }): FoodItemInsight {
  const normalized = normalize(item.name);
  const positives: string[] = [];
  const concerns: string[] = [];
  const riskTags: string[] = [];

  const proteinSignal = hasAny(normalized, proteinWords);
  if (proteinSignal) positives.push("Protein source");
  if (hasAny(normalized, vegetableSoupWords)) positives.push("Vegetable/soup signal");

  if (hasAny(normalized, friedWords)) {
    concerns.push("Fried or oil-heavy item");
    riskTags.push("fried", "high_fat");
  }
  if (hasAny(normalized, butterCreamWords)) {
    concerns.push("Butter/cream-heavy preparation");
    riskTags.push("high_fat");
  }
  if (hasAny(normalized, refinedCarbWords)) {
    concerns.push("Refined-carb or rice-heavy item");
    riskTags.push("refined_flour");
  }
  if (hasAny(normalized, dessertWords)) {
    concerns.push("Dessert sugar load");
    riskTags.push("added_sugar", "dessert");
  }
  if (hasAny(normalized, sugaryDrinkWords)) {
    concerns.push("Sugary beverage signal");
    riskTags.push("high_sugar", "sugary_drink");
  }
  if (hasAny(normalized, highRiskWords) && riskTags.length === 0) {
    riskTags.push("restaurant_indulgence");
  }

  const inferredCalories =
    concerns.length >= 2 || item.quantity >= 2
      ? "high"
      : concerns.length === 1
        ? "medium"
        : "unknown";

  return {
    item: item.name,
    quantity: item.quantity,
    category: classifyCategory(item.name),
    proteinSignal,
    positives,
    concerns,
    inferredCalories,
    riskTags
  };
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function buildNutritionInference(items: FoodItemInsight[]): NutritionInference {
  const byConcern = (needle: string) =>
    items.filter((item) => item.concerns.some((concern) => concern.toLowerCase().includes(needle))).map((item) => item.item);

  const highCalorieCount = items.filter((item) => item.inferredCalories === "high").length;
  const mediumCalorieCount = items.filter((item) => item.inferredCalories === "medium").length;

  return {
    proteinSources: items.filter((item) => item.proteinSignal).map((item) => item.item),
    friedItems: byConcern("fried"),
    butterCreamItems: byConcern("butter"),
    refinedCarbs: byConcern("refined"),
    desserts: byConcern("dessert"),
    sugaryBeverages: byConcern("sugary"),
    vegetableOrSoupItems: items
      .filter((item) => item.positives.some((positive) => positive.includes("Vegetable") || positive.includes("soup")))
      .map((item) => item.item),
    estimatedCaloriesLevel:
      highCalorieCount >= 5 ? "high" : mediumCalorieCount + highCalorieCount >= 3 ? "medium" : "unknown",
    confidence: items.length >= 8 ? "high" : items.length >= 3 ? "medium" : "low"
  };
}

function riskLevel(score: number): RiskSeverity {
  if (score <= 45) return "high";
  if (score <= 64) return "medium";
  return "low";
}

function scoreRestaurantMeal(params: {
  items: FoodItemInsight[];
  inference: NutritionInference;
  guestCount?: number;
  totalAmount?: number;
}) {
  let score = 50;

  score += Math.min(14, params.inference.proteinSources.length * 3);
  score += Math.min(8, params.inference.vegetableOrSoupItems.length * 2);
  score += new Set(params.items.map((item) => item.category)).size >= 5 ? 5 : 0;

  score -= Math.min(12, params.inference.friedItems.length * 4);
  score -= Math.min(14, params.inference.butterCreamItems.length * 3);
  score -= Math.min(14, params.inference.refinedCarbs.length * 2);
  score -= Math.min(12, params.inference.desserts.length * 4);
  score -= Math.min(10, params.inference.sugaryBeverages.length * 4);

  const perPerson =
    params.totalAmount && params.guestCount ? params.totalAmount / params.guestCount : undefined;
  if (perPerson && perPerson > 700) score -= 5;
  if (params.items.length > 18) score -= 4;

  return clamp(Math.round(score), 20, 75);
}

function extractGuestCount(text: string) {
  return parseNumber(text.match(/\bguests?\s*:?\s*(\d+)/i)?.[1]);
}

function extractGrandTotal(text: string) {
  return parseNumber(text.match(/\bgrand\s+total\b[^0-9]*(\d+(?:,\d{3})*(?:\.\d{1,2})?)/i)?.[1]?.replace(/,/g, ""));
}

function restaurantRiskFlags(inference: NutritionInference): RiskFlag[] {
  const flags: RiskFlag[] = [];
  if (inference.butterCreamItems.length > 0) {
    flags.push({
      label: "Butter/cream-heavy restaurant meal",
      severity: "medium",
      reason: "Several dishes look rich in butter, cream, or high-fat gravies.",
      possibleConcern: "Frequent rich restaurant meals may raise calorie and saturated-fat load."
    });
  }
  if (inference.refinedCarbs.length >= 3) {
    flags.push({
      label: "Refined-carb heavy order",
      severity: "medium",
      reason: "Naan, paratha, rice, and biryani increase the refined-carb/rice-heavy base.",
      possibleConcern: "This can reduce fullness balance unless paired with protein, dal, curd, and vegetables."
    });
  }
  if (inference.desserts.length > 0 || inference.sugaryBeverages.length > 0) {
    flags.push({
      label: "Dessert and sweet drink load",
      severity: "high",
      reason: "Desserts or sweet beverages were detected in the order.",
      possibleConcern: "Repeated sugar-heavy restaurant add-ons may increase calorie and sugar load."
    });
  }
  if (inference.friedItems.length > 0) {
    flags.push({
      label: "Fried starter signal",
      severity: "medium",
      reason: "At least one fried/oil-heavy starter appears in the bill.",
      possibleConcern: "Fried starters add calories quickly when combined with rich gravies and breads."
    });
  }
  return flags;
}

function buildBreakdown(score: number, proteinScore: number): HealthScoreBreakdown {
  return {
    processedFood: clamp(score + 10),
    sugarLoad: clamp(score + 8),
    sodiumLoad: clamp(score),
    friedFood: clamp(score),
    proteinAdequacy: proteinScore,
    wholeFoods: clamp(score + 4),
    swapsAdopted: 45,
    streakConsistency: 50,
    labelTruthScore: 70
  };
}

function foodItemsFromInsights(items: FoodItemInsight[]): FoodItem[] {
  return items.map((item) => ({
    name: item.item,
    category: item.category,
    quantity: item.quantity ? String(item.quantity) : undefined,
    confidence: 0.86,
    flags: [
      ...(item.proteinSignal ? ["protein"] : []),
      ...item.riskTags
    ],
    proteinEstimate: item.proteinSignal ? 12 : 4,
    calorieEstimate: item.inferredCalories === "high" ? 420 : item.inferredCalories === "medium" ? 260 : 180
  }));
}

export function analyzeRestaurantReceipt(rawText: string): ReceiptAnalysis {
  const parsedItems = parseRestaurantBillItems(rawText);
  const itemBreakdown = parsedItems.map(insightForItem);
  const focusedText = parsedItems.length ? restaurantItemTextForAnalysis(rawText) : rawText;

  if (itemBreakdown.length === 0) {
    return {
      receiptType: "restaurant_bill",
      extractedText: focusedText,
      detectedItems: [],
      riskFlags: [],
      healthScore: 50,
      proteinScore: 0,
      riskLevel: "insufficient_data",
      positives: [],
      concerns: ["Insufficient readable menu items to infer restaurant nutrition."],
      itemBreakdown: [],
      restaurantItemBreakdown: [],
      nutritionInference: {
        proteinSources: [],
        friedItems: [],
        butterCreamItems: [],
        refinedCarbs: [],
        desserts: [],
        sugaryBeverages: [],
        vegetableOrSoupItems: [],
        estimatedCaloriesLevel: "unknown",
        confidence: "low"
      },
      mealBalanceSummary:
        "DabbaDoc could identify this as a restaurant bill, but not enough menu items were readable for a confident score.",
      suggestions: ["Upload a clearer bill image or crop only the menu item area."],
      scoreCategory: "Insufficient Data",
      scoreBreakdown: buildBreakdown(50, 0),
      blameMap: [],
      swaps: [],
      costSummary: {
        currentMonthlyEstimate: 0,
        healthierMonthlyEstimate: 0,
        monthlySavings: 0,
        notes: "No reliable item-level cost estimate because menu items were not readable."
      },
      actionPlan: ["Retry with a clearer receipt image."],
      aiSummary: "Insufficient restaurant item data. Please retry with a clearer receipt.",
      disclaimer: DABBADOC_DISCLAIMER
    };
  }

  const inference = buildNutritionInference(itemBreakdown);
  const proteinScore = clamp(35 + inference.proteinSources.length * 10, 0, 100);
  const healthScore = scoreRestaurantMeal({
    items: itemBreakdown,
    inference,
    guestCount: extractGuestCount(rawText),
    totalAmount: extractGrandTotal(rawText)
  });
  const riskFlags = restaurantRiskFlags(inference);
  const detectedItems = foodItemsFromInsights(itemBreakdown);
  const positives = unique([
    inference.proteinSources.length
      ? `Protein sources found: ${inference.proteinSources.slice(0, 5).join(", ")}`
      : "",
    inference.vegetableOrSoupItems.length
      ? `Vegetable/soup balance from ${inference.vegetableOrSoupItems.slice(0, 4).join(", ")}`
      : "",
    "Restaurant nutrition was inferred from dish names instead of requiring exact label values."
  ]);
  const concerns = unique([
    inference.butterCreamItems.length
      ? `Butter/cream-heavy dishes: ${inference.butterCreamItems.slice(0, 5).join(", ")}`
      : "",
    inference.refinedCarbs.length
      ? `Bread/rice-heavy items: ${inference.refinedCarbs.slice(0, 6).join(", ")}`
      : "",
    inference.desserts.length || inference.sugaryBeverages.length
      ? "Desserts or sweet drinks add sugar and calories."
      : "",
    inference.friedItems.length ? `Fried starter signal: ${inference.friedItems.join(", ")}` : ""
  ]);
  const suggestions = [
    "Keep paneer/dal/chicken as protein anchors, but reduce butter-heavy gravies.",
    "Choose tandoori roti or fewer breads instead of multiple naan/paratha portions.",
    "Pick either dessert or sweet drink, not both, and share portions.",
    "Add salad, plain curd, chaas, or extra vegetables to balance the restaurant meal."
  ];
  const mealBalanceSummary = `Your order has decent protein from ${inference.proteinSources.slice(0, 4).join(", ") || "some menu items"}, but it is also heavy in butter/cream, refined carbs, desserts, and sweet beverages. This is not a zero-health meal; it is a high-calorie restaurant meal with a suggested score of ${healthScore}/100.`;

  return {
    receiptType: "restaurant_bill",
    extractedText: focusedText,
    detectedItems,
    riskFlags,
    futureHealthRisks: [],
    itemInsights: [],
    coverageSummary: {
      detectedCount: detectedItems.length,
      riskyCount: itemBreakdown.filter((item) => item.concerns.length > 0).length,
      swappedCount: 0,
      confidenceNote:
        "Restaurant bill analysis infers nutrition from readable Indian dish names. Exact calories and macros are estimates, not label facts."
    },
    healthScore,
    proteinScore,
    riskLevel: riskLevel(healthScore),
    positives,
    concerns,
    itemBreakdown,
    restaurantItemBreakdown: itemBreakdown,
    nutritionInference: inference,
    mealBalanceSummary,
    suggestions,
    scoreCategory: getScoreCategory(healthScore),
    scoreBreakdown: buildBreakdown(healthScore, proteinScore),
    blameMap: [],
    swaps: [],
    costSummary: {
      currentMonthlyEstimate: extractGrandTotal(rawText) ?? 0,
      healthierMonthlyEstimate: 0,
      monthlySavings: 0,
      notes: "Restaurant score uses inferred dish quality. Cost comparison is not estimated for one dine-in bill."
    },
    actionPlan: suggestions,
    aiSummary: `${mealBalanceSummary} Suggested improvements: ${suggestions.slice(0, 2).join(" ")}`,
    disclaimer: DABBADOC_DISCLAIMER
  };
}
