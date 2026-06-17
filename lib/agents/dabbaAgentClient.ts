import "server-only";

import type {
  CostComparison,
  DiaryInput,
  FoodDiaryAnalysis,
  FoodItem,
  FutureHealthRisk,
  IngredientInsight,
  LabelAnalysis,
  ManualMealEntry,
  ReceiptAnalysis,
  RiskFlag,
  RiskSeverity,
  SourceType,
  SwapRecommendation
} from "@/types";
import { DABBADOC_DISCLAIMER } from "@/types";
import {
  buildFutureHealthRisks,
  buildItemHealthInsights,
  buildReceiptCoverageSummary
} from "./receiptNarrative";
import {
  buildIngredientInsights,
  buildLabelCoverageSummary,
  buildLabelSwaps,
  buildLabelWarnings,
  buildRegularLabelUseRisks,
  extractIngredientsFromLabel,
  extractNutritionFacts
} from "./labelNarrative";
import {
  awardBadges,
  buildBlameMap,
  calculateBreakdown,
  getScoreCategory
} from "@/lib/scoring/healthIndex";
import { clamp } from "@/lib/utils";

type AgentDetectedItem = {
  name?: string;
  quantity?: string | null;
  category?: string | null;
  confidence?: number | null;
  risk_tags?: string[];
};

type AgentRiskFlag = {
  flag?: string;
  severity?: string;
  why_it_matters?: string;
  evidence?: string[];
};

type AgentFutureRisk = {
  risk_area?: string;
  simple_reason?: string;
  confidence?: string;
  prevention_tip?: string;
  habit_frequency?: string;
  linked_items?: string[];
  timeframe?: string;
};

type AgentSwap = {
  replace?: string;
  with_item?: string;
  why_better?: string;
};

type AgentCost = {
  current_choice?: string;
  better_choice?: string;
  estimated_cost_relation?: string;
  note?: string;
};

type AgentAction = {
  day?: number;
  action?: string;
};

type AgentIngredientInsight = {
  ingredient?: string;
  purpose_in_food?: string;
  simple_hinglish_explanation?: string;
  concern_level?: string;
  natural_or_better_alternative?: string | null;
};

type AgentResponse = {
  analysis_type?: "manual" | "receipt" | "label";
  dabba_health_index?: {
    score?: number;
    grade?: string;
    summary?: string;
  };
  detected_items?: AgentDetectedItem[];
  ingredient_insights?: AgentIngredientInsight[];
  risk_flags?: AgentRiskFlag[];
  future_health_risks?: AgentFutureRisk[];
  hinglish_explanation?: string;
  healthier_swaps?: AgentSwap[];
  cost_comparison?: AgentCost[];
  seven_day_action_plan?: AgentAction[];
  family_tip?: string;
  disclaimer?: string;
};

const DEFAULT_TIMEOUT_MS = 45_000;

function getAgentUrl() {
  return process.env.DABBA_AGENT_URL?.replace(/\/$/, "");
}

function getAgentToken() {
  return process.env.DABBA_AGENT_TOKEN;
}

function isAllowedAgentUrl(url: string) {
  try {
    const parsed = new URL(url);
    if (process.env.NODE_ENV === "production" && parsed.protocol !== "https:") {
      console.warn("Dabba Agent URL must use HTTPS in production.");
      return false;
    }

    return (
      parsed.protocol === "https:" ||
      parsed.hostname === "localhost" ||
      parsed.hostname === "127.0.0.1"
    );
  } catch {
    console.warn("Dabba Agent URL is invalid.");
    return false;
  }
}

export function isDabbaAgentConfigured() {
  const url = getAgentUrl();
  return Boolean(url && getAgentToken() && isAllowedAgentUrl(url));
}

function timeoutMs() {
  const value = Number(process.env.DABBA_AGENT_TIMEOUT_MS);
  return Number.isFinite(value) && value > 0 ? value : DEFAULT_TIMEOUT_MS;
}

