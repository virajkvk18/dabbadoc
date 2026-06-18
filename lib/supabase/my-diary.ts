import "server-only";

import type { FoodItem, ManualMealEntry, RiskFlag, SwapRecommendation } from "@/types";
import {
  appDateKeyToDate,
  formatAppLongDate,
  formatAppShortDate,
  formatAppTime,
  formatAppWeekday,
  getAppDateKey,
  shiftAppDateKey
} from "@/lib/date-time";
import { ApiError } from "@/lib/security/api-errors";
import { createSupabaseServer } from "./server";

export type DiaryMealSlot = "Morning" | "Afternoon" | "Evening" | "Dinner / Snacks";
export type DiaryEntrySource =
  | "manual"
  | "outside_food"
  | "restaurant_receipt"
  | "grocery_receipt"
  | "quick_commerce_receipt"
  | "label_scan"
  | "barcode_scan";

export type PredictiveRiskKey =
  | "sugar"
  | "sodium"
  | "fried"
  | "packaged"
  | "outside"
  | "lowProtein"
  | "lowFiber"
  | "refinedFlour"
  | "sugaryDrinks"
  | "lateNight";

export type PredictiveInsight = {
  key: PredictiveRiskKey;
  title: string;
  level: "Low" | "Medium" | "High";
  reason: string;
  recommendation: string;
  relatedItems: string[];
  disclaimer: string;
};

export type DiaryEntry = {
  id: string;
  createdAt: string;
  source: DiaryEntrySource;
  sourceLabel: string;
  mealSlot: DiaryMealSlot;
  title: string;
  detail: string;
  items: string[];
  warnings: Array<{ title: string; level: string; reason: string }>;
  swaps: SwapRecommendation[];
  score?: number;
  calories?: number;
  protein?: number;
  cost?: {
    current: number;
    healthier: number;
    savings: number;
  };
};

export type DiaryDay = {
  date: string;
  dateLabel: string;
  dayName: string;
  entries: DiaryEntry[];
  mealSlots: DiaryMealSlot[];
  totalFoodEntries: number;
  attachedScans: number;
  score: number;
  status: string;
  warnings: string[];
  predictiveInsights: PredictiveInsight[];
  riskCounts: Record<PredictiveRiskKey, number>;
  swaps: SwapRecommendation[];
  cost: {
    current: number;
    healthier: number;
    savings: number;
  } | null;
};

export type MyDiaryOverview = {
  days: DiaryDay[];
  today: DiaryDay | null;
  weeklyAverage: number;
  currentStreak: number;
  bestStreak: number;
  totalLoggedDays: number;
  milestones: string[];
  chart: Array<{ date: string; score: number }>;
  weeklyRiskCounts: Record<PredictiveRiskKey, number>;
  weeklyAlerts: PredictiveInsight[];
  topPattern: string;
  mostImprovedHabit: string;
  needsAttention: string;
};

