import type { FoodItem, SwapRecommendation } from "@/types";

const SWAP_RISK_FLAGS = new Set([
  "high_sugar",
  "added_sugar",
  "fried",
  "high_fat",
  "high_sodium",
  "processed",
  "ultra_processed",
  "refined_flour",
  "maida",
  "palm_oil",
  "preservatives",
  "artificial_color",
  "artificial_flavour"
]);

const STRONG_SWAP_RISK_FLAGS = new Set([
  "high_sugar",
  "added_sugar",
  "fried",
  "high_fat",
  "ultra_processed",
  "refined_flour",
  "maida",
  "palm_oil"
]);

const POSITIVE_FOOD_FLAGS = new Set([
  "balanced",
  "whole_food",
  "fiber",
  "protein",
  "vegetable",
  "healthy_snack"
]);

const HEALTHY_STAPLE_WORDS = [
  "roti",
  "chapati",
  "phulka",
  "dal",
  "sabzi",
  "poha",
  "upma",
  "idli",
  "dosa",
  "curd",
  "dahi",
  "khichdi",
  "sprouts",
  "salad",
  "homemade",
  "home made"
];

const EXPLICIT_RISK_NAME_PATTERN =
  /\b(fried|deep fried|chips|kurkure|lays|cola|soft drink|soda|instant|maggi|noodle|maida|sugar|sweet|cookie|biscuit|cake|pastry|palm oil|vanaspati|packet|packaged|burger|pizza|fries)\b/i;

export function normalizeFoodName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function hasHealthyStapleName(value: string) {
  const normalized = ` ${normalizeFoodName(value)} `;
  return HEALTHY_STAPLE_WORDS.some((word) => normalized.includes(` ${word} `));
}

function hasHomemadeSignal(value: string) {
  return /\b(home|homemade|home made|ghar|ghar ka|ghar wala)\b/i.test(value);
}

export function isSwapEligibleItem(item: FoodItem) {
  const flags = new Set((item.flags ?? []).map((flag) => flag.toLowerCase()));
  const name = item.name ?? "";
  const category = item.category?.toLowerCase() ?? "";
  const hasSwapRisk = Array.from(flags).some((flag) => SWAP_RISK_FLAGS.has(flag));
  if (!hasSwapRisk) return false;

  const hasStrongRisk = Array.from(flags).some((flag) => STRONG_SWAP_RISK_FLAGS.has(flag));
  const hasPositiveSignal = Array.from(flags).some((flag) => POSITIVE_FOOD_FLAGS.has(flag));
  const looksLikeHealthyStaple = hasHealthyStapleName(name);
  const explicitlyRiskyName = EXPLICIT_RISK_NAME_PATTERN.test(name);
  const positiveCategory = ["whole_food", "protein", "healthy_snack"].includes(category);

  if (hasHomemadeSignal(name) && looksLikeHealthyStaple && !explicitlyRiskyName) {
    return false;
  }

  if (looksLikeHealthyStaple && !explicitlyRiskyName) {
    return false;
  }

  if ((positiveCategory || hasPositiveSignal) && !hasStrongRisk) {
    return false;
  }

  return true;
}

function findMatchingItem(original: string, items: FoodItem[]) {
  const normalizedOriginal = normalizeFoodName(original);
  if (!normalizedOriginal) return null;

  return (
    items.find((item) => normalizeFoodName(item.name) === normalizedOriginal) ??
    items.find((item) => {
      const normalizedItem = normalizeFoodName(item.name);
      return (
        normalizedItem.includes(normalizedOriginal) ||
        normalizedOriginal.includes(normalizedItem)
      );
    }) ??
    null
  );
}

export function filterContextualSwaps(
  swaps: SwapRecommendation[],
  items: FoodItem[]
) {
  const seen = new Set<string>();

  return swaps.filter((swap) => {
    const original = swap.original?.trim();
    const replacement = swap.swap?.trim();
    if (!original || !replacement) return false;

    const matchedItem = findMatchingItem(original, items);
    if (!matchedItem) return false;
    if (!isSwapEligibleItem(matchedItem)) return false;

    const key = `${normalizeFoodName(original)}-${normalizeFoodName(replacement)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
