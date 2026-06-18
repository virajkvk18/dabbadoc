import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  getFamilyOverview,
  inviteFamilyMember
} from "@/lib/supabase/family";
import {
  enforceFamilyRateLimit,
  enforceRequestSizeLimit,
  MAX_JSON_BYTES
} from "@/lib/security/abuse-protection";
import { ApiError, apiErrorResponse } from "@/lib/security/api-errors";
import { getAccountOverview } from "@/lib/supabase/account-overview";
import { familyInviteSchema } from "@/lib/validators/api";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const account = await getAccountOverview();
    if (account.profile.plan !== "premium_plus") {
      throw new ApiError("Premium Plus is required for family access.", 403);
    }
    return NextResponse.json(await getFamilyOverview());
  } catch (error) {
    return apiErrorResponse(error, "Could not load family members", 400, {
      request,
      route: "/api/family"
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const account = await getAccountOverview();
    enforceFamilyRateLimit(request, account.user.id, "invite");
    enforceRequestSizeLimit(request, MAX_JSON_BYTES);
    if (account.profile.plan !== "premium_plus") {
      throw new ApiError("Premium Plus is required to invite family members.", 403);
    }
    const payload = familyInviteSchema.parse(await request.json());
    const invite = await inviteFamilyMember(payload);
    return NextResponse.json({
      invite,
      message: "Family invite created. The member can accept after logging in with that email."
    });
  } catch (error) {
    return apiErrorResponse(error, "Could not invite family member", 400, {
      request,
      route: "/api/family"
    });
  }
}
