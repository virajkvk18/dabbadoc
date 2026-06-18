import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireVerifiedUser } from "@/lib/auth/require-user";
import { apiErrorResponse } from "@/lib/security/api-errors";
import {
  getHealthProfileDashboard,
  saveHealthProfileForUser
} from "@/lib/supabase/health-profile";
import { healthProfileSchema } from "@/lib/validators/api";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const user = await requireVerifiedUser();
    const dashboard = await getHealthProfileDashboard(user.id);
    return NextResponse.json(dashboard);
  } catch (error) {
    return apiErrorResponse(error, "Health profile failed", 400, {
      request,
      route: "/api/profile/health-context"
    });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireVerifiedUser();
    const profile = healthProfileSchema.parse(await request.json());
    await saveHealthProfileForUser(user.id, profile);
    return NextResponse.json({ profile, saved: true });
  } catch (error) {
    return apiErrorResponse(error, "Health profile failed", 400, {
      request,
      route: "/api/profile/health-context"
    });
  }
}
