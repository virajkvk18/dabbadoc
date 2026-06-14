import type {
  FoodItem,
  FutureHealthRisk,
  ItemHealthInsight,
  ReceiptCoverageSummary,
  RiskFlag,
  RiskSeverity,
  SwapRecommendation
} from "@/types";

const riskCopy: Record<
  string,
  {
    riskArea: string;
    severity: RiskSeverity;
    habitFrequency: string;
    possibleConcern: string;
    preventionTip: string;
    timeframe: string;
  }
> = {
  sugar: {
    riskArea: "Weight, blood sugar, and dental health",
    severity: "high",
    habitFrequency: "If sugary drinks or sweet packaged foods repeat most days",
    possibleConcern:
      "Frequent added sugar may increase the risk of weight gain, obesity, blood-sugar problems, cravings, and tooth decay over time.",
    preventionTip: "Replace the sweet drink/snack slot with chaas, water, unsweetened nimbu pani, fruit-curd, or nuts.",
    timeframe: "Watch especially if this becomes a daily or 4-5 days/week habit for months."
  },
  sodium: {
    riskArea: "Blood pressure and heart-health pattern",
    severity: "high",
    habitFrequency: "If salty packaged, instant, or restaurant foods repeat several times a week",
    possibleConcern:
      "A high-sodium pattern may increase blood-pressure and heart-health risk over time, especially for BP-sensitive people.",
    preventionTip: "Reduce masala packets/sauces, avoid sugary drinks with salty meals, and add curd, salad, or home food sides.",
    timeframe: "Risk becomes more important when this pattern is frequent for weeks to months."
  },
  fried: {
    riskArea: "Weight and heart-health habits",
    severity: "medium",
    habitFrequency: "If fried snacks or fried sides become a regular evening or order habit",
    possibleConcern:
      "Fried foods are calorie-dense, so frequent use can make weight gain and poor lipid-profile habits easier over time.",
    preventionTip: "Choose roasted chana, makhana, sprouts chaat, steamed options, or air-fried versions on most days.",
    timeframe: "Use this warning if the same pattern repeats 3-4 times/week or more."
  },
  refined: {
    riskArea: "Fullness, digestion, and sugar-control pattern",
    severity: "medium",
    habitFrequency: "If maida/refined-carb meals replace dal, vegetables, whole grains, and protein",
    possibleConcern:
      "Low-fiber refined carbs may reduce fullness and make overeating/cravings more likely, which can affect weight and sugar-control habits.",
    preventionTip: "Add dal, curd, paneer, egg, sprouts, salad, or choose atta/millet/oats/besan versions.",
    timeframe: "This matters when refined foods become the default daily base."
  },
  protein: {
    riskArea: "Satiety and muscle-support pattern",
    severity: "medium",
    habitFrequency: "If meals are mostly quick carbs without enough protein",
    possibleConcern:
      "Low protein can reduce fullness and make the day more snack-heavy, especially for families trying to improve energy and weight habits.",
    preventionTip: "Add one protein anchor: dal, chana, paneer, tofu, egg, curd, chicken, fish, or sprouts.",
    timeframe: "Check this across the whole day, not only one receipt."
  },
  processed: {
    riskArea: "Overall diet quality",
    severity: "medium",
    habitFrequency: "If packaged/instant foods take the place of home-style meals too often",
    possibleConcern:
      "Ultra-processed patterns often add salt, sugar, refined carbs, and fats while reducing fiber, protein, and micronutrient quality.",
    preventionTip: "Keep packaged foods occasional and pair them with protein, vegetables, fruit, curd, or a home-cooked side.",
    timeframe: "This is a long-term habit signal, strongest when repeated weekly for months."
  },
  fat: {
    riskArea: "Calorie balance and heart-health sensitive fats",
    severity: "medium",
    habitFrequency: "If high-fat packaged or fried foods are repeated frequently",
    possibleConcern:
      "Hidden fat load may raise calories quickly and can be a concern for cholesterol-sensitive eating patterns.",
    preventionTip: "Prefer grilled, steamed, roasted, or home-cooked versions and keep portions smaller.",
    timeframe: "Useful to monitor if these foods appear in many receipts."
  },
  additive: {
    riskArea: "Highly processed food signal",
    severity: "low",
    habitFrequency: "If additive-heavy packaged foods become common",
    possibleConcern:
      "Additives are not always harmful by themselves, but they can signal a highly processed food pattern.",
    preventionTip: "Choose shorter ingredient lists, fresh chutneys, homemade masala, fruits, nuts, or minimally processed snacks.",
    timeframe: "Treat this as a pattern warning, not a single-food diagnosis."
  }
};

