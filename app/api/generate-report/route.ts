import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireVerifiedUser } from "@/lib/auth/require-user";
import { apiErrorResponse } from "@/lib/security/api-errors";
import {
  enforceReportRateLimit,
  enforceRequestSizeLimit,
  MAX_JSON_BYTES
} from "@/lib/security/abuse-protection";
import { generateHealthReportPdf } from "@/lib/reports/pdf";
import { getAccountOverview } from "@/lib/supabase/account-overview";
import { getMyDiaryOverview } from "@/lib/supabase/my-diary";
import { saveReportRecord } from "@/lib/supabase/mutations";
import { reportSchema } from "@/lib/validators/api";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const user = await requireVerifiedUser();
    enforceReportRateLimit(request, user.id);
    enforceRequestSizeLimit(request, MAX_JSON_BYTES);

    const payload = reportSchema.parse(await request.json());
    const [account, diary] = await Promise.all([
      getAccountOverview(),
      getMyDiaryOverview()
    ]);
    const generatedAt = new Date().toISOString();
    const reportData = {
      generatedAt,
      healthScore: diary.today?.score ?? account.score.current,
      scoreCategory: diary.today?.status ?? account.score.category,
      scoreTrend: account.score.trendLabel,
      streakDays: diary.currentStreak,
      weeklyAverage: diary.weeklyAverage,
      topHealthPattern: diary.topPattern,
      predictiveHealthAlerts: diary.weeklyAlerts.map((alert) => ({
        title: alert.title,
        level: alert.level,
        reason: alert.reason,
        recommendation: alert.recommendation
      })),
      badges: account.badges,
      counts: account.counts,
      weeklyRiskSummary: account.riskSummary,
      recentActivities: account.recentActivities.map((activity) => ({
        type: activity.type,
        title: activity.title,
        detail: activity.detail,
        createdAt: activity.createdAt,
        score: activity.score
      }))
    };
    const pdf = generateHealthReportPdf({
      userName: account.profile.fullName || user.email || "DabbaDoc User",
      dateRange: payload.dateRange,
      generatedAt,
      reportData
    });
    try {
      await saveReportRecord({
        userId: user.id,
        reportData: {
          ...reportData,
          userName: account.profile.fullName || user.email || "DabbaDoc User",
          dateRange: payload.dateRange
        }
      });
    } catch {
      // Report generation should still succeed if history persistence is temporarily unavailable.
    }

    return new NextResponse(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="dabbadoc-health-report.pdf"'
      }
    });
  } catch (error) {
    return apiErrorResponse(error, "Could not generate report", 400, {
      request,
      route: "/api/generate-report"
    });
  }
}