type UploadRow = { id: string; source_type: string };
type ReceiptRow = {
  id: string;
  upload_id: string | null;
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

const riskKeys: PredictiveRiskKey[] = [
  "sugar",
  "sodium",
  "fried",
  "packaged",
  "outside",
  "lowProtein",
  "lowFiber",
  "refinedFlour",
  "sugaryDrinks",
  "lateNight"
];

const emptyRiskCounts = () =>
  Object.fromEntries(riskKeys.map((key) => [key, 0])) as Record<PredictiveRiskKey, number>;

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function cleanText(value: string | null | undefined, fallback: string) {
  return value?.replace(/\s+/g, " ").trim() || fallback;
}

function clampScore(score: number) {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function mealSlotForTime(value: string): DiaryMealSlot {
  const hour = Number(
    new Intl.DateTimeFormat("en-IN", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      hourCycle: "h23"
    })
      .formatToParts(new Date(value))
      .find((part) => part.type === "hour")?.value ?? 0
  );
  if (hour < 11) return "Morning";
  if (hour < 16) return "Afternoon";
  if (hour < 20) return "Evening";
  return "Dinner / Snacks";
}

function mealSlotForEntry(entry: ManualMealEntry): DiaryMealSlot {
  if (entry.mealTime === "breakfast") return "Morning";
  if (entry.mealTime === "lunch") return "Afternoon";
  if (entry.mealTime === "evening_snack") return "Evening";
  return "Dinner / Snacks";
}

function warningRows(value: unknown) {
  return asArray<RiskFlag>(value).map((warning) => ({
    title: warning.label || "Food pattern to watch",
    level: warning.severity || "medium",
    reason: warning.possibleConcern || warning.reason || "Pattern detected in this entry."
  }));
}

function sourceForReceipt(sourceType?: string): Pick<DiaryEntry, "source" | "sourceLabel"> {
  if (sourceType === "food_delivery") {
    return { source: "restaurant_receipt", sourceLabel: "Restaurant / delivery receipt" };
  }
  if (sourceType === "quick_commerce") {
    return { source: "quick_commerce_receipt", sourceLabel: "Quick-commerce receipt" };
  }
  return { source: "grocery_receipt", sourceLabel: "Grocery receipt" };
}

function costForReceipt(value: unknown): DiaryEntry["cost"] {
  if (!isRecord(value)) return undefined;
  const current = asNumber(value.currentMonthlyEstimate);
  const healthier = asNumber(value.healthierMonthlyEstimate);
  const savings = asNumber(value.monthlySavings);
  return current || healthier || savings ? { current, healthier, savings } : undefined;
}

function manualEntries(row: DiaryRow): DiaryEntry[] {
  const suggestions = isRecord(row.suggestions) ? row.suggestions : {};
  const structuredEntries = asArray<ManualMealEntry>(suggestions.entries);
  const riskyItems = asArray<FoodItem>(row.risky_items);
  const goodItems = asArray<FoodItem>(row.good_items);
  const warnings = riskyItems.map((item) => ({
    title: `${item.name} pattern to watch`,
    level: item.flags?.includes("high_sodium") ? "high" : "medium",
    reason: `${item.name} may increase food-risk load when it appears frequently.`
  }));
  const swaps = asArray<SwapRecommendation>(suggestions.healthierSwaps);

  if (structuredEntries.length === 0) {
    const names = [...goodItems, ...riskyItems].map((item) => item.name).filter(Boolean);
    return [
      {
        id: `manual-${row.id}`,
        createdAt: row.created_at,
        source: "manual",
        sourceLabel: "Manual food log",
        mealSlot: mealSlotForTime(row.created_at),
        title: names.slice(0, 3).join(", ") || "Manual food diary",
        detail: cleanText(row.diary_text, "Food diary entry"),
        items: names,
        warnings,
        swaps,
        score: row.daily_score ?? undefined,
        calories: row.calories_estimate ?? undefined,
        protein: row.protein_estimate ?? undefined
      }
    ];
  }

  return structuredEntries.map((entry, index) => ({
    id: `manual-${row.id}-${entry.id ?? index}`,
    createdAt: entry.loggedAt ?? row.created_at,
    source: entry.source === "outside" ? "outside_food" : "manual",
    sourceLabel: entry.source === "outside" ? "Outside food" : "Manual food log",
    mealSlot: mealSlotForEntry(entry),
    title: entry.itemName,
    detail: [entry.quantity, `${entry.spiceLevel} spice`, entry.notes].filter(Boolean).join(" | "),
    items: [entry.itemName],
    warnings: index === 0 ? warnings : [],
    swaps: index === 0 ? swaps : [],
    score: index === 0 ? row.daily_score ?? undefined : undefined,
    calories: index === 0 ? row.calories_estimate ?? undefined : undefined,
    protein: index === 0 ? row.protein_estimate ?? undefined : undefined
  }));
}

function receiptEntry(row: ReceiptRow, sourceType?: string): DiaryEntry {
  const source = sourceForReceipt(sourceType);
  const items = asArray<FoodItem>(row.detected_items).map((item) => item.name).filter(Boolean);
  return {
    id: `receipt-${row.id}`,
    createdAt: row.created_at,
    ...source,
    mealSlot: mealSlotForTime(row.created_at),
    title: items.slice(0, 3).join(", ") || source.sourceLabel,
    detail: cleanText(row.ai_summary ?? row.extracted_text, "Receipt analysis saved."),
    items,
    warnings: warningRows(row.risk_flags),
    swaps: asArray<SwapRecommendation>(row.swaps),
    score: row.health_score ?? undefined,
    cost: costForReceipt(row.cost_summary)
  };
}

function labelEntry(row: LabelRow): DiaryEntry {
  const nutrition = isRecord(row.nutrition) ? row.nutrition : {};
  const barcode = nutrition.scanSource === "barcode_scan";
  const ingredients = asArray<string>(row.ingredients).filter(Boolean);
  return {
    id: `label-${row.id}`,
    createdAt: row.created_at,
    source: barcode ? "barcode_scan" : "label_scan",
    sourceLabel: barcode ? "Barcode scan" : "Packaged food label",
    mealSlot: mealSlotForTime(row.created_at),
    title: row.product_name || "Packaged food",
    detail: cleanText(row.ai_summary, barcode ? "Barcode product saved." : "Label analysis saved."),
    items: [row.product_name || "Packaged food", ...ingredients.slice(0, 4)],
    warnings: warningRows(row.warnings),
    swaps: asArray<SwapRecommendation>(row.better_alternatives),
    score: row.label_truth_score ?? undefined
  };
}

function entrySearchText(entry: DiaryEntry) {
  return [
    entry.title,
    entry.detail,
    ...entry.items,
    ...entry.warnings.flatMap((warning) => [warning.title, warning.reason])
  ]
    .join(" ")
    .toLowerCase();
}

function matchingItems(entries: DiaryEntry[], pattern: RegExp) {
  return Array.from(
    new Set(
      entries
        .filter((entry) => pattern.test(entrySearchText(entry)))
        .flatMap((entry) => entry.items.length ? entry.items : [entry.title])
        .filter(Boolean)
    )
  ).slice(0, 4);
}

function detectRiskCounts(entries: DiaryEntry[]) {
  const counts = emptyRiskCounts();
  const patterns: Array<[PredictiveRiskKey, RegExp]> = [
    ["sugar", /\b(sugar|sweet|dessert|chocolate|mithai|cake|candy)\b/i],
    ["sodium", /\b(sodium|salty|salt|namkeen|chips|pickle|instant noodles?)\b/i],
    ["fried", /\b(fried|deep[- ]fried|fries|samosa|pakora|puri|bhatura)\b/i],
    ["refinedFlour", /\b(maida|refined flour|white bread|noodles|pizza base)\b/i],
    ["sugaryDrinks", /\b(soft drink|soda|cola|coke|sweetened drink|energy drink)\b/i]
  ];

  for (const entry of entries) {
    const text = entrySearchText(entry);
    for (const [key, pattern] of patterns) {
      if (pattern.test(text)) counts[key] += 1;
    }
    if (["label_scan", "barcode_scan"].includes(entry.source) || /\b(packaged|packet|ultra[- ]processed|nova)\b/i.test(text)) {
      counts.packaged += 1;
    }
    if (["outside_food", "restaurant_receipt"].includes(entry.source)) counts.outside += 1;
    if (entry.mealSlot === "Dinner / Snacks" && /\b(heavy|fried|outside|pizza|burger|biryani)\b/i.test(text)) {
      counts.lateNight += 1;
    }
  }

  const foodEntries = entries.filter((entry) => ["manual", "outside_food"].includes(entry.source));
  const protein = entries.reduce((total, entry) => total + (entry.protein ?? 0), 0);
  const allText = entries.map(entrySearchText).join(" ");
  if (foodEntries.length >= 2 && protein < 40 && !/\b(dal|paneer|egg|chicken|fish|curd|tofu|beans|protein)\b/i.test(allText)) {
    counts.lowProtein = 1;
  }
  if (foodEntries.length >= 3 && !/\b(vegetable|salad|fruit|fiber|dal|beans|sabzi)\b/i.test(allText)) {
    counts.lowFiber = 1;
  }
  return counts;
}

const insightDefinitions: Record<
  PredictiveRiskKey,
  { title: string; reason: string; recommendation: string; pattern: RegExp }
> = {
  sugar: {
    title: "High sugar pattern",
    reason: "Repeated sugary foods may increase the possibility of energy crashes and unwanted weight gain over time.",
    recommendation: "Pair sweet foods with protein or fruit and reduce one added-sugar item at the next meal.",
    pattern: /\b(sugar|sweet|dessert|chocolate|mithai|cake|candy)\b/i
  },
  sodium: {
    title: "High sodium pattern",
    reason: "Frequent salty or high-sodium foods may increase blood-pressure risk over time.",
    recommendation: "Choose a lower-sodium option and balance it with fresh home-cooked food and water.",
    pattern: /\b(sodium|salty|salt|namkeen|chips|pickle|instant noodles?)\b/i
  },
  fried: {
    title: "Fried food pattern",
    reason: "Frequent fried food may increase digestive discomfort and unhealthy fat intake.",
    recommendation: "Try grilled, roasted, steamed, air-fried, or lightly sauteed alternatives.",
    pattern: /\b(fried|deep[- ]fried|fries|samosa|pakora|puri|bhatura)\b/i
  },
  packaged: {
    title: "Packaged food pattern",
    reason: "Multiple packaged foods may increase exposure to sodium, added sugar, and ultra-processed ingredients.",
    recommendation: "Replace one packet food with fruit, roasted chana, curd, nuts, or a simple home snack.",
    pattern: /./
  },
  outside: {
    title: "Outside food pattern",
    reason: "Frequent outside food may make oil, salt, sugar, and portion size harder to control.",
    recommendation: "Choose a dal, grilled protein, roti, rice bowl, or vegetable-based option and keep sauces separate.",
    pattern: /./
  },
  lowProtein: {
    title: "Possible low protein pattern",
    reason: "The available log shows limited protein evidence, which may affect fullness and muscle recovery.",
    recommendation: "Add dal, chana, rajma, paneer, curd, tofu, eggs, fish, or chicken as suitable for you.",
    pattern: /./
  },
  lowFiber: {
    title: "Possible low fiber pattern",
    reason: "The available log shows limited vegetables, fruit, pulses, or whole-grain evidence and may affect digestion.",
    recommendation: "Add one vegetable serving, fruit, salad, dal, beans, or a whole-grain choice.",
    pattern: /./
  },
  refinedFlour: {
    title: "Refined flour pattern",
    reason: "Repeated maida or refined-flour foods may reduce fullness and increase rapid blood-sugar load.",
    recommendation: "Prefer atta, millet, oats, brown bread, or a higher-fiber base where practical.",
    pattern: /\b(maida|refined flour|white bread|noodles|pizza base)\b/i
  },
  sugaryDrinks: {
    title: "Sugary drink pattern",
    reason: "Sugary drinks can add a fast sugar load with limited fullness.",
    recommendation: "Try water, chaas, unsweetened nimbu pani, coconut water, or unsweetened tea.",
    pattern: /\b(soft drink|soda|cola|coke|sweetened drink|energy drink)\b/i
  },
  lateNight: {
    title: "Late-night heavy meal pattern",
    reason: "Heavy late meals may increase the possibility of poor sleep or digestive discomfort.",
    recommendation: "Keep late meals lighter and leave a comfortable gap before sleep when possible.",
    pattern: /./
  }
};

function predictiveInsights(entries: DiaryEntry[], counts: Record<PredictiveRiskKey, number>) {
  return riskKeys
    .filter((key) => counts[key] > 0)
    .map((key): PredictiveInsight => {
      const definition = insightDefinitions[key];
      const count = counts[key];
      return {
        key,
        title: definition.title,
        level: count >= 3 ? "High" : count >= 2 ? "Medium" : "Low",
        reason: definition.reason,
        recommendation: definition.recommendation,
        relatedItems:
          key === "packaged"
            ? entries.filter((entry) => ["label_scan", "barcode_scan"].includes(entry.source)).map((entry) => entry.title).slice(0, 4)
            : key === "outside"
              ? entries.filter((entry) => ["outside_food", "restaurant_receipt"].includes(entry.source)).map((entry) => entry.title).slice(0, 4)
              : matchingItems(entries, definition.pattern),
        disclaimer: "This is an early-warning pattern, not a diagnosis. Consult a doctor or dietitian for medical advice."
      };
    })
    .sort((a, b) => ({ High: 3, Medium: 2, Low: 1 }[b.level] - { High: 3, Medium: 2, Low: 1 }[a.level]));
}

export function calculateDailyHealthIndex(entries: DiaryEntry[]) {
  const savedScores = entries.map((entry) => entry.score).filter((score): score is number => typeof score === "number");
  let score = savedScores.length
    ? savedScores.reduce((total, value) => total + value, 0) / savedScores.length
    : 70;
  const slots = new Set(entries.filter((entry) => ["manual", "outside_food"].includes(entry.source)).map((entry) => entry.mealSlot));
  const counts = detectRiskCounts(entries);
  if (slots.has("Morning")) score += 3;
  if (slots.size >= 3) score += 3;
  score -= Math.min(8, counts.outside * 3);
  score -= Math.min(8, counts.packaged * 3);
  score -= Math.min(6, counts.sugar * 2);
  score -= Math.min(6, counts.fried * 2);
  return clampScore(score);
}

function statusForDay(score: number, counts: Record<PredictiveRiskKey, number>) {
  if (counts.sugar >= 2) return "High Sugar Day";
  if (counts.outside >= 2) return "Outside Food Heavy";
  if (counts.packaged >= 2) return "Packaged Food Heavy";
  if (counts.lowProtein > 0) return "Possible Low Protein Day";
  if (score >= 70) return "Balanced Day";
  return "Needs Attention";
}

function groupEntriesByDate(entries: DiaryEntry[]) {
  const grouped = new Map<string, DiaryEntry[]>();
  for (const entry of entries) {
    const key = getAppDateKey(entry.createdAt);
    grouped.set(key, [...(grouped.get(key) ?? []), entry]);
  }
  return grouped;
}

function buildDay(date: string, entries: DiaryEntry[]): DiaryDay {
  const sortedEntries = [...entries].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  const counts = detectRiskCounts(sortedEntries);
  const insights = predictiveInsights(sortedEntries, counts);
  const score = calculateDailyHealthIndex(sortedEntries);
  const mealSlots = Array.from(
    new Set(
      sortedEntries
        .filter((entry) => ["manual", "outside_food"].includes(entry.source))
        .map((entry) => entry.mealSlot)
    )
  );
  const costs = sortedEntries.map((entry) => entry.cost).filter((cost): cost is NonNullable<DiaryEntry["cost"]> => Boolean(cost));
  const dateValue = appDateKeyToDate(date);
  return {
    date,
    dateLabel: formatAppLongDate(dateValue),
    dayName: formatAppWeekday(dateValue),
    entries: sortedEntries,
    mealSlots,
    totalFoodEntries: sortedEntries.reduce(
      (total, entry) =>
        total +
        (["restaurant_receipt", "grocery_receipt", "quick_commerce_receipt"].includes(entry.source)
          ? Math.max(1, entry.items.length)
          : 1),
      0
    ),
    attachedScans: sortedEntries.filter((entry) => !["manual", "outside_food"].includes(entry.source)).length,
    score,
    status: statusForDay(score, counts),
    warnings: Array.from(
      new Set([
        ...sortedEntries.flatMap((entry) => entry.warnings.map((warning) => warning.title)),
        ...insights.map((insight) => insight.title)
      ])
    ).slice(0, 3),
    predictiveInsights: insights,
    riskCounts: counts,
    swaps: Array.from(
      new Map(sortedEntries.flatMap((entry) => entry.swaps).map((swap) => [`${swap.original}-${swap.swap}`, swap])).values()
    ).slice(0, 8),
    cost: costs.length
      ? {
          current: costs.reduce((total, cost) => total + cost.current, 0),
          healthier: costs.reduce((total, cost) => total + cost.healthier, 0),
          savings: costs.reduce((total, cost) => total + cost.savings, 0)
        }
      : null
  };
}

function calculateStreaks(dateKeys: string[]) {
  const dates = Array.from(new Set(dateKeys)).sort();
  if (dates.length === 0) return { current: 0, best: 0 };
  let best = 1;
  let running = 1;
  for (let index = 1; index < dates.length; index += 1) {
    running = dates[index] === shiftAppDateKey(dates[index - 1], 1) ? running + 1 : 1;
    best = Math.max(best, running);
  }
  const today = getAppDateKey();
  const latest = dates.at(-1) ?? "";
  if (latest !== today && latest !== shiftAppDateKey(today, -1)) return { current: 0, best };
  let current = 1;
  for (let index = dates.length - 1; index > 0; index -= 1) {
    if (dates[index - 1] !== shiftAppDateKey(dates[index], -1)) break;
    current += 1;
  }
  return { current, best };
}

function milestoneList(days: DiaryDay[], bestStreak: number) {
  const milestones: string[] = [];
  if (days.length > 0) milestones.push("First diary log");
  if (bestStreak >= 3) milestones.push("3-day streak");
  if (bestStreak >= 7) milestones.push("7-day streak");
  if (bestStreak >= 15) milestones.push("15-day streak");
  if (days.some((day) => day.score >= 75)) milestones.push("Healthy day achieved");
  if (days.reduce((total, day) => total + day.attachedScans, 0) >= 5) milestones.push("5 scans attached");
  if (days.some((day, index) => index < days.length - 1 && day.score > days[index + 1].score)) milestones.push("Improved health score");
  if (days.some((day, index) => index < days.length - 1 && day.riskCounts.outside < days[index + 1].riskCounts.outside)) milestones.push("Reduced outside food day");
  if (days.some((day, index) => index < days.length - 1 && day.riskCounts.sugar < days[index + 1].riskCounts.sugar)) milestones.push("Reduced sugar day");
  return milestones;
}

function weeklySummary(days: DiaryDay[]) {
  const cutoff = shiftAppDateKey(getAppDateKey(), -6);
  const week = days.filter((day) => day.date >= cutoff);
  const counts = emptyRiskCounts();
  for (const day of week) {
    for (const key of riskKeys) counts[key] += day.riskCounts[key];
  }
  const alerts = predictiveInsights(week.flatMap((day) => day.entries), counts).slice(0, 4);
  const topKey = [...riskKeys].sort((a, b) => counts[b] - counts[a])[0];
  const topPattern = topKey && counts[topKey] > 0 ? insightDefinitions[topKey].title : "No repeated warning pattern yet";
  const recent = days[0];
  const previous = days[1];
  let mostImprovedHabit = "Keep logging to reveal an improving habit";
  if (recent && previous) {
    const improved = [...riskKeys].sort(
      (a, b) => previous.riskCounts[b] - recent.riskCounts[b] - (previous.riskCounts[a] - recent.riskCounts[a])
    )[0];
    if (improved && previous.riskCounts[improved] > recent.riskCounts[improved]) {
      mostImprovedHabit = `Reduced ${insightDefinitions[improved].title.toLowerCase()}`;
    }
  }
  return {
    week,
    counts,
    alerts,
    topPattern,
    mostImprovedHabit,
    needsAttention: alerts[0]?.title ?? "Add more meal detail for a clearer pattern"
  };
}

export function buildMyDiaryOverview(entries: DiaryEntry[]): MyDiaryOverview {
  const days = Array.from(groupEntriesByDate(entries), ([date, dayEntries]) => buildDay(date, dayEntries)).sort((a, b) => b.date.localeCompare(a.date));
  const streaks = calculateStreaks(days.map((day) => day.date));
  const weekly = weeklySummary(days);
  return {
    days,
    today: days.find((day) => day.date === getAppDateKey()) ?? null,
    weeklyAverage: weekly.week.length
      ? Math.round(weekly.week.reduce((total, day) => total + day.score, 0) / weekly.week.length)
      : 0,
    currentStreak: streaks.current,
    bestStreak: streaks.best,
    totalLoggedDays: days.length,
    milestones: milestoneList(days, streaks.best),
    chart: days.length
      ? days.slice(0, 7).reverse().map((day) => ({ date: formatAppShortDate(appDateKeyToDate(day.date)), score: day.score }))
      : [{ date: "Today", score: 0 }],
    weeklyRiskCounts: weekly.counts,
    weeklyAlerts: weekly.alerts,
    topPattern: weekly.topPattern,
    mostImprovedHabit: weekly.mostImprovedHabit,
    needsAttention: weekly.needsAttention
  };
}

export async function getMyDiaryOverview(): Promise<MyDiaryOverview> {
  const supabase = await createSupabaseServer();
  if (!supabase) throw new ApiError("Secure account access is temporarily unavailable.", 503);
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();
  if (userError || !user) throw new ApiError("Please log in to continue.", 401);

  const [uploadsResponse, receiptsResponse, labelsResponse, diariesResponse] = await Promise.all([
    supabase.from("uploads").select("id, source_type").eq("user_id", user.id).order("created_at", { ascending: false }).limit(180),
    supabase.from("receipt_analyses").select("id, upload_id, extracted_text, detected_items, risk_flags, health_score, cost_summary, swaps, ai_summary, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(120),
    supabase.from("label_analyses").select("id, product_name, ingredients, nutrition, label_truth_score, warnings, better_alternatives, ai_summary, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(120),
    supabase.from("food_diaries").select("id, diary_text, calories_estimate, protein_estimate, good_items, risky_items, suggestions, daily_score, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(120)
  ]);

  if (uploadsResponse.error || receiptsResponse.error || labelsResponse.error || diariesResponse.error) {
    throw new ApiError("Could not load My Diary right now.", 500);
  }

  const uploads = (uploadsResponse.data ?? []) as UploadRow[];
  const sourceByUpload = new Map(uploads.map((upload) => [upload.id, upload.source_type]));
  const entries = [
    ...((receiptsResponse.data ?? []) as ReceiptRow[]).map((row) => receiptEntry(row, row.upload_id ? sourceByUpload.get(row.upload_id) : undefined)),
    ...((labelsResponse.data ?? []) as LabelRow[]).map(labelEntry),
    ...((diariesResponse.data ?? []) as DiaryRow[]).flatMap(manualEntries)
  ];
  return buildMyDiaryOverview(entries);
}

export function formatDiaryEntryTime(value: string) {
  return formatAppTime(value);
}