const tagGroups: Record<string, string[]> = {
  sugar: ["high_sugar", "sugary_drink", "added_sugar", "dessert"],
  sodium: ["high_sodium", "processed_sauce"],
  fried: ["fried"],
  refined: ["refined_flour", "maida", "low_fiber_if_no_salad"],
  protein: ["low_protein"],
  processed: ["processed", "ultra_processed"],
  fat: ["high_fat", "palm_oil", "trans_fat", "high_calorie"],
  additive: ["artificial_colors"]
};

function norm(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function matchingGroups(item: FoodItem) {
  const flags = new Set((item.flags ?? []).map(norm));
  return Object.entries(tagGroups)
    .filter(([, tags]) => tags.some((tag) => flags.has(norm(tag))))
    .map(([group]) => group);
}

function swapForItem(item: FoodItem, swaps: SwapRecommendation[]) {
  const itemName = norm(item.name);
  return swaps.find((swap) => norm(swap.original) === itemName || itemName.includes(norm(swap.original)));
}

function riskLabelsForItem(item: FoodItem, riskFlags: RiskFlag[]) {
  const groups = matchingGroups(item);
  const labels = riskFlags
    .filter((risk) => {
      const text = norm(`${risk.label} ${risk.reason} ${risk.possibleConcern}`);
      return groups.some((group) => text.includes(group) || riskCopy[group]?.riskArea.toLowerCase().includes(group));
    })
    .map((risk) => risk.label);

  return labels.length > 0 ? labels : groups.map((group) => riskCopy[group]?.riskArea).filter(Boolean);
}

export function buildItemHealthInsights(
  items: FoodItem[],
  riskFlags: RiskFlag[],
  swaps: SwapRecommendation[]
): ItemHealthInsight[] {
  return items.map((item) => {
    const groups = matchingGroups(item);
    const swap = swapForItem(item, swaps);
    const linkedRisks = riskLabelsForItem(item, riskFlags);
    const hasGoodSignal = (item.flags ?? []).some((flag) =>
      ["protein", "fiber", "whole_food", "vegetable"].includes(norm(flag))
    );

    if (groups.length === 0 && hasGoodSignal) {
      return {
        item: item.name,
        verdict: "good_choice",
        reason: "This looks like a better base item because it supports protein, fiber, or whole-food balance.",
        linkedRisks: [],
        swap: undefined
      };
    }

    if (groups.length === 0) {
      return {
        item: item.name,
        verdict: "unknown",
        reason:
          "DabbaDoc detected this line, but there was not enough nutrition detail to judge it strongly. Check portion and label if it is packaged.",
        linkedRisks: [],
        swap: undefined
      };
    }

    return {
      item: item.name,
      verdict: groups.includes("sugar") || groups.includes("sodium") ? "risky_if_frequent" : "watch_portion",
      reason:
        "This item is okay occasionally, but the detected pattern needs attention if it repeats often.",
      linkedRisks,
      swap: swap?.swap
    };
  });
}

export function buildFutureHealthRisks(
  items: FoodItem[],
  riskFlags: RiskFlag[]
): FutureHealthRisk[] {
  const groups = new Map<string, Set<string>>();

  for (const item of items) {
    for (const group of matchingGroups(item)) {
      groups.set(group, (groups.get(group) ?? new Set<string>()).add(item.name));
    }
  }

  for (const risk of riskFlags) {
    const text = norm(`${risk.label} ${risk.reason} ${risk.possibleConcern}`);
    for (const group of Object.keys(riskCopy)) {
      if (text.includes(group)) groups.set(group, groups.get(group) ?? new Set());
    }
  }

  return Array.from(groups.entries())
    .map(([group, linked]) => {
      const copy = riskCopy[group];
      return {
        riskArea: copy.riskArea,
        severity: copy.severity,
        habitFrequency: copy.habitFrequency,
        possibleConcern: copy.possibleConcern,
        linkedItems: Array.from(linked).slice(0, 8),
        preventionTip: copy.preventionTip,
        timeframe: copy.timeframe
      };
    })
    .sort((a, b) => {
      const order = { high: 0, medium: 1, low: 2 };
      return order[a.severity] - order[b.severity];
    })
    .slice(0, 8);
}

export function buildReceiptCoverageSummary(
  items: FoodItem[],
  swaps: SwapRecommendation[]
): ReceiptCoverageSummary {
  const riskyItems = items.filter((item) => matchingGroups(item).length > 0);
  const swappedCount = riskyItems.filter((item) => swapForItem(item, swaps)).length;

  return {
    detectedCount: items.length,
    riskyCount: riskyItems.length,
    swappedCount,
    confidenceNote:
      "DabbaDoc includes every readable food line it can detect. If a receipt is blurry, cropped, folded, or has tiny text, rescan closer under better light for higher coverage."
  };
}
