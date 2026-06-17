export const DABBADOC_DISCLAIMER =
  "DabbaDoc is not a medical diagnosis tool. Please consult a doctor/dietitian for medical advice.";

export type RiskSeverity = "low" | "medium" | "high";

export type SourceType =
  | "grocery_receipt"
  | "food_delivery"
  | "quick_commerce"
  | "packaged_label"
  | "food_diary";

export type PlanType = "free" | "premium" | "premium_plus";
export type PaidPlanType = Exclude<PlanType, "free">;

export type MealSource = "home" | "outside";
export type HealthGoal =
  | "Weight loss"
  | "Diabetes-friendly"
  | "High protein"
  | "Low sodium"
  | "Kids lunchbox"
  | "Heart-friendly";
export type MealTime =
  | "breakfast"
  | "lunch"
  | "evening_snack"
  | "dinner"
  | "late_night";
export type SpiceLevel = "none" | "low" | "medium" | "high";

export interface ManualMealEntry {
  id?: string;
  source: MealSource;
  mealTime: MealTime;
  itemName: string;
  quantity: string;
  spiceLevel: SpiceLevel;
  notes?: string;
}

export interface FoodItem {
  name: string;
  category: string;
  quantity?: string;
  price?: number;
  confidence?: number;
  flags?: string[];
  proteinEstimate?: number;
  calorieEstimate?: number;
}

export interface RiskFlag {
  label: string;
  severity: RiskSeverity;
  reason: string;
  possibleConcern: string;
}

export interface BlameItem {
  item: string;
  impact: number;
  reason: string;
  swap: string;
}

export interface SwapRecommendation {
  original: string;
  swap: string;
  reason: string;
  costDelta: number;
  scoreImpact: number;
}

export interface FutureHealthRisk {
  riskArea: string;
  severity: RiskSeverity;
  habitFrequency: string;
  possibleConcern: string;
  linkedItems: string[];
  preventionTip: string;
  timeframe?: string;
}

export interface NutritionFact {
  label: string;
  value?: number;
  unit?: string;
  per?: string;
  raw?: string;
  interpretation: string;
  concernLevel: RiskSeverity | "unknown";
}

export interface IngredientInsight {
  ingredient: string;
  purposeInFood: string;
  simpleHinglishExplanation: string;
  concernLevel: RiskSeverity | "unknown";
  naturalOrBetterAlternative?: string | null;
  possibleRegularUseConcern?: string;
}

export interface LabelCoverageSummary {
  nutritionFactCount: number;
  ingredientCount: number;
  additiveCount: number;
  confidenceNote: string;
}

export interface ItemHealthInsight {
  item: string;
  verdict: "good_choice" | "watch_portion" | "risky_if_frequent" | "unknown";
  reason: string;
  linkedRisks: string[];
  swap?: string;
}

export interface ReceiptCoverageSummary {
  detectedCount: number;
  riskyCount: number;
  swappedCount: number;
  confidenceNote: string;
}

export interface CostComparison {
  currentMonthlyEstimate: number;
  healthierMonthlyEstimate: number;
  monthlySavings: number;
  notes: string;
}

export interface HealthScoreBreakdown {
  processedFood: number;
  sugarLoad: number;
  sodiumLoad: number;
  friedFood: number;
  proteinAdequacy: number;
  wholeFoods: number;
  swapsAdopted: number;
  streakConsistency: number;
  labelTruthScore: number;
}

export interface ReceiptAnalysis {
  extractedText: string;
  detectedItems: FoodItem[];
  riskFlags: RiskFlag[];
  futureHealthRisks?: FutureHealthRisk[];
  itemInsights?: ItemHealthInsight[];
  coverageSummary?: ReceiptCoverageSummary;
  healthScore: number;
  scoreCategory: string;
  scoreBreakdown: HealthScoreBreakdown;
  blameMap: BlameItem[];
  swaps: SwapRecommendation[];
  costSummary: CostComparison;
  actionPlan: string[];
  aiSummary: string;
  disclaimer: string;
}

export interface LabelAnalysis {
  extractedText: string;
  productName: string;
  ingredients: string[];
  nutrition: {
    calories?: number;
    protein?: number;
    sugar?: number;
    addedSugar?: number;
    sodium?: number;
    fats?: number;
    saturatedFat?: number;
    transFat?: number;
    carbohydrates?: number;
    fiber?: number;
    servingSize?: string;
    facts?: NutritionFact[];
  };
  ingredientInsights?: IngredientInsight[];
  regularUseRisks?: FutureHealthRisk[];
  labelCoverage?: LabelCoverageSummary;
  labelTruthScore: number;
  safetyLevel: "daily-safe" | "sometimes-safe" | "avoid-frequent-use";
  whatYouThought: string;
  whatLabelSays: string;
  warnings: RiskFlag[];
  betterAlternatives: SwapRecommendation[];
  aiSummary: string;
  disclaimer: string;
}

export interface FoodDiaryAnalysis {
  diaryText: string;
  entries?: ManualMealEntry[];
  goodFoods: FoodItem[];
  riskyFoods: FoodItem[];
  caloriesEstimate: number;
  proteinEstimate: number;
  missingNutrients: string[];
  improvementTips: string[];
  healthierSwaps: SwapRecommendation[];
  dailyScore: number;
  streakCount: number;
  badgesEarned: string[];
  aiSummary: string;
  disclaimer: string;
}

export interface HealthIndexSnapshot {
  score: number;
  category: string;
  scoreBreakdown: HealthScoreBreakdown;
  streakCount: number;
  badges: string[];
  history: Array<{ date: string; score: number }>;
}

export interface DashboardSummary {
  healthIndex: HealthIndexSnapshot;
  weeklyRiskSummary: RiskFlag[];
  totalScansUsed: number;
  isPremium: boolean;
  premiumStatus: string;
  recentReceipts: ReceiptAnalysis[];
  recentLabels: LabelAnalysis[];
  recentDiaries: FoodDiaryAnalysis[];
}

export interface AgentInput {
  userId?: string;
  sourceType?: SourceType;
  fileName?: string;
  mimeType?: string;
  dataUri?: string;
  rawText?: string;
  healthGoals?: HealthGoal[];
  demoMode?: boolean;
}

export interface DiaryInput {
  userId?: string;
  diaryText?: string;
  entries?: ManualMealEntry[];
  healthGoals?: HealthGoal[];
  demoMode?: boolean;
}

export interface PaymentOrderResponse {
  id: string;
  amount: number;
  currency: string;
  plan: PlanType;
  mock: boolean;
}
