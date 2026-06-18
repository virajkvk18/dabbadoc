import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { ApiError, apiErrorResponse } from "@/lib/security/api-errors";
import { getAccountOverview } from "@/lib/supabase/account-overview";
import {
  getFamilyMemberSummary,
  removeFamilyConnection
} from "@/lib/supabase/family";

export const runtime = "nodejs";

const paramsSchema = z.object({
  memberId: z.string().uuid()
});

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ memberId: string }> }
) {
  try {
    const account = await getAccountOverview();
    if (account.profile.plan !== "premium_plus") {
      throw new ApiError("Premium Plus is required for family access.", 403);
    }
    const params = paramsSchema.parse(await context.params);
    return NextResponse.json(await getFamilyMemberSummary(params.memberId));
  } catch (error) {
    return apiErrorResponse(error, "Could not load family member summary", 400, {
      request,
      route: "/api/family/[memberId]"
    });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ memberId: string }> }
) {
  try {
    const account = await getAccountOverview();
    if (account.profile.plan !== "premium_plus") {
      throw new ApiError("Premium Plus is required for family access.", 403);
    }
    const params = paramsSchema.parse(await context.params);
    return NextResponse.json(await removeFamilyConnection(params.memberId));
  } catch (error) {
    return apiErrorResponse(error, "Could not remove family connection", 400, {
      request,
      route: "/api/family/[memberId]"
    });
  }
}
