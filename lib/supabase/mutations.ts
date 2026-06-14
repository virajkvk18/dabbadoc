import "server-only";

import type {
  FoodDiaryAnalysis,
  LabelAnalysis,
  PlanType,
  ReceiptAnalysis,
  SourceType
} from "@/types";
import { ApiError } from "@/lib/security/api-errors";
import { createSupabaseAdmin } from "./admin";

type SupabaseAdmin = NonNullable<ReturnType<typeof createSupabaseAdmin>>;

function requireUserId(userId?: string) {
  if (!userId) {
    throw new ApiError("Authenticated user is required.", 401);
  }

  return userId;
}

async function verifyUploadOwner(
  supabase: SupabaseAdmin,
  userId: string,
  uploadId?: string | null
) {
  if (!uploadId) return;

  const { data, error } = await supabase
    .from("uploads")
    .select("id")
    .eq("id", uploadId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new ApiError("Could not verify upload ownership.", 500);
  }

  if (!data) {
    throw new ApiError("Upload not found for this account.", 403);
  }
}

export async function saveUploadRecord(params: {
  userId: string;
  fileUrl?: string | null;
  fileType?: string;
  sourceType: SourceType;
}) {
  const supabase = createSupabaseAdmin();
  const userId = requireUserId(params.userId);
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("uploads")
    .insert({
      user_id: userId,
      file_url: params.fileUrl,
      file_type: params.fileType,
      source_type: params.sourceType
    })
    .select("id")
    .single();

  if (error) {
    throw new ApiError("Could not save upload for this account.", 500);
  }

  return data.id as string;
}

export async function saveReceiptAnalysis(params: {
  userId: string;
  uploadId?: string | null;
  analysis: ReceiptAnalysis;
}) {
  const supabase = createSupabaseAdmin();
  const userId = requireUserId(params.userId);
  if (!supabase) return;

  await verifyUploadOwner(supabase, userId, params.uploadId);

  const { error } = await supabase.from("receipt_analyses").insert({
    user_id: userId,
    upload_id: params.uploadId,
    extracted_text: params.analysis.extractedText,
    detected_items: params.analysis.detectedItems,
    risk_flags: params.analysis.riskFlags,
    health_score: params.analysis.healthScore,
    cost_summary: params.analysis.costSummary,
    swaps: params.analysis.swaps,
    ai_summary: params.analysis.aiSummary
  });

  if (error) {
    throw new ApiError("Could not save receipt analysis for this account.", 500);
  }
}

export async function saveLabelAnalysis(params: {
  userId: string;
  uploadId?: string | null;
  analysis: LabelAnalysis;
}) {
  const supabase = createSupabaseAdmin();
  const userId = requireUserId(params.userId);
  if (!supabase) return;

  await verifyUploadOwner(supabase, userId, params.uploadId);

  const { error } = await supabase.from("label_analyses").insert({
    user_id: userId,
    upload_id: params.uploadId,
    product_name: params.analysis.productName,
    ingredients: params.analysis.ingredients,
    nutrition: params.analysis.nutrition,
    label_truth_score: params.analysis.labelTruthScore,
    warnings: params.analysis.warnings,
    better_alternatives: params.analysis.betterAlternatives,
    ai_summary: params.analysis.aiSummary
  });

  if (error) {
    throw new ApiError("Could not save label analysis for this account.", 500);
  }
}

export async function saveFoodDiary(params: {
  userId: string;
  analysis: FoodDiaryAnalysis;
}) {
  const supabase = createSupabaseAdmin();
  const userId = requireUserId(params.userId);
  if (!supabase) return;

  const { error } = await supabase.from("food_diaries").insert({
    user_id: userId,
    diary_text: params.analysis.diaryText,
    calories_estimate: params.analysis.caloriesEstimate,
    protein_estimate: params.analysis.proteinEstimate,
    good_items: params.analysis.goodFoods,
    risky_items: params.analysis.riskyFoods,
    suggestions: params.analysis.improvementTips,
    daily_score: params.analysis.dailyScore
  });

  if (error) {
    throw new ApiError("Could not save food diary for this account.", 500);
  }
}

