import "server-only";

import type { DiaryInput, FoodDiaryAnalysis, FoodItem, ManualMealEntry } from "@/types";
import { DABBADOC_DISCLAIMER } from "@/types";
import { compareCosts } from "./costComparisonAgent";
import { explainWithDabbaBot } from "./dabbaBotAgent";
import { findFoodDbRow, parseFoodItemsFromText } from "./foodParser";
import { updateHealthIndex } from "./healthIndexAgent";
import { analyzeRisks } from "./riskAnalyzerAgent";
import { recommendSwaps } from "./swapRecommenderAgent";

const mealTimeLabels: Record<ManualMealEntry["mealTime"], string> = {
  breakfast: "breakfast",
  lunch: "lunch",
  evening_snack: "evening snack",
  dinner: "dinner",
  late_night: "late night"
};

function formatEntriesAsDiaryText(entries: ManualMealEntry[]) {
  return entries
    .map((entry) => {
      const source = entry.source === "home" ? "home food" : "outside food";
      const spice =
        entry.spiceLevel === "none" ? "no spice" : `${entry.spiceLevel} spice`;
      return `${mealTimeLabels[entry.mealTime]}: ${source}, ${entry.itemName}, quantity ${entry.quantity}, ${spice}${entry.notes ? `, ${entry.notes}` : ""}`;
    })
    .join(". ");
}

function estimateQuantityMultiplier(quantity: string) {
  const value = Number(quantity.match(/\d+(?:\.\d+)?/)?.[0] ?? 1);
  if (!Number.isFinite(value)) return 1;
  if (value >= 5) return 1.35;
  if (value >= 3) return 1.2;
  if (value <= 0.5) return 0.7;
  return 1;
}

function foodItemFromEntry(entry: ManualMealEntry): FoodItem {
  const match = findFoodDbRow(entry.itemName);
  const flags = new Set(match?.riskTags ?? []);

  if (entry.source === "home") {
    flags.add("whole_food");
  } else {
    flags.add("processed");
    flags.add("high_sodium");
  }

  if (entry.spiceLevel === "high") flags.add("high_spice");
  if (entry.itemName.toLowerCase().includes("fried")) flags.add("fried");

  const quantityMultiplier = estimateQuantityMultiplier(entry.quantity);
  const sourceMultiplier = entry.source === "outside" ? 1.15 : 0.9;
  const spiceMultiplier = entry.spiceLevel === "high" ? 1.05 : 1;

  return {
    name: match?.name ?? entry.itemName.trim(),
    category: entry.source === "home" ? "home_food" : "outside_food",
    quantity: entry.quantity,
    flags: Array.from(flags),
    confidence: match ? 0.92 : 0.72,
    calorieEstimate: Math.round(
      (match?.calories ?? 260) * quantityMultiplier * sourceMultiplier * spiceMultiplier
    ),
    proteinEstimate: Math.round((match?.protein ?? 7) * quantityMultiplier)
  };
}

function mergeItems(parsedItems: FoodItem[], entryItems: FoodItem[]) {
  if (entryItems.length === 0) return parsedItems;

  const merged = new Map<string, FoodItem>();
  [...parsedItems, ...entryItems].forEach((item) => {
    const key = item.name.toLowerCase();
    const existing = merged.get(key);
    if (!existing) {
      merged.set(key, item);
      return;
    }

    merged.set(key, {
      ...existing,
      quantity: existing.quantity ?? item.quantity,
      flags: Array.from(new Set([...(existing.flags ?? []), ...(item.flags ?? [])])),
      calorieEstimate: Math.max(
        existing.calorieEstimate ?? 0,
        item.calorieEstimate ?? 0
      ),
      proteinEstimate: Math.max(
        existing.proteinEstimate ?? 0,
        item.proteinEstimate ?? 0
      )
    });
  });

  return Array.from(merged.values());
}

