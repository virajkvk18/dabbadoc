import "server-only";

import type { User } from "@supabase/supabase-js";
import type {
  BlameItem,
  FoodItem,
  FutureHealthRisk,
  IngredientInsight,
  ItemHealthInsight,
  ManualMealEntry,
  NutritionFact,
  RiskFlag,
  SwapRecommendation
} from "@/types";
import { ApiError } from "@/lib/security/api-errors";
import { getScoreCategory } from "@/lib/scoring/healthIndex";
import { createSupabaseServer } from "./server";

type ProfileRow = {
  email: string | null;
  full_name: string | null;
  is_premium: boolean | null;
  plan: string | null;
  trial_start: string | null;
  trial_end: string | null;
  created_at: string | null;
};

type ReceiptRow = {
  id: string;
  extracted_text: string | null;
  detected_items: unknown;
  risk_flags: unknown;
  health_score: number | null;
  cost_summary: unknown;
  swaps: unknown;
  ai_summary: string | null;
  created_at: string;
};

type LabelRow = {
  id: string;
  product_name: string | null;
  ingredients: unknown;
  nutrition: unknown;
  label_truth_score: number | null;
  warnings: unknown;
  better_alternatives: unknown;
  ai_summary: string | null;
  created_at: string;
};

type DiaryRow = {
  id: string;
  diary_text: string;
  calories_estimate: number | null;
  protein_estimate: number | null;
  good_items: unknown;
  risky_items: unknown;
  suggestions: unknown;
  daily_score: number | null;
  created_at: string;
};

type HealthRow = {
  id: string;
  score: number;
  streak_count: number | null;
  badges: unknown;
  created_at: string;
};

type ReportRow = {
  id: string;
  report_url: string | null;
  report_data: unknown;
  created_at: string;
};

type PaymentRow = {
  id: string;
  status: string;
  amount: number | null;
  plan: string | null;
  created_at: string;
};

export type ActivityType = "receipt" | "label" | "diary" | "report" | "payment";

export type AccountActivitySection = {
  title: string;
  items: string[];
  tone?: "default" | "good" | "warning" | "danger" | "info";
};

export type AccountActivity = {
  id: string;
  type: ActivityType;
  title: string;
  detail: string;
  description: string;
  createdAt: string;
  score?: number;
  metrics: string[];
  tags: string[];
  resultSections: AccountActivitySection[];
};

export type AccountOverview = {
  user: User;
  profile: {
    fullName: string;
    email: string;
    initials: string;
    plan: string;
    isPremium: boolean;
    createdAt?: string;
    trialEnd?: string;
  };
  counts: {
    receipts: number;
    labels: number;
    diaries: number;
    reports: number;
    payments: number;
    scans: number;
    activities: number;
  };
  score: {
    current: number;
    category: string;
    trendLabel: string;
    chart: Array<{ date: string; score: number }>;
  };
  streak: {
    days: number;
    label: string;
  };
  badges: string[];
  recentActivities: AccountActivity[];
  allActivities: AccountActivity[];
  riskSummary: Array<{
    label: string;
    severity: string;
    detail: string;
  }>;
};

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function compact<T>(values: Array<T | null | undefined | false>) {
  return values.filter(Boolean) as T[];
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    month: "short",
    day: "2-digit"
  }).format(new Date(value));
}

export function formatDisplayDate(value?: string | null) {
  if (!value) return "Not available";

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function fallbackNameFromEmail(email: string) {
  return email.split("@")[0]?.replace(/[._-]+/g, " ").trim() || "DabbaDoc User";
}

function initialsForName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const initials = parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
  return initials || "DD";
}

function getUserDisplayName(user: User, profile?: ProfileRow | null) {
  const email = profile?.email || user.email || "";
  return (
    profile?.full_name?.trim() ||
    (typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name.trim()
      : "") ||
    fallbackNameFromEmail(email)
  );
}

