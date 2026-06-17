import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireVerifiedUser } from "@/lib/auth/require-user";
import { enforceAiGenerationRateLimit } from "@/lib/security/abuse-protection";
import { apiErrorResponse } from "@/lib/security/api-errors";
import { getAccountOverview } from "@/lib/supabase/account-overview";
import { DABBADOC_DISCLAIMER } from "@/types";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const user = await requireVerifiedUser();
    enforceAiGenerationRateLimit(request, user.id, "health-index");

    const account = await getAccountOverview();

    return NextResponse.json({
      summary: {
        profile: {
          fullName: account.profile.fullName,
          email: account.profile.email,
          plan: account.profile.plan,
          planLabel: account.profile.planLabel,
          isPremium: account.profile.isPremium
        },
        healthIndex: {
          score: account.score.current,
          category: account.score.category,
          streakCount: account.streak.days,
          badges: account.badges,
          history: account.score.chart
        },
        weeklyRiskSummary: account.riskSummary,
        totalScansUsed: account.counts.scans,
        premiumStatus: account.profile.isPremium
          ? `${account.profile.planLabel} active`
          : "Free plan",
        counts: account.counts,
        recentActivities: account.recentActivities
      },
      disclaimer: DABBADOC_DISCLAIMER
    });
  } catch (error) {
    return apiErrorResponse(error, "Could not load health index", 400, {
      request,
      route: "/api/health-index"
    });
  }
}
