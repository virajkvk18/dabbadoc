import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireVerifiedUser } from "@/lib/auth/require-user";
import { ApiError, apiErrorResponse } from "@/lib/security/api-errors";
import { getAccountOverview } from "@/lib/supabase/account-overview";
import {
  getHealthProfileDashboard,
  saveWellnessLogForUser
} from "@/lib/supabase/health-profile";
import { wellnessLogSchema } from "@/lib/validators/api";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const user = await requireVerifiedUser();
    const dashboard = await getHealthProfileDashboard(user.id);
    return NextResponse.json({ logs: dashboard.logs, setupRequired: dashboard.setupRequired });
  } catch (error) {
    return apiErrorResponse(error, "Wellness log failed", 400, {
      request,
      route: "/api/profile/wellness-log"
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireVerifiedUser();
    const account = await getAccountOverview();
    if (!account.profile.isPremium) {
      throw new ApiError("Premium is required to save wellness logs.", 403);
    }
    const log = wellnessLogSchema.parse(await request.json());
    await saveWellnessLogForUser(user.id, log);
    const dashboard = await getHealthProfileDashboard(user.id);
    return NextResponse.json({ logs: dashboard.logs, saved: true });
  } catch (error) {
    return apiErrorResponse(error, "Wellness log failed", 400, {
      request,
      route: "/api/profile/wellness-log"
    });
  }
}