export function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function buildTrendLabel(scores: Array<{ createdAt: string; score: number }>) {
  if (scores.length < 2) return "Start";

  const first = scores[0].score;
  const last = scores[scores.length - 1].score;
  const delta = last - first;
  if (delta === 0) return "Stable";
  return `${delta > 0 ? "+" : ""}${delta} pts`;
}

function calculateActivityStreak(dates: string[]) {
  const uniqueDays = Array.from(
    new Set(dates.map((date) => new Date(date).toISOString().slice(0, 10)))
  ).sort();
  if (uniqueDays.length === 0) return 0;

  let streak = 1;
  let cursor = new Date(uniqueDays[uniqueDays.length - 1]);

  for (let index = uniqueDays.length - 2; index >= 0; index -= 1) {
    const previous = new Date(uniqueDays[index]);
    const expected = new Date(cursor);
    expected.setDate(expected.getDate() - 1);

    if (previous.toISOString().slice(0, 10) !== expected.toISOString().slice(0, 10)) {
      break;
    }

    streak += 1;
    cursor = previous;
  }

  return streak;
}

function itemNames(items: FoodItem[], limit = 5) {
  return items
    .slice(0, limit)
    .map((item) => item.name)
    .filter(Boolean);
}

function textPreview(value: string, fallback: string, maxLength = 180) {
  const clean = value.replace(/\s+/g, " ").trim();
  if (!clean) return fallback;
  return clean.length > maxLength ? `${clean.slice(0, maxLength - 1)}...` : clean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asStringArray(value: unknown): string[] {
  return asArray<unknown>(value)
    .map((item) => {
      if (typeof item === "string") return item.trim();
      if (typeof item === "number") return String(item);
      return "";
    })
    .filter(Boolean);
}

function joinParts(parts: Array<string | number | null | undefined | false>) {
  return parts
    .map((part) => (typeof part === "number" ? String(part) : part))
    .filter(Boolean)
    .join(" | ");
}

function formatFlag(value: string) {
  return value.replace(/_/g, " ");
}

function maybeNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function maybeString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function moneyLine(label: string, value: unknown) {
  const amount = maybeNumber(value);
  return typeof amount === "number" ? `${label}: INR ${Math.round(amount)}` : null;
}

function makeSection(
  title: string,
  items: Array<string | null | undefined | false>,
  tone: AccountActivitySection["tone"] = "default"
): AccountActivitySection | null {
  const cleanItems = items
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);

  return cleanItems.length > 0 ? { title, items: cleanItems, tone } : null;
}

function foodItemLine(item: FoodItem) {
  const flags = item.flags?.length ? `Flags: ${item.flags.map(formatFlag).join(", ")}` : null;
  return joinParts([
    item.name,
    item.quantity,
    item.category,
    typeof item.calorieEstimate === "number" ? `${item.calorieEstimate} kcal approx` : null,
    typeof item.proteinEstimate === "number" ? `${item.proteinEstimate}g protein approx` : null,
    flags
  ]);
}

function riskLine(risk: RiskFlag) {
  return joinParts([
    `${risk.severity.toUpperCase()}: ${risk.label}`,
    risk.reason,
    risk.possibleConcern
  ]);
}

function swapLine(swap: SwapRecommendation) {
  return joinParts([
    `${swap.original} -> ${swap.swap}`,
    swap.reason,
    typeof swap.scoreImpact === "number" ? `Score impact +${swap.scoreImpact}` : null,
    typeof swap.costDelta === "number" ? `Cost delta INR ${Math.round(swap.costDelta)}` : null
  ]);
}

function futureRiskLine(risk: FutureHealthRisk) {
  return joinParts([
    `${risk.severity.toUpperCase()}: ${risk.riskArea}`,
    risk.habitFrequency,
    risk.timeframe,
    risk.linkedItems?.length ? `Linked to ${risk.linkedItems.join(", ")}` : null,
    risk.possibleConcern,
    risk.preventionTip ? `Prevention: ${risk.preventionTip}` : null
  ]);
}

