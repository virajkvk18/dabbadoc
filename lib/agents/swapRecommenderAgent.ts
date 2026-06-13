import swaps from "@/data/healthy-swaps.json";
import type { FoodItem, SwapRecommendation } from "@/types";

type SwapRow = SwapRecommendation;

const swapRows = swaps as SwapRow[];

export async function recommendSwaps(items: FoodItem[]) {
  const recommendations = items.flatMap((item) =>
    swapRows.filter(
      (swap) => swap.original.toLowerCase() === item.name.toLowerCase()
    )
  );

  if (recommendations.length > 0) {
    return recommendations.slice(0, 8);
  }

  return swapRows.slice(0, 5);
}
