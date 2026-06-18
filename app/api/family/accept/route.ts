import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { apiErrorResponse } from "@/lib/security/api-errors";
import { respondToFamilyInvite } from "@/lib/supabase/family";
import { familyAcceptSchema } from "@/lib/validators/api";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const payload = familyAcceptSchema.parse(await request.json());
    return NextResponse.json(await respondToFamilyInvite(payload));
  } catch (error) {
    return apiErrorResponse(error, "Could not update family invite", 400, {
      request,
      route: "/api/family/accept"
    });
  }
}
