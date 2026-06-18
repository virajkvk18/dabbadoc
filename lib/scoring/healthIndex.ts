import type {
  FoodItem,
  HealthIndexSnapshot,
  HealthScoreBreakdown,
  RiskFlag,
  SwapRecommendation
} from "@/types";
import { clamp, todayIso } from "@/lib/utils";

const baseBreakdown: HealthScoreBreakdown = {
  processedFood: 80,
  sugarLoad: 82,
  sodiumLoad: 82,
  friedFood: 84,
  proteinAdequacy: 58,
  wholeFoods: 55,
  swapsAdopted: 45,
  streakConsistency: 50,
  labelTruthScore: 70
};

export function getScoreCategory(score: number) {
  if (score <= 40) return "Risky Pattern";
  if (score <= 60) return "Needs Improvement";
  if (score <= 80) return "Balanced but Improve";
  return "Healthy Trend";
}

export function calculateBreakdown(params: {
  items?: FoodItem[];
  riskFlags?: RiskFlag[];
  labelTruthScore?: number;
  streakCount?: number;
  swaps?: SwapRecommendation[];
}) {
  const items = params.items ?? [];
  const tags = items.flatMap((item) => item.flags ?? []);
  const highRisks = (params.riskFlags ?? []).filter(
    (risk) => risk.severity === "high"
  ).length;

  return {
    processedFood: clamp(
      baseBreakdown.processedFood -
        tags.filter((tag) => ["processed", "ultra_processed"].includes(tag)).length *
          11
    ),
    sugarLoad: clamp(
      baseBreakdown.sugarLoad -
        tags.filter((tag) => ["high_sugar", "added_sugar"].includes(tag)).length *
          13
    ),
    sodiumLoad: clamp(
      baseBreakdown.sodiumLoad -
        tags.filter((tag) => tag === "high_sodium").length * 14
    ),
    friedFood: clamp(
      baseBreakdown.friedFood - tags.filter((tag) => tag === "fried").length * 12
    ),
    proteinAdequacy: clamp(
      baseBreakdown.proteinAdequacy +
        items.filter((item) => item.flags?.includes("protein")).length * 11 -
        tags.filter((tag) => tag === "low_protein").length * 9
    ),
    wholeFoods: clamp(
      baseBreakdown.wholeFoods +
        tags.filter((tag) => ["whole_food", "vegetable", "fiber"].includes(tag))
          .length *
          8 -
        highRisks * 4
    ),
    swapsAdopted: clamp(
      baseBreakdown.swapsAdopted + (params.swaps ?? []).length * 8
    ),
    streakConsistency: clamp(
      baseBreakdown.streakConsistency + (params.streakCount ?? 0) * 4
    ),
    labelTruthScore: clamp(params.labelTruthScore ?? baseBreakdown.labelTruthScore)
  };
}

export function calculateHealthScore(breakdown: HealthScoreBreakdown) {
  const weights: Record<keyof HealthScoreBreakdown, number> = {
    processedFood: 0.14,
    sugarLoad: 0.14,
    sodiumLoad: 0.12,
    friedFood: 0.1,
    proteinAdequacy: 0.14,
    wholeFoods: 0.14,
    swapsAdopted: 0.08,
    streakConsistency: 0.06,
    labelTruthScore: 0.08
  };

  return Math.round(
    Object.entries(breakdown).reduce((score, [key, value]) => {
      return score + value * weights[key as keyof HealthScoreBreakdown];
    }, 0)
  );
}

export function awardBadges(params: {
  score: number;
  streakCount: number;
  riskFlags?: RiskFlag[];
  swaps?: SwapRecommendation[];
  labelTruthScore?: number;
}) {
  const badges = new Set<string>();
  badges.add("Family health starter");

  if (params.streakCount >= 3) badges.add("3-day tracker badge");
  if (params.streakCount >= 7) badges.add("7-day healthy streak badge");
  if (!(params.riskFlags ?? []).some((risk) => risk.label.includes("sugar"))) {
    badges.add("Sugar control badge");
  }
  if (params.score >= 65) badges.add("Protein improvement badge");
  if ((params.labelTruthScore ?? 0) >= 70) badges.add("Label aware badge");
  if ((params.swaps ?? []).length > 0) badges.add("Smart swap badge");

  return Array.from(badges);
}

export function createHealthSnapshot(params: {
  score: number;
  scoreBreakdown: HealthScoreBreakdown;
  streakCount?: number;
  badges?: string[];
}): HealthIndexSnapshot {
  const score = clamp(params.score);
  return {
    score,
    category: getScoreCategory(score),
    scoreBreakdown: params.scoreBreakdown,
    streakCount: params.streakCount ?? 1,
    badges: params.badges ?? [],
    history: [
      { date: "Day 1", score: clamp(score - 9) },
      { date: "Day 2", score: clamp(score - 6) },
      { date: "Day 3", score: clamp(score - 3) },
      { date: todayIso(), score }
    ]
  };
}
