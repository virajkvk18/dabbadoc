import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireVerifiedUser } from "@/lib/auth/require-user";
import { apiErrorResponse } from "@/lib/security/api-errors";
import { enforceAiGenerationRateLimit } from "@/lib/security/abuse-protection";
import type { DashboardSummary } from "@/types";
import { analyzeFoodDiary } from "@/lib/agents/foodDiaryAgent";
import { analyzeLabel } from "@/lib/agents/labelScanAgent";
import { analyzeReceipt } from "@/lib/agents/receiptScanAgent";
import { DABBADOC_DISCLAIMER } from "@/types";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const user = await requireVerifiedUser();
    enforceAiGenerationRateLimit(request, user.id, "health-index");

    const [receipt, label, diary] = await Promise.all([
      analyzeReceipt({ userId: user.id, demoMode: true }),
      analyzeLabel({ userId: user.id, demoMode: true }),
      analyzeFoodDiary({
        userId: user.id,
        diaryText:
          "Aaj breakfast me poha, lunch me dal chawal, evening me samosa, dinner me roti sabzi khayi.",
        demoMode: true
      })
    ]);

    const summary: DashboardSummary = {
      healthIndex: {
        score: receipt.healthScore,
        category: receipt.scoreCategory,
        scoreBreakdown: receipt.scoreBreakdown,
        streakCount: diary.streakCount,
        badges: diary.badgesEarned,
        history: [
          { date: "Mon", score: 58 },
          { date: "Tue", score: 62 },
          { date: "Wed", score: 64 },
          { date: "Thu", score: 67 },
          { date: "Fri", score: receipt.healthScore }
        ]
      },
      weeklyRiskSummary: receipt.riskFlags,
      totalScansUsed: 14,
      isPremium: false,
      premiumStatus: "Free trial active",
      recentReceipts: [receipt],
      recentLabels: [label],
      recentDiaries: [diary]
    };

    return NextResponse.json({ summary, disclaimer: DABBADOC_DISCLAIMER });
  } catch (error) {
    return apiErrorResponse(error, "Could not load health index", 400, {
      request,
      route: "/api/health-index"
    });
  }
}