function itemInsightLine(insight: ItemHealthInsight) {
  return joinParts([
    `${insight.item}: ${formatFlag(insight.verdict)}`,
    insight.reason,
    insight.linkedRisks?.length ? `Linked risks: ${insight.linkedRisks.join(", ")}` : null,
    insight.swap ? `Swap: ${insight.swap}` : null
  ]);
}

function blameLine(item: BlameItem) {
  return joinParts([
    `${item.item}: ${item.impact} impact`,
    item.reason,
    item.swap ? `Try ${item.swap}` : null
  ]);
}

function ingredientLine(insight: IngredientInsight) {
  return joinParts([
    `${insight.ingredient}: ${insight.simpleHinglishExplanation}`,
    insight.purposeInFood ? `Why it is used: ${insight.purposeInFood}` : null,
    insight.concernLevel ? `Concern: ${insight.concernLevel}` : null,
    insight.possibleRegularUseConcern ? `Regular use: ${insight.possibleRegularUseConcern}` : null,
    insight.naturalOrBetterAlternative ? `Better option: ${insight.naturalOrBetterAlternative}` : null
  ]);
}

function nutritionFactLine(fact: NutritionFact) {
  const amount =
    typeof fact.value === "number"
      ? `${fact.value}${fact.unit ? ` ${fact.unit}` : ""}${fact.per ? ` per ${fact.per}` : ""}`
      : fact.raw;

  return joinParts([
    fact.label,
    amount,
    fact.interpretation,
    fact.concernLevel ? `Concern: ${fact.concernLevel}` : null
  ]);
}

function primitiveNutritionLines(nutrition: Record<string, unknown>) {
  return [
    ["Calories", nutrition.calories, "kcal"],
    ["Protein", nutrition.protein, "g"],
    ["Sugar", nutrition.sugar, "g"],
    ["Added sugar", nutrition.addedSugar, "g"],
    ["Sodium", nutrition.sodium, "mg"],
    ["Fats", nutrition.fats, "g"],
    ["Saturated fat", nutrition.saturatedFat, "g"],
    ["Trans fat", nutrition.transFat, "g"],
    ["Carbs", nutrition.carbohydrates, "g"],
    ["Fiber", nutrition.fiber, "g"],
    ["Serving size", nutrition.servingSize, ""]
  ].flatMap(([label, value, unit]) => {
    if (typeof value === "number") return [`${label}: ${value}${unit ? ` ${unit}` : ""}`];
    if (typeof value === "string" && value.trim()) return [`${label}: ${value.trim()}`];
    return [];
  });
}

function receiptCostSections(value: unknown) {
  const cost = isRecord(value) ? value : {};
  const coverage = isRecord(cost.coverageSummary) ? cost.coverageSummary : null;
  const scoreBreakdown = isRecord(cost.scoreBreakdown) ? cost.scoreBreakdown : null;

  const coverageLine = coverage
    ? joinParts([
        typeof coverage.detectedCount === "number" ? `${coverage.detectedCount} detected` : null,
        typeof coverage.riskyCount === "number" ? `${coverage.riskyCount} risky` : null,
        typeof coverage.swappedCount === "number" ? `${coverage.swappedCount} swapped` : null,
        maybeString(coverage.confidenceNote)
      ])
    : null;

  const scoreBreakdownLines = scoreBreakdown
    ? Object.entries(scoreBreakdown)
        .filter(([, score]) => typeof score === "number")
        .map(([label, score]) => `${formatFlag(label)}: ${score}/100`)
    : [];

  return compact([
    makeSection(
      "Cost and receipt coverage",
      [
        moneyLine("Current monthly estimate", cost.currentMonthlyEstimate),
        moneyLine("Healthier monthly estimate", cost.healthierMonthlyEstimate),
        moneyLine("Estimated monthly savings", cost.monthlySavings),
        maybeString(cost.notes),
        coverageLine
      ],
      "info"
    ),
    makeSection("Item-level health insight", asArray<ItemHealthInsight>(cost.itemInsights).map(itemInsightLine), "info"),
    makeSection("Long-term health risks", asArray<FutureHealthRisk>(cost.futureHealthRisks).map(futureRiskLine), "danger"),
    makeSection("Why the score changed", asArray<BlameItem>(cost.blameMap).map(blameLine), "warning"),
    makeSection("Score breakdown", scoreBreakdownLines, "info"),
    makeSection("Action plan saved for this scan", asStringArray(cost.actionPlan), "good")
  ]);
}

