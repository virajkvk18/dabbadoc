import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { apiErrorResponse } from "@/lib/security/api-errors";
import { getFamilyMemberSummary } from "@/lib/supabase/family";

export const runtime = "nodejs";

const paramsSchema = z.object({
  memberId: z.string().uuid()
});

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ memberId: string }> }
) {
  try {
    const params = paramsSchema.parse(await context.params);
    return NextResponse.json(await getFamilyMemberSummary(params.memberId));
  } catch (error) {
    return apiErrorResponse(error, "Could not load family member summary", 400, {
      request,
      route: "/api/family/[memberId]/summary"
    });
  }
}
