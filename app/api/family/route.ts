import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  getFamilyOverview,
  inviteFamilyMember
} from "@/lib/supabase/family";
import { apiErrorResponse } from "@/lib/security/api-errors";
import { familyInviteSchema } from "@/lib/validators/api";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
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