function labelNutritionSections(value: unknown) {
  const nutrition = isRecord(value) ? value : {};
  const labelCoverage = isRecord(nutrition.labelCoverage) ? nutrition.labelCoverage : null;
  const coverageLine = labelCoverage
    ? joinParts([
        typeof labelCoverage.nutritionFactCount === "number"
          ? `${labelCoverage.nutritionFactCount} nutrition facts`
          : null,
        typeof labelCoverage.ingredientCount === "number"
          ? `${labelCoverage.ingredientCount} ingredients`
          : null,
        typeof labelCoverage.additiveCount === "number"
          ? `${labelCoverage.additiveCount} additives`
          : null,
        maybeString(labelCoverage.confidenceNote)
      ])
    : null;

  return compact([
    makeSection(
      "Nutrition facts detected",
      [
        ...asArray<NutritionFact>(nutrition.facts).map(nutritionFactLine),
        ...primitiveNutritionLines(nutrition)
      ],
      "info"
    ),
    makeSection(
      "Ingredient explanations in Hinglish",
      asArray<IngredientInsight>(nutrition.ingredientInsights).map(ingredientLine),
      "info"
    ),
    makeSection(
      "If eaten regularly",
      asArray<FutureHealthRisk>(nutrition.regularUseRisks).map(futureRiskLine),
      "danger"
    ),
    makeSection("Label coverage", [coverageLine], "info")
  ]);
}

function diarySuggestionDetails(value: unknown) {
  if (Array.isArray(value)) {
    return {
      improvementTips: asStringArray(value),
      missingNutrients: [] as string[],
      healthierSwaps: [] as SwapRecommendation[],
      badgesEarned: [] as string[],
      entries: [] as ManualMealEntry[],
      aiSummary: undefined as string | undefined
    };
  }

  const details = isRecord(value) ? value : {};
  return {
    improvementTips: asStringArray(details.improvementTips ?? details.tips),
    missingNutrients: asStringArray(details.missingNutrients),
    healthierSwaps: asArray<SwapRecommendation>(details.healthierSwaps),
    badgesEarned: asStringArray(details.badgesEarned),
    entries: asArray<ManualMealEntry>(details.entries),
    aiSummary: maybeString(details.aiSummary)
  };
}

function mealEntryLine(entry: ManualMealEntry) {
  return joinParts([
    `${entry.itemName} (${entry.source})`,
    entry.mealTime ? formatFlag(entry.mealTime) : null,
    entry.quantity,
    entry.spiceLevel ? `Spice: ${entry.spiceLevel}` : null,
    entry.notes
  ]);
}

function receiptActivity(row: ReceiptRow): AccountActivity {
  const items = asArray<FoodItem>(row.detected_items);
  const risks = asArray<RiskFlag>(row.risk_flags);
  const swaps = asArray<SwapRecommendation>(row.swaps);
  const names = itemNames(items);

  return {
    id: `receipt-${row.id}`,
    type: "receipt",
    title: "Receipt scan",
    detail: names.length ? names.join(", ") : "Receipt analyzed",
    description: textPreview(row.ai_summary ?? row.extracted_text ?? "", "Receipt analysis saved."),
    createdAt: row.created_at,
    score: row.health_score ?? undefined,
    metrics: compact([
      typeof row.health_score === "number" ? `Score ${row.health_score}/100` : null,
      `${items.length} detected items`,
      `${risks.length} risk flags`
    ]),
    tags: risks.slice(0, 4).map((risk) => risk.label),
    resultSections: compact([
      makeSection("Detected food items", items.map(foodItemLine), "info"),
      makeSection("Risk flags from this receipt", risks.map(riskLine), "warning"),
      makeSection("Healthier swaps suggested", swaps.map(swapLine), "good"),
      ...receiptCostSections(row.cost_summary),
      makeSection("Receipt text captured", [row.extracted_text ? textPreview(row.extracted_text, "", 500) : null], "default")
    ])
  };
}

