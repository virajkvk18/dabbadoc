import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { analyzeFoodDiaryWithDabbaAgent } from "@/lib/agents/dabbaAgentClient";
import { analyzeFoodDiary } from "@/lib/agents/foodDiaryAgent";
import { requireVerifiedUser } from "@/lib/auth/require-user";
import { apiErrorResponse } from "@/lib/security/api-errors";
import {
  enforceAiGenerationRateLimit,
  enforceRequestSizeLimit,
  MAX_JSON_BYTES
} from "@/lib/security/abuse-protection";
import { getHealthContextForUser } from "@/lib/supabase/health-profile";
import { saveFoodDiary, saveHealthIndex } from "@/lib/supabase/mutations";
import { foodDiarySchema } from "@/lib/validators/api";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const user = await requireVerifiedUser();
    enforceAiGenerationRateLimit(request, user.id, "food-diary");
    enforceRequestSizeLimit(request, MAX_JSON_BYTES);

    const payload = foodDiarySchema.parse(await request.json());
    const healthContext = await getHealthContextForUser(user.id);
    const healthGoals = Array.from(new Set([...healthContext.goals, ...payload.healthGoals]));
    const diaryInput = {
      userId: user.id,
      diaryText: payload.diaryText,
      entries: payload.entries,
      healthGoals,
      healthContext: healthContext.context,
      demoMode: payload.demoMode
    };
    const analysis =
      (await analyzeFoodDiaryWithDabbaAgent(diaryInput)) ??
      (await analyzeFoodDiary(diaryInput));

    await saveFoodDiary({
      userId: user.id,
      analysis
    });
    await saveHealthIndex({
      userId: user.id,
      score: analysis.dailyScore,
      scoreBreakdown: {},
      streakCount: analysis.streakCount,
      badges: analysis.badgesEarned
    });

    return NextResponse.json({ analysis, saved: true });
  } catch (error) {
    return apiErrorResponse(error, "Food diary failed", 400, {
      request,
      route: "/api/food-diary"
    });
  }
}
