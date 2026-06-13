import { findFoodDbRow } from "./foodParser";
import type { CostComparison, FoodItem, SwapRecommendation } from "@/types";

export async function compareCosts(
  items: FoodItem[],
  swaps: SwapRecommendation[]
): Promise<CostComparison> {
  const currentMonthlyEstimate = items.reduce((total, item) => {
    return total + (findFoodDbRow(item.name)?.monthlyCost ?? 500);
  }, 0);

  const healthierMonthlyEstimate =
    currentMonthlyEstimate + swaps.reduce((total, swap) => total + swap.costDelta, 0);

  return {
    currentMonthlyEstimate,
    healthierMonthlyEstimate,
    monthlySavings: currentMonthlyEstimate - healthierMonthlyEstimate,
    notes:
      "Estimate assumes similar monthly frequency. Actual cost changes depend on brand, quantity, and city."
  };
}
