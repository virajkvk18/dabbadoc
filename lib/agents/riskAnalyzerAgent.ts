import riskRules from "@/data/risk-rules.json";
import type { FoodItem, RiskFlag } from "@/types";

type Rule = {
  tag: string;
  label: string;
  severity: "low" | "medium" | "high";
  reason: string;
  possibleConcern: string;
};

const rules = riskRules as Rule[];

export async function analyzeRisks(items: FoodItem[], extraText = "") {
  const tags = new Set(items.flatMap((item) => item.flags ?? []));
  const lowerText = extraText.toLowerCase();

  if (lowerText.includes("trans fat") || lowerText.includes("hydrogenated")) {
    tags.add("trans_fat");
  }
  if (lowerText.includes("artificial") || lowerText.includes("colour")) {
    tags.add("artificial_colors");
  }
  if (lowerText.includes("maida") || lowerText.includes("refined flour")) {
    tags.add("maida");
  }
  if (lowerText.includes("palm oil") || lowerText.includes("refined oil")) {
    tags.add("palm_oil");
  }

  return rules
    .filter((rule) => tags.has(rule.tag))
    .map<RiskFlag>((rule) => ({
      label: rule.label,
      severity: rule.severity,
      reason: rule.reason,
      possibleConcern: rule.possibleConcern
    }));
}