function goalDiaryTips(goals?: string[]) {
  const tips: Record<string, string> = {
    "Weight loss": "For weight-loss goals, keep portions steady and add protein/fiber before cutting meals.",
    "Diabetes-friendly": "For diabetes-friendly goals, pair rice/roti/poha with dal, curd, paneer, eggs, or sprouts.",
    "High protein": "For high-protein goals, include one protein anchor in breakfast and evening snack.",
    "Low sodium": "For low-sodium goals, reduce packaged snacks, namkeen, sauces, and instant foods.",
    "Kids lunchbox": "For kids lunchbox goals, use simple tiffin options like chilla, fruit, curd, poha, or homemade rolls.",
    "Heart-friendly": "For heart-friendly goals, keep fried foods occasional and add sabzi, dal, nuts, or salad."
  };

  return (goals ?? []).map((goal) => tips[goal]).filter(Boolean).slice(0, 3);
}

function withHealthContext(text: string, healthContext?: string) {
  return [text, healthContext ? `User health profile: ${healthContext}` : null]
    .filter(Boolean)
    .join("\n");
}

export async function analyzeFoodDiary(
  input: DiaryInput
): Promise<FoodDiaryAnalysis> {
  const entries = input.entries ?? [];
  const diaryText =
    input.diaryText?.trim() ||
    (entries.length > 0
      ? formatEntriesAsDiaryText(entries)
      : "Aaj breakfast me poha, lunch me dal chawal, evening me samosa, dinner me roti sabzi khayi.");
  const entryItems = entries.map(foodItemFromEntry);
  const items = mergeItems(parseFoodItemsFromText(diaryText), entryItems);
  const personalizedDiaryText = withHealthContext(diaryText, input.healthContext);
  const riskFlags = await analyzeRisks(items, personalizedDiaryText);
  const healthierSwaps = await recommendSwaps(items);
  await compareCosts(items, healthierSwaps);

  const goodFoods = items.filter((item) =>
    (item.flags ?? []).some((flag) =>
      ["protein", "fiber", "whole_food", "vegetable", "balanced"].includes(flag)
    )
  );
  const riskyFoods = items.filter((item) =>
    (item.flags ?? []).some((flag) =>
      ["fried", "processed", "high_sodium", "high_sugar", "added_sugar"].includes(
        flag
      )
    )
  );

  const caloriesEstimate = items.reduce(
    (total, item) => total + (item.calorieEstimate ?? 180),
    0
  );
  const proteinEstimate = items.reduce(
    (total, item) => total + (item.proteinEstimate ?? 4),
    0
  );

  const health = await updateHealthIndex({
    items,
    riskFlags,
    swaps: healthierSwaps,
    streakCount: 4
  });

  const missingNutrients = [
    proteinEstimate < 45 ? "protein" : null,
    goodFoods.some((item) => item.flags?.includes("vegetable")) ? null : "vegetables",
    goodFoods.some((item) => item.flags?.includes("fiber")) ? null : "fiber"
  ].filter(Boolean) as string[];

  const improvementTips = [
    ...goalDiaryTips(input.healthGoals),
    "Add one protein anchor in breakfast or evening snack.",
    entries.some((entry) => entry.source === "outside")
      ? "Balance outside food with a home-style protein or salad in the next meal."
      : "Your home-food entries are a good base; improve balance with protein and vegetables.",
    entries.some((entry) => entry.spiceLevel === "high")
      ? "Keep high-spice meals occasional if they cause discomfort; choose medium spice more often."
      : "Keep spice levels comfortable and avoid pairing very spicy meals with fried snacks.",
    "Keep fried snacks to occasional use and pair cravings with roasted options.",
    "Use dal, curd, sprouts, paneer, eggs, or chana to improve fullness.",
    "Add one sabzi, salad, or fruit serving to close the micronutrient gap."
  ];

  const aiSummary = await explainWithDabbaBot({
    score: health.score,
    riskFlags,
    swaps: healthierSwaps,
    context: personalizedDiaryText,
    healthGoals: input.healthGoals
  });

  return {
    diaryText,
    entries,
    goodFoods,
    riskyFoods,
    caloriesEstimate,
    proteinEstimate,
    missingNutrients,
    improvementTips,
    healthierSwaps,
    dailyScore: health.score,
    streakCount: health.streakCount,
    badgesEarned: health.badges,
    aiSummary,
    disclaimer: DABBADOC_DISCLAIMER
  };
}
