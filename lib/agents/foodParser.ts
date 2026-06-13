import foodDb from "@/data/indian-food-db.json";
import type { FoodItem } from "@/types";

type FoodDbRow = {
  name: string;
  aliases: string[];
  category: string;
  riskTags: string[];
  calories: number;
  protein: number;
  monthlyCost: number;
};

const rows = foodDb as FoodDbRow[];

export function parseFoodItemsFromText(text: string): FoodItem[] {
  const lowerText = text.toLowerCase();
  const matches = rows
    .filter((row) =>
      row.aliases.some((alias) => lowerText.includes(alias.toLowerCase()))
    )
    .map<FoodItem>((row) => ({
      name: row.name,
      category: row.category,
      flags: row.riskTags,
      confidence: 0.86,
      calorieEstimate: row.calories,
      proteinEstimate: row.protein
    }));

  if (matches.length > 0) return matches;

  return rows.slice(0, 4).map((row) => ({
    name: row.name,
    category: row.category,
    flags: row.riskTags,
    confidence: 0.56,
    calorieEstimate: row.calories,
    proteinEstimate: row.protein
  }));
}

export function findFoodDbRow(name: string) {
  return rows.find(
    (row) =>
      row.name.toLowerCase() === name.toLowerCase() ||
      row.aliases.some((alias) => alias.toLowerCase() === name.toLowerCase())
  );
}

export function getFoodRows() {
  return rows;
}