async function callDabbaAgent(path: string, payload: unknown) {
  const url = getAgentUrl();
  const token = getAgentToken();
  if (!url || !token || !isAllowedAgentUrl(url)) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs());

  try {
    const response = await fetch(`${url}${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
      cache: "no-store"
    });

    if (!response.ok) {
      console.warn("Dabba Agent request failed", {
        path,
        status: response.status
      });
      return null;
    }

    return (await response.json()) as AgentResponse;
  } catch (error) {
    console.warn("Dabba Agent unavailable, using local analysis fallback", {
      path,
      reason: error instanceof Error ? error.name : "unknown"
    });
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function agentSourceType(sourceType?: SourceType) {
  if (sourceType === "food_delivery") return "food_delivery";
  if (sourceType === "quick_commerce") return "grocery";
  if (sourceType === "packaged_label") return "ecommerce";
  if (sourceType === "food_diary") return "home";
  return "grocery";
}

function normalizeSeverity(value?: string): RiskSeverity {
  if (value === "high" || value === "medium" || value === "low") return value;
  return "medium";
}

function normalizeConcernLevel(value?: string): IngredientInsight["concernLevel"] {
  if (value === "high" || value === "medium" || value === "low" || value === "unknown") {
    return value;
  }
  return "unknown";
}

function mapFoodItems(items?: AgentDetectedItem[]): FoodItem[] {
  return (items ?? [])
    .filter((item) => item.name?.trim())
    .map((item) => ({
      name: item.name?.trim() ?? "Food item",
      category: item.category?.trim() || "food_item",
      quantity: item.quantity ?? undefined,
      confidence: item.confidence ?? undefined,
      flags: item.risk_tags ?? []
    }));
}

function mapRiskFlags(
  flags?: AgentRiskFlag[],
  futureRisks?: AgentFutureRisk[]
): RiskFlag[] {
  return (flags ?? [])
    .filter((flag) => flag.flag?.trim())
    .map((flag, index) => {
      const future = futureRisks?.[index];
      const evidence = flag.evidence?.filter(Boolean).join(", ");
      return {
        label: flag.flag?.trim() ?? "Food pattern watch",
        severity: normalizeSeverity(flag.severity),
        reason: flag.why_it_matters?.trim() || "This food pattern needs attention.",
        possibleConcern:
          future?.simple_reason?.trim() ||
          future?.prevention_tip?.trim() ||
          (evidence ? `Seen in: ${evidence}` : "Possible concern if this becomes a frequent habit.")
      };
    });
}

function mapFutureHealthRisks(
  risks: AgentFutureRisk[] | undefined,
  flags: AgentRiskFlag[] | undefined,
  items: FoodItem[],
  mappedRiskFlags: RiskFlag[]
): FutureHealthRisk[] {
  const mapped = (risks ?? [])
    .filter((risk) => risk.risk_area?.trim() || risk.simple_reason?.trim())
    .map((risk, index) => ({
      riskArea: risk.risk_area?.trim() || "Food pattern risk",
      severity: normalizeSeverity(risk.confidence || flags?.[index]?.severity),
      habitFrequency:
        risk.habit_frequency?.trim() ||
        "If this pattern becomes frequent instead of occasional",
      possibleConcern:
        risk.simple_reason?.trim() ||
        "This pattern may increase long-term lifestyle health risk if repeated often.",
      linkedItems: risk.linked_items?.filter(Boolean) ?? flags?.[index]?.evidence?.filter(Boolean) ?? [],
      preventionTip:
        risk.prevention_tip?.trim() ||
        "Use the suggested swaps and add protein/fiber to balance the meal.",
      timeframe:
        risk.timeframe?.trim() ||
        "Think in repeated weeks/months, not one single meal."
    }));

  return mapped.length > 0 ? mapped : buildFutureHealthRisks(items, mappedRiskFlags);
}

function relationCostDelta(relation?: string) {
  if (relation === "cheaper") return -120;
  if (relation === "slightly_higher") return 120;
  if (relation === "higher") return 250;
  return 0;
}

function mapSwaps(swaps?: AgentSwap[], costs?: AgentCost[]): SwapRecommendation[] {
  return (swaps ?? [])
    .filter((swap) => swap.replace?.trim() && swap.with_item?.trim())
    .map((swap, index) => ({
      original: swap.replace?.trim() ?? "Current item",
      swap: swap.with_item?.trim() ?? "Balanced option",
      reason: swap.why_better?.trim() || "Better fit for everyday family food habits.",
      costDelta: relationCostDelta(costs?.[index]?.estimated_cost_relation),
      scoreImpact: 8
    }));
}

function mapCostSummary(costs?: AgentCost[]): CostComparison {
  const rows = costs ?? [];
  const currentMonthlyEstimate = Math.max(500, rows.length * 550);
  const healthierMonthlyEstimate =
    currentMonthlyEstimate +
    rows.reduce((total, row) => total + relationCostDelta(row.estimated_cost_relation), 0);

  return {
    currentMonthlyEstimate,
    healthierMonthlyEstimate,
    monthlySavings: currentMonthlyEstimate - healthierMonthlyEstimate,
    notes:
      rows[0]?.note ??
      "Approx estimate. Actual cost depends on city, brand, restaurant, and portion size."
  };
}

function mapActionPlan(actions?: AgentAction[]) {
  const mapped = (actions ?? [])
    .filter((action) => action.action?.trim())
    .map((action) => `Day ${action.day ?? ""}: ${action.action}`.replace("Day : ", ""));

  return mapped.length > 0
    ? mapped
    : [
        "Day 1: Replace one sugary drink with chaas or water.",
        "Day 2: Add dal, curd, paneer, egg, chana, or sprouts.",
        "Day 3: Keep fried snacks occasional and choose roasted options."
      ];
}

function summaryFromAgent(agent: AgentResponse) {
  return [
    agent.hinglish_explanation,
    agent.family_tip ? `Tip: ${agent.family_tip}` : null
  ]
    .filter(Boolean)
    .join("\n\n");
}

export async function analyzeReceiptWithDabbaAgent(params: {
  rawText: string;
  sourceType?: SourceType;
  dataUri?: string;
  mimeType?: string;
}): Promise<ReceiptAnalysis | null> {
  const payload = {
    language: "hinglish",
    source_type: agentSourceType(params.sourceType),
    raw_text: params.rawText,
    image_base64: params.dataUri ?? null,
    mime_type: params.mimeType ?? "image/jpeg"
  };
  const textOnlyPayload = {
    ...payload,
    image_base64: null
  };

  const agent =
    (await callDabbaAgent("/api/v1/analyze/receipt", payload)) ??
    (params.dataUri ? await callDabbaAgent("/api/v1/analyze/receipt", textOnlyPayload) : null);

  if (!agent) return null;

  const detectedItems = mapFoodItems(agent.detected_items);
  const riskFlags = mapRiskFlags(agent.risk_flags, agent.future_health_risks);
  const swaps = mapSwaps(agent.healthier_swaps, agent.cost_comparison);
  const futureHealthRisks = mapFutureHealthRisks(
    agent.future_health_risks,
    agent.risk_flags,
    detectedItems,
    riskFlags
  );
  const itemInsights = buildItemHealthInsights(detectedItems, riskFlags, swaps);
  const coverageSummary = buildReceiptCoverageSummary(detectedItems, swaps);
  const healthScore = clamp(agent.dabba_health_index?.score ?? 50);
  const scoreBreakdown = calculateBreakdown({ items: detectedItems, riskFlags, swaps });

  return {
    extractedText: params.rawText,
    detectedItems,
    riskFlags,
    futureHealthRisks,
    itemInsights,
    coverageSummary,
    healthScore,
    scoreCategory: agent.dabba_health_index?.grade ?? getScoreCategory(healthScore),
    scoreBreakdown,
    blameMap: buildBlameMap(detectedItems, swaps),
    swaps,
    costSummary: mapCostSummary(agent.cost_comparison),
    actionPlan: mapActionPlan(agent.seven_day_action_plan),
    aiSummary:
      summaryFromAgent(agent) ||
      agent.dabba_health_index?.summary ||
      "DabbaDoc analyzed this food pattern and prepared safer everyday swaps.",
    disclaimer: DABBADOC_DISCLAIMER
  };
}

function extractNumber(text: string, label: string) {
  const regex = new RegExp(`${label}[^0-9]*(\\d+(?:\\.\\d+)?)`, "i");
  return Number(text.match(regex)?.[1] ?? 0) || undefined;
}

function parseIngredients(rawText: string, insights?: AgentIngredientInsight[]) {
  const fromInsights = (insights ?? [])
    .map((insight) => insight.ingredient?.trim())
    .filter(Boolean) as string[];

  return extractIngredientsFromLabel(rawText, fromInsights);
}

function mapIngredientInsights(insights?: AgentIngredientInsight[]): IngredientInsight[] {
  return (insights ?? [])
    .filter((insight) => insight.ingredient?.trim())
    .map((insight) => ({
      ingredient: insight.ingredient?.trim() ?? "Ingredient",
      purposeInFood:
        insight.purpose_in_food?.trim() ||
        "Taste, texture, shelf life, or product consistency ke liye.",
      simpleHinglishExplanation:
        insight.simple_hinglish_explanation?.trim() ||
        "Is ingredient ka meaning label context par depend karta hai. Frequency aur total diet pattern important hai.",
      concernLevel: normalizeConcernLevel(insight.concern_level),
      naturalOrBetterAlternative: insight.natural_or_better_alternative ?? undefined
    }));
}

function mergeFutureRisks(primary: FutureHealthRisk[], secondary: FutureHealthRisk[]) {
  const seen = new Set<string>();
  return [...primary, ...secondary].filter((risk) => {
    const key = risk.riskArea.trim().toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 6);
}

function safetyLevel(score: number): LabelAnalysis["safetyLevel"] {
  if (score >= 78) return "daily-safe";
  if (score >= 55) return "sometimes-safe";
  return "avoid-frequent-use";
}

export async function analyzeLabelWithDabbaAgent(params: {
  rawText: string;
  productName?: string;
}): Promise<LabelAnalysis | null> {
  const agent = await callDabbaAgent("/api/v1/analyze/label", {
    language: "hinglish",
    product_name: params.productName,
    raw_text: params.rawText,
    image_base64: null,
    mime_type: "image/jpeg"
  });

  if (!agent) return null;

  const warnings = mapRiskFlags(agent.risk_flags, agent.future_health_risks);
  const labelTruthScore = clamp(agent.dabba_health_index?.score ?? 50);
  const ingredients = parseIngredients(params.rawText, agent.ingredient_insights);
  const nutritionDetails = extractNutritionFacts(params.rawText);
  const nutritionByKey = nutritionDetails.byKey as Partial<Record<
    | "calories"
    | "protein"
    | "sugar"
    | "addedSugar"
    | "sodium"
    | "fats"
    | "saturatedFat"
    | "transFat"
    | "carbohydrates"
    | "fiber",
    number
  >>;
  const ingredientInsights = buildIngredientInsights(
    ingredients,
    mapIngredientInsights(agent.ingredient_insights)
  );
  const mergedWarnings = buildLabelWarnings({
    baseWarnings: warnings,
    ingredientInsights,
    nutritionFacts: nutritionDetails.facts
  });
  const localRegularUseRisks = buildRegularLabelUseRisks({
    nutritionFacts: nutritionDetails.facts,
    ingredientInsights,
    ingredients
  });
  const regularUseRisks = mergeFutureRisks(
    mapFutureHealthRisks(
      agent.future_health_risks,
      agent.risk_flags,
      mapFoodItems(agent.detected_items),
      warnings
    ),
    localRegularUseRisks
  );
  const betterAlternatives = buildLabelSwaps(
    mapSwaps(agent.healthier_swaps, agent.cost_comparison),
    ingredients
  );
  const labelCoverage = buildLabelCoverageSummary({
    ingredients,
    ingredientInsights,
    nutritionFacts: nutritionDetails.facts
  });

  return {
    extractedText: params.rawText,
    productName:
      params.productName ||
      params.rawText.split("\n").find(Boolean)?.trim() ||
      "Packaged food",
    ingredients,
    nutrition: {
      calories: nutritionByKey.calories ?? extractNumber(params.rawText, "energy|calories|kcal"),
      protein: nutritionByKey.protein ?? extractNumber(params.rawText, "protein"),
      sugar: nutritionByKey.sugar ?? extractNumber(params.rawText, "sugar"),
      addedSugar: nutritionByKey.addedSugar ?? extractNumber(params.rawText, "added sugar"),
      sodium: nutritionByKey.sodium ?? extractNumber(params.rawText, "sodium"),
      fats: nutritionByKey.fats ?? extractNumber(params.rawText, "fat"),
      saturatedFat: nutritionByKey.saturatedFat ?? extractNumber(params.rawText, "saturated fat"),
      transFat: nutritionByKey.transFat ?? extractNumber(params.rawText, "trans fat"),
      carbohydrates: nutritionByKey.carbohydrates,
      fiber: nutritionByKey.fiber,
      servingSize: nutritionDetails.servingSize,
      facts: nutritionDetails.facts
    },
    ingredientInsights,
    regularUseRisks,
    labelCoverage,
    labelTruthScore,
    safetyLevel: safetyLevel(labelTruthScore),
    whatYouThought: "The front of pack may look convenient or healthy.",
    whatLabelSays:
      mergedWarnings.length > 0
        ? `Readable label shows ${ingredients.length} ingredients and ${nutritionDetails.facts.length} nutrition facts. Some signals should stay occasional, especially if eaten regularly.`
        : "No strong hidden sugar, sodium, oil, or additive signal was detected from the readable label text.",
    warnings: mergedWarnings,
    betterAlternatives,
    aiSummary:
      summaryFromAgent(agent) ||
      "DabbaDoc checked the label and prepared safer alternatives.",
    disclaimer: DABBADOC_DISCLAIMER
  };
}

function diaryRawText(input: DiaryInput) {
  if (input.diaryText?.trim()) return input.diaryText.trim();

  return (input.entries ?? [])
    .map((entry) => {
      const source = entry.source === "home" ? "home food" : "outside food";
      return `${entry.mealTime}: ${source}, ${entry.itemName}, quantity ${entry.quantity}, ${entry.spiceLevel} spice${entry.notes ? `, ${entry.notes}` : ""}`;
    })
    .join(". ");
}

function mapManualMeals(entries?: ManualMealEntry[]) {
  return (entries ?? []).map((entry) => ({
    meal_name: entry.mealTime,
    items: [entry.itemName],
    quantity_note: entry.quantity,
    spice_level: entry.spiceLevel,
    meal_source: entry.source === "home" ? "home" : "restaurant",
    notes: entry.notes
  }));
}

export async function analyzeFoodDiaryWithDabbaAgent(
  input: DiaryInput
): Promise<FoodDiaryAnalysis | null> {
  const rawText = diaryRawText(input);
  if (!rawText) return null;

  const agent = await callDabbaAgent("/api/v1/analyze/manual", {
    language: "hinglish",
    raw_text: rawText,
    meals: mapManualMeals(input.entries),
    user_profile: {
      age_group: "family",
      diet_type: "mixed",
      goals: ["better daily choices", "reduce junk"]
    }
  });

  if (!agent) return null;

  const items = mapFoodItems(agent.detected_items);
  const risks = mapRiskFlags(agent.risk_flags, agent.future_health_risks);
  const swaps = mapSwaps(agent.healthier_swaps, agent.cost_comparison);
  const dailyScore = clamp(agent.dabba_health_index?.score ?? 50);
  const riskyFoods = items.filter((item) => (item.flags ?? []).length > 0);
  const goodFoods = items.filter((item) =>
    (item.flags ?? []).some((flag) => ["protein", "fiber", "whole_food", "vegetable"].includes(flag))
  );
  const caloriesEstimate = Math.max(
    0,
    items.reduce((total, item) => total + (item.calorieEstimate ?? 180), 0)
  );
  const proteinEstimate = Math.max(
    0,
    items.reduce((total, item) => total + (item.proteinEstimate ?? 4), 0)
  );

  return {
    diaryText: rawText,
    entries: input.entries,
    goodFoods,
    riskyFoods,
    caloriesEstimate,
    proteinEstimate,
    missingNutrients: [
      proteinEstimate < 45 ? "protein" : null,
      goodFoods.length === 0 ? "fiber/whole foods" : null
    ].filter(Boolean) as string[],
    improvementTips: [
      ...mapActionPlan(agent.seven_day_action_plan).slice(0, 5),
      agent.family_tip
    ].filter(Boolean) as string[],
    healthierSwaps: swaps,
    dailyScore,
    streakCount: 4,
    badgesEarned: awardBadges({
      score: dailyScore,
      streakCount: 4,
      riskFlags: risks,
      swaps
    }),
    aiSummary:
      summaryFromAgent(agent) ||
      "DabbaDoc analyzed your day and prepared practical family-friendly improvements.",
    disclaimer: DABBADOC_DISCLAIMER
  };
}