export async function saveHealthIndex(params: {
  userId: string;
  score: number;
  scoreBreakdown: unknown;
  streakCount: number;
  badges: string[];
}) {
  const supabase = createSupabaseAdmin();
  const userId = requireUserId(params.userId);
  if (!supabase) return;

  const { error } = await supabase.from("health_index").insert({
    user_id: userId,
    score: params.score,
    score_breakdown: params.scoreBreakdown,
    streak_count: params.streakCount,
    badges: params.badges
  });

  if (error) {
    throw new ApiError("Could not save health index for this account.", 500);
  }
}

export async function saveReportRecord(params: {
  userId: string;
  reportUrl?: string | null;
  reportData?: Record<string, unknown>;
}) {
  const supabase = createSupabaseAdmin();
  const userId = requireUserId(params.userId);
  if (!supabase) return;

  const { error } = await supabase.from("reports").insert({
    user_id: userId,
    report_url: params.reportUrl ?? null,
    report_data: params.reportData ?? {}
  });

  if (error) {
    throw new ApiError("Could not save report history for this account.", 500);
  }
}

export async function savePaymentOrder(params: {
  userId: string;
  razorpayOrderId: string;
  amount: number;
  plan: PlanType;
  mock: boolean;
}) {
  const supabase = createSupabaseAdmin();
  const userId = requireUserId(params.userId);
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("payments")
    .insert({
      user_id: userId,
      razorpay_order_id: params.razorpayOrderId,
      status: params.mock ? "mock_created" : "created",
      amount: params.amount,
      plan: params.plan
    })
    .select("id")
    .single();

  if (error) {
    throw new ApiError("Could not save payment order for this account.", 500);
  }

  return data.id as string;
}

export async function getPaymentOrderForUser(params: {
  userId: string;
  razorpayOrderId: string;
}) {
  const supabase = createSupabaseAdmin();
  const userId = requireUserId(params.userId);
  if (!supabase) {
    throw new ApiError("Secure payment verification is temporarily unavailable.", 503);
  }

  const { data, error } = await supabase
    .from("payments")
    .select("id, amount, plan, status")
    .eq("user_id", userId)
    .eq("razorpay_order_id", params.razorpayOrderId)
    .maybeSingle();

  if (error) {
    throw new ApiError("Could not verify payment ownership.", 500);
  }

  return data;
}

export async function markPaymentCaptured(params: {
  userId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
}) {
  const supabase = createSupabaseAdmin();
  const userId = requireUserId(params.userId);
  if (!supabase) {
    throw new ApiError("Secure payment verification is temporarily unavailable.", 503);
  }

  const { data, error } = await supabase
    .from("payments")
    .update({
      razorpay_payment_id: params.razorpayPaymentId,
      status: "captured"
    })
    .eq("user_id", userId)
    .eq("razorpay_order_id", params.razorpayOrderId)
    .select("id")
    .maybeSingle();

  if (error) {
    throw new ApiError("Could not update payment for this account.", 500);
  }

  if (!data) {
    throw new ApiError("Payment order not found for this account.", 403);
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      is_premium: true,
      plan: "premium"
    })
    .eq("id", userId);

  if (profileError) {
    throw new ApiError("Could not update premium access for this account.", 500);
  }

  return data.id as string;
}

export async function markPaymentCapturedByOrderId(params: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
}) {
  const supabase = createSupabaseAdmin();
  if (!supabase) {
    throw new ApiError("Secure payment verification is temporarily unavailable.", 503);
  }

  const { data, error } = await supabase
    .from("payments")
    .update({
      razorpay_payment_id: params.razorpayPaymentId,
      status: "captured"
    })
    .eq("razorpay_order_id", params.razorpayOrderId)
    .select("id, user_id")
    .maybeSingle();

  if (error) {
    throw new ApiError("Could not update payment from webhook.", 500);
  }

  if (!data) return null;

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      is_premium: true,
      plan: "premium"
    })
    .eq("id", data.user_id);

  if (profileError) {
    throw new ApiError("Could not update premium access from webhook.", 500);
  }

  return data.id as string;
}
