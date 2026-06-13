import type { FoodItem, RiskFlag, SwapRecommendation } from "@/types";
import {
  awardBadges,
  calculateBreakdown,
  calculateHealthScore,
  createHealthSnapshot,
  getScoreCategory
} from "@/lib/scoring/healthIndex";

export async function updateHealthIndex(params: {
  items: FoodItem[];
  riskFlags: RiskFlag[];
  swaps: SwapRecommendation[];
  labelTruthScore?: number;
  streakCount?: number;
}) {
  const scoreBreakdown = calculateBreakdown(params);
  const score = calculateHealthScore(scoreBreakdown);
  const streakCount = params.streakCount ?? 1;
  const badges = awardBadges({
    score,
    streakCount,
    riskFlags: params.riskFlags,
    swaps: params.swaps,
    labelTruthScore: params.labelTruthScore
  });

  return {
    score,
    category: getScoreCategory(score),
    scoreBreakdown,
    streakCount,
    badges,
    snapshot: createHealthSnapshot({
      score,
      scoreBreakdown,
      streakCount,
      badges
    })
  };
}
