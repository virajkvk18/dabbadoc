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
import { saveReportRecord } from "@/lib/supabase/mutations";
import { reportSchema } from "@/lib/validators/api";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const user = await requireVerifiedUser();
    enforceReportRateLimit(request, user.id);
    enforceRequestSizeLimit(request, MAX_JSON_BYTES);

    const payload = reportSchema.parse(await request.json());
    const pdf = generateHealthReportPdf({
      ...payload,
      userName: payload.userName || user.email || "DabbaDoc User"
    });
    try {
      await saveReportRecord({
        userId: user.id,
        reportData: {
          ...payload.reportData,
          userName: payload.userName || user.email || "DabbaDoc User",
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
