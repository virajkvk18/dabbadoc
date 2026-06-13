import swaps from "@/data/healthy-swaps.json";
import type { FoodItem, SwapRecommendation } from "@/types";

type SwapRow = SwapRecommendation;

const swapRows = swaps as SwapRow[];

function genericSwapForItem(item: FoodItem): SwapRecommendation | null {
  const flags = new Set(item.flags ?? []);

  if (flags.has("high_sugar") || flags.has("added_sugar")) {
    return {
      original: item.name,
      swap: "chaas, coconut water, or unsweetened nimbu pani",
      reason: "Helps lower added sugar load while keeping a familiar drink/snack slot.",
      costDelta: -150,
      scoreImpact: 9
    };
  }

  if (flags.has("fried") || flags.has("high_fat")) {
    return {
      original: item.name,
      swap: "roasted chana, makhana, or sprouts chaat",
      reason: "Keeps the snack format but reduces oil load and improves protein/fiber.",
      costDelta: -120,
      scoreImpact: 9
    };
  }

  if (flags.has("high_sodium") || flags.has("processed")) {
    return {
      original: item.name,
      swap: "poha with peanuts, oats upma, or homemade chilla",
      reason: "A less processed Indian option with better satiety and lower sodium.",
      costDelta: -100,
      scoreImpact: 8
    };
  }

  if (flags.has("refined_flour") || flags.has("maida")) {
    return {
      original: item.name,
      swap: "atta-based or millet-based version with curd/salad",
      reason: "Improves whole-grain balance and makes the meal more filling.",
      costDelta: 50,
      scoreImpact: 7
    };
  }

  if (flags.has("low_protein")) {
    return {
      original: item.name,
      swap: "add curd, dal, paneer, egg, or sprouts on the side",
      reason: "Adds protein so the meal is less carb-heavy.",
      costDelta: 120,
      scoreImpact: 8
    };
  }

  if (flags.has("palm_oil")) {
    return {
      original: item.name,
      swap: "homemade snack, fruit and nuts, or roasted makhana",
      reason: "Reduces hidden refined-oil load from packaged foods.",
      costDelta: -80,
      scoreImpact: 7
    };
  }

  return null;
}

export async function recommendSwaps(items: FoodItem[]) {
  const recommendations = items.flatMap((item) =>
    swapRows.filter(
      (swap) => swap.original.toLowerCase() === item.name.toLowerCase()
    )
  );

  const genericRecommendations = items
    .map(genericSwapForItem)
    .filter((swap): swap is SwapRecommendation => Boolean(swap));

  return [...recommendations, ...genericRecommendations].slice(0, 8);
}
