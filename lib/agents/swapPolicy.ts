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
  "low_protein",
  "palm_oil",
  "preservatives",
  "artificial_color",
  "artificial_flavour"
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

export function normalizeFoodName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function hasHealthyStapleName(value: string) {
  const normalized = ` ${normalizeFoodName(value)} `;
  return HEALTHY_STAPLE_WORDS.some((word) => normalized.includes(` ${word} `));
}

export function isSwapEligibleItem(item: FoodItem) {
  const flags = new Set((item.flags ?? []).map((flag) => flag.toLowerCase()));
  return Array.from(flags).some((flag) => SWAP_RISK_FLAGS.has(flag));
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
    if (hasHealthyStapleName(original) && !isSwapEligibleItem(matchedItem)) return false;

    const key = `${normalizeFoodName(original)}-${normalizeFoodName(replacement)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