function labelActivity(row: LabelRow): AccountActivity {
  const warnings = asArray<RiskFlag>(row.warnings);
  const alternatives = asArray<SwapRecommendation>(row.better_alternatives);

  return {
    id: `label-${row.id}`,
    type: "label",
    title: "LabelScan",
    detail: row.product_name || "Packaged food label",
    description: textPreview(row.ai_summary ?? "", "Food label analysis saved."),
    createdAt: row.created_at,
    score: row.label_truth_score ?? undefined,
    metrics: compact([
      typeof row.label_truth_score === "number" ? `Truth score ${row.label_truth_score}/100` : null,
      `${asArray(row.ingredients).length} ingredients`,
      `${warnings.length} warnings`
    ]),
    tags: warnings.slice(0, 4).map((warning) => warning.label),
    resultSections: compact([
      ...labelNutritionSections(row.nutrition),
      makeSection("Ingredients found on pack", asStringArray(row.ingredients), "info"),
      makeSection("Warnings from this label", warnings.map(riskLine), "warning"),
      makeSection("Better alternatives", alternatives.map(swapLine), "good")
    ])
  };
}

function diaryActivity(row: DiaryRow): AccountActivity {
  const goodItems = asArray<FoodItem>(row.good_items);
  const riskyItems = asArray<FoodItem>(row.risky_items);
  const names = [...itemNames(goodItems, 3), ...itemNames(riskyItems, 3)];
  const suggestionDetails = diarySuggestionDetails(row.suggestions);

  return {
    id: `diary-${row.id}`,
    type: "diary",
    title: "Manual food diary",
    detail: names.length ? names.join(", ") : textPreview(row.diary_text, "Food diary entry", 90),
    description: textPreview(row.diary_text, "Manual diary entry saved."),
    createdAt: row.created_at,
    score: row.daily_score ?? undefined,
    metrics: compact([
      typeof row.daily_score === "number" ? `Daily score ${row.daily_score}/100` : null,
      typeof row.calories_estimate === "number" ? `${row.calories_estimate} kcal approx` : null,
      typeof row.protein_estimate === "number" ? `${row.protein_estimate}g protein approx` : null
    ]),
    tags: riskyItems.slice(0, 4).map((item) => item.name),
    resultSections: compact([
      makeSection("Manual entry saved", [row.diary_text], "default"),
      makeSection("Meal-by-meal entries", suggestionDetails.entries.map(mealEntryLine), "info"),
      makeSection("Good foods detected", goodItems.map(foodItemLine), "good"),
      makeSection("Foods to watch", riskyItems.map(foodItemLine), "warning"),
      makeSection("Improvement tips", suggestionDetails.improvementTips, "good"),
      makeSection("Missing nutrients", suggestionDetails.missingNutrients, "warning"),
      makeSection("Healthier swaps", suggestionDetails.healthierSwaps.map(swapLine), "good"),
      makeSection("Badges earned", suggestionDetails.badgesEarned, "info"),
      makeSection("Diary analysis summary", [suggestionDetails.aiSummary], "default")
    ])
  };
}

