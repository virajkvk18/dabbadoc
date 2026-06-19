import { type NextRequest } from "next/server";
import { authJson } from "@/lib/auth/responses";
import { clearSessionStartedCookie } from "@/lib/auth/session";
import { logSecurityEvent } from "@/lib/security/audit-log";
import { createSupabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServer();
  if (supabase) {
    const {
      data: { user }
    } = await supabase.auth.getUser();

    await supabase.auth.signOut();
    logSecurityEvent({
      type: "auth_success",
      request,
      userId: user?.id,
      status: 200,
      reason: "logout_success"
    });
  }

  const response = authJson({ message: "Logged out.", next: "/" });
  clearSessionStartedCookie(response);
  return response;
}