function reportActivity(row: ReportRow): AccountActivity {
  const reportData =
    typeof row.report_data === "object" && row.report_data !== null
      ? (row.report_data as Record<string, unknown>)
      : {};
  const score =
    typeof reportData.healthScore === "number" ? reportData.healthScore : undefined;

  return {
    id: `report-${row.id}`,
    type: "report",
    title: "PDF report generated",
    detail: typeof reportData.dateRange === "string" ? reportData.dateRange : "Health report",
    description: "A downloadable DabbaDoc health report was generated for this account.",
    createdAt: row.created_at,
    score,
    metrics: compact([score ? `Score ${score}/100` : null, "PDF export"]),
    tags: ["Report"],
    resultSections: compact([
      makeSection(
        "Report data saved",
        Object.entries(reportData).map(([key, value]) => {
          if (typeof value === "string" || typeof value === "number") {
            return `${formatFlag(key)}: ${value}`;
          }
          return null;
        }),
        "info"
      ),
      makeSection("Report file", [row.report_url ? "PDF report URL saved for this account." : null], "default")
    ])
  };
}

function paymentActivity(row: PaymentRow): AccountActivity {
  return {
    id: `payment-${row.id}`,
    type: "payment",
    title: "Plan/payment update",
    detail: `${row.plan ?? "premium"} plan: ${row.status}`,
    description: "Razorpay payment status was updated for this account.",
    createdAt: row.created_at,
    metrics: compact([
      typeof row.amount === "number" ? `INR ${Math.round(row.amount / 100)}` : null,
      row.status
    ]),
    tags: ["Billing"],
    resultSections: compact([
      makeSection(
        "Payment result",
        [
          `Status: ${row.status}`,
          row.plan ? `Plan: ${row.plan}` : null,
          typeof row.amount === "number" ? `Amount: INR ${Math.round(row.amount / 100)}` : null
        ],
        "info"
      )
    ])
  };
}

function deriveBadges(params: {
  activityCount: number;
  streakDays: number;
  receiptCount: number;
  labelCount: number;
  diaryCount: number;
  isPremium: boolean;
  savedBadges: string[];
}) {
  const badges = new Set(params.savedBadges);
  if (params.activityCount > 0) badges.add("Family health starter");
  if (params.receiptCount > 0) badges.add("Receipt reader");
  if (params.labelCount > 0) badges.add("Label aware badge");
  if (params.diaryCount > 0) badges.add("Diary builder");
  if (params.streakDays >= 3) badges.add("3-day tracker badge");
  if (params.streakDays >= 7) badges.add("7-day healthy streak badge");
  if (params.isPremium) badges.add("Premium member");
  return Array.from(badges);
}

export async function getAccountOverview(): Promise<AccountOverview> {
  const supabase = await createSupabaseServer();
  if (!supabase) {
    throw new ApiError("Secure account access is temporarily unavailable.", 503);
  }

  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new ApiError("Please log in to continue.", 401);
  }

  if (user.email && !user.email_confirmed_at) {
    throw new ApiError("Please verify your email before continuing.", 403);
  }

  const [
    profileResponse,
    receiptsResponse,
    labelsResponse,
    diariesResponse,
    healthResponse,
    reportsResponse,
    paymentsResponse
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("email, full_name, is_premium, plan, trial_start, trial_end, created_at")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("receipt_analyses")
      .select("id, extracted_text, detected_items, risk_flags, health_score, cost_summary, swaps, ai_summary, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(30),
    supabase
      .from("label_analyses")
      .select("id, product_name, ingredients, nutrition, label_truth_score, warnings, better_alternatives, ai_summary, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(30),
    supabase
      .from("food_diaries")
      .select("id, diary_text, calories_estimate, protein_estimate, good_items, risky_items, suggestions, daily_score, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(30),
    supabase
      .from("health_index")
      .select("id, score, streak_count, badges, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(30),
    supabase
      .from("reports")
      .select("id, report_url, report_data, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(30),
    supabase
      .from("payments")
      .select("id, status, amount, plan, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(15)
  ]);

  const profile = (profileResponse.data ?? null) as ProfileRow | null;
  const receipts = (receiptsResponse.data ?? []) as ReceiptRow[];
  const labels = (labelsResponse.data ?? []) as LabelRow[];
  const diaries = (diariesResponse.data ?? []) as DiaryRow[];
  const healthRows = (healthResponse.data ?? []) as HealthRow[];
  const reports = (reportsResponse.data ?? []) as ReportRow[];
  const payments = (paymentsResponse.data ?? []) as PaymentRow[];

  const fullName = getUserDisplayName(user, profile);
  const email = profile?.email || user.email || "";
  const activities = [
    ...receipts.map(receiptActivity),
    ...labels.map(labelActivity),
    ...diaries.map(diaryActivity),
    ...reports.map(reportActivity),
    ...payments.map(paymentActivity)
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const scoreEvents = [
    ...healthRows.map((row) => ({ createdAt: row.created_at, score: row.score })),
    ...receipts
      .filter((row) => typeof row.health_score === "number")
      .map((row) => ({ createdAt: row.created_at, score: row.health_score ?? 0 })),
    ...labels
      .filter((row) => typeof row.label_truth_score === "number")
      .map((row) => ({ createdAt: row.created_at, score: row.label_truth_score ?? 0 })),
    ...diaries
      .filter((row) => typeof row.daily_score === "number")
      .map((row) => ({ createdAt: row.created_at, score: row.daily_score ?? 0 }))
  ]
    .filter((event) => Number.isFinite(event.score))
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const latestScore = scoreEvents.at(-1)?.score ?? 0;
  const chart = scoreEvents.slice(-7).map((event) => ({
    date: formatShortDate(event.createdAt),
    score: event.score
  }));
  const latestHealth = healthRows[0];
  const activityStreak = calculateActivityStreak(
    activities
      .filter((activity) => ["receipt", "label", "diary"].includes(activity.type))
      .map((activity) => activity.createdAt)
  );
  const streakDays = Math.max(latestHealth?.streak_count ?? 0, activityStreak);
  const savedBadges = asArray<string>(latestHealth?.badges);
  const isPremium = Boolean(profile?.is_premium);
  const badges = deriveBadges({
    activityCount: activities.length,
    streakDays,
    receiptCount: receipts.length,
    labelCount: labels.length,
    diaryCount: diaries.length,
    isPremium,
    savedBadges
  });

  const riskSummary = [
    ...receipts.flatMap((receipt) =>
      asArray<RiskFlag>(receipt.risk_flags).map((risk) => ({
        label: risk.label,
        severity: risk.severity,
        detail: risk.possibleConcern || risk.reason
      }))
    ),
    ...labels.flatMap((label) =>
      asArray<RiskFlag>(label.warnings).map((warning) => ({
        label: warning.label,
        severity: warning.severity,
        detail: warning.possibleConcern || warning.reason
      }))
    ),
    ...diaries.flatMap((diary) =>
      asArray<FoodItem>(diary.risky_items).map((item) => ({
        label: `${item.name} watch`,
        severity: item.flags?.includes("high_sodium") ? "high" : "medium",
        detail: `${item.name} appeared in manual diary history.`
      }))
    )
  ].slice(0, 6);

  return {
    user,
    profile: {
      fullName,
      email,
      initials: initialsForName(fullName),
      plan: profile?.plan || (isPremium ? "premium" : "free"),
      isPremium,
      createdAt: profile?.created_at || user.created_at,
      trialEnd: profile?.trial_end ?? undefined
    },
    counts: {
      receipts: receipts.length,
      labels: labels.length,
      diaries: diaries.length,
      reports: reports.length,
      payments: payments.length,
      scans: receipts.length + labels.length + diaries.length,
      activities: activities.length
    },
    score: {
      current: latestScore,
      category: latestScore > 0 ? getScoreCategory(latestScore) : "Start scanning",
      trendLabel: buildTrendLabel(scoreEvents),
      chart: chart.length > 0 ? chart : [{ date: "Today", score: 0 }]
    },
    streak: {
      days: streakDays,
      label: streakDays === 1 ? "1 active day" : `${streakDays} active days`
    },
    badges,
    recentActivities: activities.slice(0, 5),
    allActivities: activities,
    riskSummary
  };
}
